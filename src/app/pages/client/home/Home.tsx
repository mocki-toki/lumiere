import React, { MouseEventHandler, forwardRef, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
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
import { useAlternativeSidebarSetting } from '../../../features/settings/lumiere-settings/store';
import { AlternativeSidebarCreateFab } from '../sidebar/AlternativeSidebarCreateFab';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useOrphanSpaces } from '../../../state/hooks/roomList';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { nameInitials } from '../../../utils/common';
import { UserAvatar } from '../../../components/user-avatar';
import { Modal500 } from '../../../components/Modal500';
import { Settings } from '../../../features/settings';

type HomeMenuProps = {
  alternativeSidebar: boolean;
  onOpenSettings: () => void;
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(
  ({ alternativeSidebar, onOpenSettings, requestClose }, ref) => {
    const navigate = useNavigate();
    const orphanRooms = useHomeRooms();
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const unread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
    const mx = useMatrixClient();
    const useAuthentication = useMediaAuthentication();
    const userId = mx.getUserId() ?? '';
    const profile = useUserProfile(userId);
    const displayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
    const avatarUrl = profile.avatarUrl
      ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
      : undefined;

    const handleMarkAsRead = () => {
      if (!unread) return;
      orphanRooms.forEach((rId) => markAsRead(mx, rId, hideActivity));
      requestClose();
    };

    if (alternativeSidebar) {
      const handleInbox = () => {
        const path =
          unread && unread.total > 0 ? getInboxInvitesPath() : getInboxNotificationsPath();
        navigate(path);
        requestClose();
      };
      const handleOpenSettings = () => {
        onOpenSettings();
        requestClose();
      };

      return (
        <Menu ref={ref} style={{ width: 'max-content', maxWidth: toRem(320) }}>
          <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
            <MenuItem
              onClick={handleMarkAsRead}
              size="300"
              after={<Icon size="100" src={Icons.CheckTwice} />}
              radii="300"
              aria-disabled={!unread}
            >
              <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                Mark as Read
              </Text>
            </MenuItem>
          </Box>
          <Line variant="Surface" size="300" />
          <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
            <MenuItem
              onClick={handleInbox}
              size="300"
              after={<Icon size="100" src={Icons.Inbox} />}
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
                <Avatar size="200" radii="300">
                  <UserAvatar
                    userId={userId}
                    src={avatarUrl}
                    renderFallback={() => <Text size="H6">{nameInitials(displayName)}</Text>}
                  />
                </Avatar>
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
            after={<Icon size="100" src={Icons.CheckTwice} />}
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
  searchSelected,
  onSearchClick,
}: {
  alternativeSidebar: boolean;
  searchSelected: boolean;
  onSearchClick: () => void;
}) {
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
            <Text size="H4" truncate>
              Home
            </Text>
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

const HOME_CATEGORY_ID = makeNavCategoryId('home', 'room');
export function Home() {
  const mx = useMatrixClient();
  useNavToActivePathMapper('home');
  const [alternativeSidebar] = useAlternativeSidebarSetting();
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
    estimateSize: () => 38,
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );
  const handleSearchClick = () => navigate(getHomeSearchPath());

  return (
    <PageNav>
      <Box grow="Yes" direction="Column" style={{ position: 'relative' }}>
        <HomeHeader
          alternativeSidebar={alternativeSidebar}
          searchSelected={searchSelected}
          onSearchClick={handleSearchClick}
        />
        {noRoomToDisplay ? (
          <HomeEmpty />
        ) : (
          <PageNavContent scrollRef={scrollRef}>
            <Box direction="Column" gap="300">
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

                    return (
                      <VirtualTile
                        virtualItem={vItem}
                        key={vItem.index}
                        ref={roomsVirtualizer.measureElement}
                      >
                        <RoomNavItem
                          room={room}
                          selected={selected}
                          showAvatar={isDirect || isSpace}
                          direct={isDirect}
                          linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
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
