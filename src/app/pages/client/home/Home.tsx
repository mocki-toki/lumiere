import React, { MouseEventHandler, forwardRef, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Line,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Text,
  color,
  config,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtom, useAtomValue } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { factoryRoomIdByActivity, factoryRoomIdByAtoZ } from '../../../utils/sort';
import {
  NavButton,
  NavCategory,
  NavCategoryHeader,
  NavEmptyCenter,
  NavEmptyLayout,
  NavItem,
  NavItemContent,
} from '../../../components/nav';
import {
  encodeSearchParamValueArray,
  getExplorePath,
  getInboxInvitesPath,
  getInboxNotificationsPath,
  getHomeCreatePath,
  getHomeRoomPath,
  getHomeSearchPath,
  getSpaceLobbyPath,
  withSearchParam,
} from '../../pathUtils';
import { getCanonicalAliasOrRoomId, getMxIdLocalPart, mxcUrlToHttp } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import {
  useHomeCreateSelected,
  useHomeSearchSelected,
} from '../../../hooks/router/useHomeSelected';
import { useHomeRooms } from './useHomeRooms';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { markAsRead } from '../../../utils/notifications';
import { getSpaceChildren } from '../../../utils/room';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { mDirectAtom } from '../../../state/mDirectList';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { JoinAddressPrompt } from '../../../components/join-address-prompt';
import { _RoomSearchParams } from '../../paths';
import {
  useAlternativeSidebarSetting,
  useCompactChatsSetting,
  useRoundAvatarsSetting,
  useShowLastMessageSetting,
} from '../../../features/settings/lumiere-settings/store';
import { AlternativeSidebarCreateFab } from '../sidebar/AlternativeSidebarCreateFab';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useOrphanSpaces } from '../../../state/hooks/roomList';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { nameInitials } from '../../../utils/common';
import { UserAvatar } from '../../../components/user-avatar';
import { Modal500 } from '../../../components/Modal500';
import { Settings, SettingsPages } from '../../../features/settings';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import LogoSVG from '../../../../../public/res/svg/cinny.svg';
import { useCrossSigningActive } from '../../../hooks/useCrossSigning';
import { useDeviceIds, useDeviceList, useSplitCurrentDevice } from '../../../hooks/useDeviceList';
import {
  useDeviceVerificationStatus,
  useUnverifiedDeviceCount,
  VerificationStatus,
} from '../../../hooks/useDeviceVerificationStatus';

type HomeMenuProps = {
  alternativeSidebar: boolean;
  onOpenSettings: () => void;
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(
  ({ alternativeSidebar, onOpenSettings, requestClose }, ref) => {
    const screenSize = useScreenSizeContext();
    const touchMenu = screenSize === ScreenSize.Mobile || screenSize === ScreenSize.Tablet;
    const menuIconSize = touchMenu ? '200' : '100';
    const menuIconWrapStyle = touchMenu ? { marginLeft: config.space.S500 } : undefined;
    const menuMaxWidth = touchMenu ? toRem(320) : toRem(320);
    const menuGroupGap = touchMenu ? '200' : '100';
    const menuGroupPadding = touchMenu ? config.space.S200 : config.space.S100;
    const navigate = useNavigate();
    const mx = useMatrixClient();
    const orphanRooms = useHomeRooms();
    const directRooms = useDirectRooms();
    const roomToParents = useAtomValue(roomToParentsAtom);
    const spaces = useOrphanSpaces(mx, allRoomsAtom, roomToParents);
    const combinedRooms = useMemo(
      () => Array.from(new Set([...orphanRooms, ...directRooms, ...spaces])),
      [orphanRooms, directRooms, spaces]
    );
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
    const combinedUnread = useRoomsUnread(combinedRooms, roomToUnreadAtom);
    const useAuthentication = useMediaAuthentication();
    const userId = mx.getUserId() ?? '';
    const profile = useUserProfile(userId);
    const displayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
    const avatarUrl = profile.avatarUrl
      ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
      : undefined;

    const handleMarkAsRead = () => {
      const targetRooms = alternativeSidebar ? combinedRooms : orphanRooms;
      const targetUnread = alternativeSidebar ? combinedUnread : unread;
      if (!targetUnread) return;
      targetRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
      requestClose();
    };

    if (alternativeSidebar) {
      const handleInbox = () => {
        const path =
          combinedUnread && combinedUnread.total > 0
            ? getInboxInvitesPath()
            : getInboxNotificationsPath();
        navigate(path);
        requestClose();
      };
      const handleOpenSettings = () => {
        onOpenSettings();
        requestClose();
      };

      return (
        <Menu ref={ref} style={{ width: 'max-content', maxWidth: menuMaxWidth }}>
          <Box direction="Column" gap={menuGroupGap} style={{ padding: menuGroupPadding }}>
            <MenuItem
              onClick={handleMarkAsRead}
              size="300"
              after={
                <Box style={menuIconWrapStyle}>
                  <Icon size={menuIconSize} src={Icons.CheckTwice} />
                </Box>
              }
              radii="300"
              aria-disabled={!combinedUnread}
            >
              <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                Mark as Read
              </Text>
            </MenuItem>
          </Box>
          <Line variant="Surface" size="300" />
          <Box direction="Column" gap={menuGroupGap} style={{ padding: menuGroupPadding }}>
            <MenuItem
              onClick={handleInbox}
              size="300"
              after={
                <Box style={menuIconWrapStyle}>
                  <Icon size={menuIconSize} src={Icons.Inbox} />
                </Box>
              }
              radii="300"
            >
              <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                Inbox
              </Text>
            </MenuItem>
            <MenuItem
              onClick={handleOpenSettings}
              size="300"
              after={
                <Box
                  style={{
                    marginLeft: config.space.S200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Avatar
                    size="200"
                    radii="Pill"
                    style={{ width: toRem(18), height: toRem(18), overflow: 'hidden' }}
                  >
                    <UserAvatar
                      userId={userId}
                      src={avatarUrl}
                      renderFallback={() => <Text size="T200">{nameInitials(displayName)}</Text>}
                    />
                  </Avatar>
                </Box>
              }
              radii="300"
            >
              <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                User Settings
              </Text>
            </MenuItem>
          </Box>
        </Menu>
      );
    }

    return (
      <Menu ref={ref} style={{ width: 'max-content', maxWidth: toRem(240) }}>
        <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
          <MenuItem
            onClick={handleMarkAsRead}
            size="300"
            after={
              <Box style={menuIconWrapStyle}>
                <Icon size={menuIconSize} src={Icons.CheckTwice} />
              </Box>
            }
            radii="300"
            aria-disabled={!unread}
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Mark as Read
            </Text>
          </MenuItem>
        </Box>
      </Menu>
    );
  }
);

function HomeHeader({
  alternativeSidebar,
  compactChats,
  searchSelected,
  onSearchClick,
}: {
  alternativeSidebar: boolean;
  compactChats: boolean;
  searchSelected: boolean;
  onSearchClick: () => void;
}) {
  const screenSize = useScreenSizeContext();
  let logoMarginLeft = '7px';
  let logoMarginRight = '7px';
  if (screenSize === ScreenSize.Mobile) {
    logoMarginLeft = '10px';
    logoMarginRight = '11px';
  } else if (screenSize === ScreenSize.Desktop) {
    logoMarginLeft = '17px';
    logoMarginRight = '7px';
  }

  let compactLogoMarginLeft = '5px';
  let compactLogoMarginRight = '5px';
  if (screenSize === ScreenSize.Mobile) {
    compactLogoMarginLeft = '6px';
    compactLogoMarginRight = '7px';
  } else if (screenSize === ScreenSize.Tablet) {
    compactLogoMarginLeft = '0px';
    compactLogoMarginRight = '0px';
  } else if (screenSize === ScreenSize.Desktop) {
    compactLogoMarginLeft = '10px';
    compactLogoMarginRight = '0px';
  }
  let mobileTitleGroupOffset: string | undefined;
  if (alternativeSidebar) {
    if (screenSize === ScreenSize.Mobile) mobileTitleGroupOffset = '4px';
    else if (screenSize === ScreenSize.Tablet) mobileTitleGroupOffset = '2px';
  }
  let mobileTitleTextOffset: string | undefined;
  if (alternativeSidebar) {
    if (screenSize === ScreenSize.Mobile) mobileTitleTextOffset = '1px';
    else if (screenSize === ScreenSize.Tablet) mobileTitleTextOffset = compactChats ? '1px' : '2px';
    else if (screenSize === ScreenSize.Desktop) mobileTitleTextOffset = compactChats ? '1px' : '2px';
  }
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();
  const [settings, setSettings] = useState(false);

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes">
            <Box alignItems="Center" gap="300" style={{ marginLeft: mobileTitleGroupOffset }}>
              {alternativeSidebar && (
                <img
                  src={LogoSVG}
                  alt="Lumiere"
                  style={{
                    width: toRem(24),
                    height: toRem(24),
                    marginLeft: compactChats ? compactLogoMarginLeft : logoMarginLeft,
                    marginRight: compactChats ? compactLogoMarginRight : logoMarginRight,
                  }}
                />
              )}
              <Text
                size="H4"
                truncate
                style={
                  alternativeSidebar
                    ? { fontWeight: 500, marginLeft: mobileTitleTextOffset }
                    : undefined
                }
              >
                {alternativeSidebar ? 'Lumiere' : 'Home'}
              </Text>
            </Box>
          </Box>
          <Box gap="100">
            <IconButton aria-pressed={searchSelected} variant="Background" onClick={onSearchClick}>
              <Icon src={Icons.Search} size="200" filled={searchSelected} />
            </IconButton>
            <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <HomeMenu
              alternativeSidebar={alternativeSidebar}
              onOpenSettings={() => setSettings(true)}
              requestClose={() => setMenuAnchor(undefined)}
            />
          </FocusTrap>
        }
      />
      {settings && (
        <Modal500 requestClose={() => setSettings(false)}>
          <Settings requestClose={() => setSettings(false)} />
        </Modal500>
      )}
    </>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Hash} />}
        title={
          <Text size="H5" align="Center">
            No Rooms
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            You do not have any rooms yet.
          </Text>
        }
        options={
          <>
            <Button onClick={() => navigate(getHomeCreatePath())} variant="Secondary" size="300">
              <Text size="B300" truncate>
                Create Room
              </Text>
            </Button>
            <Button
              onClick={() => navigate(getExplorePath())}
              variant="Secondary"
              fill="Soft"
              size="300"
            >
              <Text size="B300" truncate>
                Explore Community Rooms
              </Text>
            </Button>
          </>
        }
      />
    </NavEmptyCenter>
  );
}

function HomeUnverifiedItem({
  compactChats,
  roundAvatars,
  showLastMessage,
}: {
  compactChats: boolean;
  roundAvatars: boolean;
  showLastMessage: boolean;
}) {
  const screenSize = useScreenSizeContext();
  const mobile = screenSize === ScreenSize.Mobile;
  const crossSigningActive = useCrossSigningActive();
  const mx = useMatrixClient();
  const crypto = mx.getCrypto();
  const [devices] = useDeviceList();
  const [currentDevice, otherDevices] = useSplitCurrentDevice(devices);
  const verificationStatus = useDeviceVerificationStatus(
    crypto,
    mx.getSafeUserId(),
    currentDevice?.device_id
  );
  const unverified = verificationStatus === VerificationStatus.Unverified;
  const otherDevicesId = useDeviceIds(otherDevices);
  const unverifiedDeviceCount = useUnverifiedDeviceCount(crypto, mx.getSafeUserId(), otherDevicesId);
  const [settings, setSettings] = useState(false);

  if (!crossSigningActive) return null;
  const hasUnverified = unverified || (unverifiedDeviceCount !== undefined && unverifiedDeviceCount > 0);
  if (!hasUnverified) return null;
  const unverifiedLabel = unverified ? 'Unverified Device' : 'Unverified Devices';
  const unverifiedColor = unverified ? color.Critical.Main : color.Warning.Main;
  const unverifiedSubtitleColor = unverified ? color.Critical.Main : color.Warning.Main;
  const unverifiedSubtitle = unverified
    ? 'Encrypted messages may be unavailable'
    : 'Action is required to verify devices';
  const horizontalPadding =
    screenSize === ScreenSize.Desktop ? config.space.S300 : config.space.S100;
  let avatarSize: '200' | '300' | '400';
  if (mobile) {
    avatarSize = compactChats ? '300' : '400';
  } else {
    avatarSize = compactChats ? '200' : '300';
  }
  let avatarSizePx = 50;
  if (avatarSize === '200') avatarSizePx = 28;
  else if (avatarSize === '300') avatarSizePx = 43;
  const unverifiedAvatarStyle = {
    width: toRem(avatarSizePx),
    height: toRem(avatarSizePx),
  };

  return (
    <>
      <NavItem
        variant="Background"
        radii="400"
        aria-selected={settings}
        style={{ margin: 0, marginBottom: config.space.S100 }}
      >
        <NavButton onClick={() => setSettings(true)}>
          <NavItemContent
            style={{
              paddingLeft: horizontalPadding,
              paddingTop: compactChats ? config.space.S100 : config.space.S200,
              paddingBottom: compactChats ? config.space.S100 : config.space.S200,
            }}
          >
            <Box as="span" grow="Yes" alignItems="Center" gap="300">
              <Avatar
                size={avatarSize}
                radii={roundAvatars ? 'Pill' : '400'}
                style={unverifiedAvatarStyle}
              >
                <Icon style={{ color: unverifiedColor }} src={Icons.ShieldUser} />
              </Avatar>
              <Box as="span" grow="Yes" direction="Column" gap="50">
                <Text
                  as="span"
                  size={compactChats ? 'Inherit' : 'T400'}
                  style={{ fontWeight: 500, color: unverifiedColor }}
                  truncate
                >
                  {unverifiedLabel}
                </Text>
                {showLastMessage && (
                  <Text
                    as="span"
                    size={compactChats ? 'T200' : 'T300'}
                    style={{ color: unverifiedSubtitleColor, opacity: 0.8 }}
                    truncate
                  >
                    {unverifiedSubtitle}
                  </Text>
                )}
              </Box>
              {!unverified && unverifiedDeviceCount && unverifiedDeviceCount > 0 && (
                <Badge variant="Warning" size="400" fill="Solid" radii="Pill" outlined={false}>
                  <Text as="span" size="L400">
                    {unverifiedDeviceCount}
                  </Text>
                </Badge>
              )}
            </Box>
          </NavItemContent>
        </NavButton>
      </NavItem>
      {settings && (
        <Modal500 requestClose={() => setSettings(false)}>
          <Settings initialPage={SettingsPages.DevicesPage} requestClose={() => setSettings(false)} />
        </Modal500>
      )}
    </>
  );
}

const HOME_CATEGORY_ID = makeNavCategoryId('home', 'room');
export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const [alternativeSidebar] = useAlternativeSidebarSetting();
  const [showLastMessage] = useShowLastMessageSetting();
  const [compactChats] = useCompactChatsSetting();
  const [roundAvatars] = useRoundAvatarsSetting();
  const scrollRef = useRef<HTMLDivElement>(null);
  const rooms = useHomeRooms();
  const directs = useDirectRooms();
  const roomToParents = useAtomValue(roomToParentsAtom);
  const spaces = useOrphanSpaces(mx, allRoomsAtom, roomToParents);
  const mDirects = useAtomValue(mDirectAtom);
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const navigate = useNavigate();

  const selectedRoomId = useSelectedRoom();
  const createRoomSelected = useHomeCreateSelected();
  const searchSelected = useHomeSearchSelected();
  const noRoomToDisplay = alternativeSidebar
    ? rooms.length === 0 && directs.length === 0 && spaces.length === 0
    : rooms.length === 0;
  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());

  const sortedHomeRooms = useMemo(() => {
    const items = Array.from(rooms).sort(
      closedCategories.has(HOME_CATEGORY_ID) ? factoryRoomIdByActivity(mx) : factoryRoomIdByAtoZ(mx)
    );
    if (closedCategories.has(HOME_CATEGORY_ID)) {
      return items.filter((rId) => roomToUnread.has(rId) || rId === selectedRoomId);
    }
    return items;
  }, [mx, rooms, closedCategories, roomToUnread, selectedRoomId]);

  const sortedCombinedRooms = useMemo(() => {
    const items = Array.from(new Set([...rooms, ...directs, ...spaces])).sort(
      factoryRoomIdByActivity(mx)
    );
    if (!alternativeSidebar && closedCategories.has(HOME_CATEGORY_ID)) {
      return items.filter((rId) => roomToUnread.has(rId) || rId === selectedRoomId);
    }
    return items;
  }, [
    mx,
    rooms,
    directs,
    spaces,
    alternativeSidebar,
    closedCategories,
    roomToUnread,
    selectedRoomId,
  ]);

  const displayRooms = alternativeSidebar ? sortedCombinedRooms : sortedHomeRooms;

  const roomsVirtualizer = useVirtualizer({
    count: displayRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => {
      if (!alternativeSidebar) return 38;
      if (!compactChats && !showLastMessage) return 44;
      if (showLastMessage) return compactChats ? 52 : 60;
      return 38;
    },
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );
  const handleSearchClick = () => navigate(getHomeSearchPath());

  return (
    <PageNav size={alternativeSidebar ? '500' : '400'}>
      <Box grow="Yes" direction="Column" style={{ position: 'relative' }}>
        <HomeHeader
          alternativeSidebar={alternativeSidebar}
          compactChats={compactChats}
          searchSelected={searchSelected}
          onSearchClick={handleSearchClick}
        />
        {noRoomToDisplay ? (
          <HomeEmpty />
        ) : (
          <PageNavContent scrollRef={scrollRef}>
            <Box direction="Column" gap={alternativeSidebar ? '0' : '300'}>
              {!alternativeSidebar && (
                <NavCategory>
                  <NavItem variant="Background" radii="400" aria-selected={createRoomSelected}>
                    <NavButton onClick={() => navigate(getHomeCreatePath())}>
                      <NavItemContent>
                        <Box as="span" grow="Yes" alignItems="Center" gap="200">
                          <Avatar size="200" radii="400">
                            <Icon src={Icons.Plus} size="100" />
                          </Avatar>
                          <Box as="span" grow="Yes">
                            <Text as="span" size="Inherit" truncate>
                              Create Room
                            </Text>
                          </Box>
                        </Box>
                      </NavItemContent>
                    </NavButton>
                  </NavItem>
                  <UseStateProvider initial={false}>
                    {(open, setOpen) => (
                      <>
                        <NavItem variant="Background" radii="400">
                          <NavButton onClick={() => setOpen(true)}>
                            <NavItemContent>
                              <Box as="span" grow="Yes" alignItems="Center" gap="200">
                                <Avatar size="200" radii="400">
                                  <Icon src={Icons.Link} size="100" />
                                </Avatar>
                                <Box as="span" grow="Yes">
                                  <Text as="span" size="Inherit" truncate>
                                    Join with Address
                                  </Text>
                                </Box>
                              </Box>
                            </NavItemContent>
                          </NavButton>
                        </NavItem>
                        {open && (
                          <JoinAddressPrompt
                            onCancel={() => setOpen(false)}
                            onOpen={(roomIdOrAlias, viaServers, eventId) => {
                              setOpen(false);
                              const path = getHomeRoomPath(roomIdOrAlias, eventId);
                              navigate(
                                viaServers
                                  ? withSearchParam<_RoomSearchParams>(path, {
                                      viaServers: encodeSearchParamValueArray(viaServers),
                                    })
                                  : path
                              );
                            }}
                          />
                        )}
                      </>
                    )}
                  </UseStateProvider>
                </NavCategory>
              )}
              <NavCategory>
                {alternativeSidebar && (
                  <HomeUnverifiedItem
                    compactChats={compactChats}
                    roundAvatars={roundAvatars}
                    showLastMessage={showLastMessage}
                  />
                )}
                {!alternativeSidebar && (
                  <NavCategoryHeader>
                    <RoomNavCategoryButton
                      closed={closedCategories.has(HOME_CATEGORY_ID)}
                      data-category-id={HOME_CATEGORY_ID}
                      onClick={handleCategoryClick}
                    >
                      Rooms
                    </RoomNavCategoryButton>
                  </NavCategoryHeader>
                )}
                <div
                  style={{
                    position: 'relative',
                    height: roomsVirtualizer.getTotalSize(),
                  }}
                >
                  {roomsVirtualizer.getVirtualItems().map((vItem) => {
                    const roomId = displayRooms[vItem.index];
                    const room = mx.getRoom(roomId);
                    if (!room) return null;
                    const selected = selectedRoomId === roomId;
                    const isDirect = alternativeSidebar && mDirects.has(roomId);
                    const isSpace = alternativeSidebar && room.getType() === 'm.space';
                    const previewSourceRoom = isSpace
                      ? getSpaceChildren(room)
                          .map((childId) => mx.getRoom(childId))
                          .filter((childRoom): childRoom is NonNullable<typeof childRoom> =>
                            Boolean(childRoom)
                          )
                          .sort(
                            (a, b) =>
                              (b.getLastActiveTimestamp() ?? Number.MIN_SAFE_INTEGER) -
                              (a.getLastActiveTimestamp() ?? Number.MIN_SAFE_INTEGER)
                          )[0] ?? room
                      : room;

                    return (
                      <VirtualTile
                        virtualItem={vItem}
                        key={vItem.index}
                        ref={roomsVirtualizer.measureElement}
                      >
                        <RoomNavItem
                          room={room}
                          selected={selected}
                          showAvatar={alternativeSidebar ? true : isDirect || isSpace}
                          direct={isDirect}
                          showLastMessage={alternativeSidebar && showLastMessage}
                          compactChats={!alternativeSidebar || compactChats}
                          alternativeSidebarLayout={alternativeSidebar}
                          roundAvatars={roundAvatars}
                          previewSourceRoom={previewSourceRoom}
                          linkPath={
                            isSpace
                              ? getSpaceLobbyPath(getCanonicalAliasOrRoomId(mx, roomId))
                              : getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))
                          }
                          notificationMode={getRoomNotificationMode(
                            notificationPreferences,
                            room.roomId
                          )}
                        />
                      </VirtualTile>
                    );
                  })}
                </div>
              </NavCategory>
            </Box>
          </PageNavContent>
        )}
        {alternativeSidebar && <AlternativeSidebarCreateFab />}
      </Box>
    </PageNav>
  );
}
