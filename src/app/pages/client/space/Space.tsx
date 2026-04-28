import React, {
  MouseEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Line,
  Menu,
  MenuItem,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  PopOut,
  RectCords,
  Spinner,
  Text,
  color,
  config,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JoinRule, Room } from 'matrix-js-sdk';
import { RoomJoinRulesEventContent } from 'matrix-js-sdk/lib/types';
import FocusTrap from 'focus-trap-react';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { mDirectAtom } from '../../../state/mDirectList';
import {
  NavCategory,
  NavCategoryHeader,
  NavButton,
  NavItem,
  NavItemContent,
  NavLink,
} from '../../../components/nav';
import {
  getHomePath,
  getSpaceLobbyPath,
  getSpacePath,
  getSpaceRoomPath,
  getSpaceSearchPath,
} from '../../pathUtils';
import { getCanonicalAliasOrRoomId, isRoomAlias, mxcUrlToHttp } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import {
  useSpaceLobbySelected,
  useSpaceSearchSelected,
  useSelectedSpace,
} from '../../../hooks/router/useSelectedSpace';
import { useSpace } from '../../../hooks/useSpace';
import { VirtualTile } from '../../../components/virtualizer';
import { RoomNavCategoryButton, RoomNavItem } from '../../../features/room-nav';
import { makeNavCategoryId } from '../../../state/closedNavCategories';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { useCategoryHandler } from '../../../hooks/useCategoryHandler';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { useRoomName } from '../../../hooks/useRoomMeta';
import { useFetchSpaceHierarchyLevel, useSpaceJoinedHierarchy } from '../../../hooks/useSpaceHierarchy';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import { usePowerLevels } from '../../../hooks/usePowerLevels';
import { useRecursiveChildScopeFactory, useSpaceChildren } from '../../../state/hooks/roomList';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { markAsRead } from '../../../utils/notifications';
import { useRoomsUnread } from '../../../state/hooks/unread';
import { UseStateProvider } from '../../../components/UseStateProvider';
import { LeaveSpacePrompt } from '../../../components/leave-space-prompt';
import { copyToClipboard } from '../../../utils/dom';
import { useClosedNavCategoriesAtom } from '../../../state/hooks/closedNavCategories';
import { useStateEvent } from '../../../hooks/useStateEvent';
import { Membership, StateEvent } from '../../../../types/matrix/room';
import { stopPropagation } from '../../../utils/keyboard';
import { getMatrixToRoom } from '../../../plugins/matrix-to';
import { getViaServers } from '../../../plugins/via-servers';
import { getSpaceChildren } from '../../../utils/room';
import { RoomAvatar, RoomIcon } from '../../../components/room-avatar';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import {
  getRoomNotificationMode,
  useRoomsNotificationPreferencesContext,
} from '../../../hooks/useRoomsNotificationPreferences';
import { useOpenSpaceSettings } from '../../../state/hooks/spaceSettings';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { useRoomCreators } from '../../../hooks/useRoomCreators';
import { useRoomPermissions } from '../../../hooks/useRoomPermissions';
import { ContainerColor } from '../../../styles/ContainerColor.css';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { BreakWord } from '../../../styles/Text.css';
import { InviteUserPrompt } from '../../../components/invite-user-prompt';
import { useCallEmbed } from '../../../hooks/useCallEmbed';
import {
  useAlternativeSidebarSetting,
  useCompactChatsSetting,
  useRoundAvatarsSetting,
  useShowLastMessageSetting,
} from '../../../features/settings/lumiere-settings/store';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

type SpaceMenuProps = {
  room: Room;
  requestClose: () => void;
};
const SpaceMenu = forwardRef<HTMLDivElement, SpaceMenuProps>(
  ({ room, requestClose }, ref) => {
  const screenSize = useScreenSizeContext();
  const touchMenu = screenSize === ScreenSize.Mobile || screenSize === ScreenSize.Tablet;
  const menuIconSize = touchMenu ? '200' : '100';
  const menuIconWrapStyle = touchMenu ? { marginLeft: config.space.S100 } : undefined;
  const menuGroupGap = touchMenu ? '200' : '100';
  const menuGroupPadding = touchMenu ? config.space.S200 : config.space.S100;
  const menuMaxWidth = touchMenu ? toRem(200) : toRem(160);
  const mx = useMatrixClient();
  const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
  const [developerTools] = useSetting(settingsAtom, 'developerTools');
  const roomToParents = useAtomValue(roomToParentsAtom);
  const powerLevels = usePowerLevels(room);
  const creators = useRoomCreators(room);

  const permissions = useRoomPermissions(creators, powerLevels);
  const canInvite = permissions.action('invite', mx.getSafeUserId());
  const openSpaceSettings = useOpenSpaceSettings();
  const { navigateRoom } = useRoomNavigate();

  const [invitePrompt, setInvitePrompt] = useState(false);

  const allChild = useSpaceChildren(
    allRoomsAtom,
    room.roomId,
    useRecursiveChildScopeFactory(mx, roomToParents)
  );
  const unread = useRoomsUnread(allChild, roomToUnreadAtom);

  const handleMarkAsRead = () => {
    allChild.forEach((childRoomId) => markAsRead(mx, childRoomId, hideActivity));
    requestClose();
  };

  const handleCopyLink = () => {
    const roomIdOrAlias = getCanonicalAliasOrRoomId(mx, room.roomId);
    const viaServers = isRoomAlias(roomIdOrAlias) ? undefined : getViaServers(room);
    copyToClipboard(getMatrixToRoom(roomIdOrAlias, viaServers));
    requestClose();
  };

  const handleInvite = () => {
    setInvitePrompt(true);
  };

  const handleRoomSettings = () => {
    openSpaceSettings(room.roomId);
    requestClose();
  };

  const handleOpenTimeline = () => {
    navigateRoom(room.roomId);
    requestClose();
  };

  return (
    <Menu ref={ref} style={{ maxWidth: menuMaxWidth, width: '100vw' }}>
      <Box direction="Column" gap={menuGroupGap} style={{ padding: menuGroupPadding }}>
          {invitePrompt && room && (
            <InviteUserPrompt
              room={room}
              requestClose={() => {
                setInvitePrompt(false);
                requestClose();
              }}
            />
          )}
          <MenuItem
            onClick={handleMarkAsRead}
            size="300"
            after={
              <Box style={menuIconWrapStyle}>
                <Icon size={menuIconSize} src={Icons.CheckTwice} />
              </Box>
            }
            radii="300"
            disabled={!unread}
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Mark as Read
            </Text>
          </MenuItem>
      </Box>
      <Line variant="Surface" size="300" />
      <Box direction="Column" gap={menuGroupGap} style={{ padding: menuGroupPadding }}>
          <MenuItem
            onClick={handleInvite}
            variant="Primary"
            fill="None"
            size="300"
            after={
              <Box style={menuIconWrapStyle}>
                <Icon size={menuIconSize} src={Icons.UserPlus} />
              </Box>
            }
            radii="300"
            aria-pressed={invitePrompt}
            disabled={!canInvite}
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Invite
            </Text>
          </MenuItem>
          <MenuItem
            onClick={handleCopyLink}
            size="300"
            after={
              <Box style={menuIconWrapStyle}>
                <Icon size={menuIconSize} src={Icons.Link} />
              </Box>
            }
            radii="300"
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Copy Link
            </Text>
          </MenuItem>
          <MenuItem
            onClick={handleRoomSettings}
            size="300"
            after={
              <Box style={menuIconWrapStyle}>
                <Icon size={menuIconSize} src={Icons.Setting} />
              </Box>
            }
            radii="300"
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Space Settings
            </Text>
          </MenuItem>
          {developerTools && (
            <MenuItem
              onClick={handleOpenTimeline}
              size="300"
              after={
                <Box style={menuIconWrapStyle}>
                  <Icon size={menuIconSize} src={Icons.Terminal} />
                </Box>
              }
              radii="300"
            >
              <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                Event Timeline
              </Text>
            </MenuItem>
          )}
        </Box>
        <Line variant="Surface" size="300" />
        <Box direction="Column" gap={menuGroupGap} style={{ padding: menuGroupPadding }}>
          <UseStateProvider initial={false}>
            {(promptLeave, setPromptLeave) => (
              <>
                <MenuItem
                  onClick={() => setPromptLeave(true)}
                  variant="Critical"
                  fill="None"
                  size="300"
                  after={
                    <Box style={menuIconWrapStyle}>
                      <Icon size={menuIconSize} src={Icons.ArrowGoLeft} />
                    </Box>
                  }
                  radii="300"
                  aria-pressed={promptLeave}
                >
                  <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                    Leave Space
                  </Text>
                </MenuItem>
                {promptLeave && (
                  <LeaveSpacePrompt
                    roomId={room.roomId}
                    onDone={requestClose}
                    onCancel={() => setPromptLeave(false)}
                  />
                )}
              </>
            )}
          </UseStateProvider>
        </Box>
      </Menu>
  );
  }
);

function SpaceHeader({ searchSelected }: { searchSelected: boolean }) {
  const mx = useMatrixClient();
  const space = useSpace();
  const spaceName = useRoomName(space);
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();
  const navigate = useNavigate();
  const [alternativeSidebar] = useAlternativeSidebarSetting();

  const joinRules = useStateEvent(
    space,
    StateEvent.RoomJoinRules
  )?.getContent<RoomJoinRulesEventContent>();

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };
  const handleSearchClick = () => {
    navigate(getSpaceSearchPath(getCanonicalAliasOrRoomId(mx, space.roomId)));
  };
  const handleBackHome = () => navigate(getHomePath());

  return (
    <>
      <PageNavHeader>
        <Box alignItems="Center" grow="Yes" gap="300">
          <Box grow="Yes" alignItems="Center" gap="100">
            {alternativeSidebar && (
              <IconButton fill="None" onClick={handleBackHome}>
                <Icon src={Icons.ArrowLeft} />
              </IconButton>
            )}
            <Text size="H4" truncate>
              {spaceName}
            </Text>
            {joinRules?.join_rule !== JoinRule.Public && <Icon src={Icons.Lock} size="50" />}
          </Box>
          <Box shrink="No" gap="100">
            <IconButton aria-pressed={searchSelected} variant="Background" onClick={handleSearchClick}>
              <Icon src={Icons.Search} size="200" filled={searchSelected} />
            </IconButton>
            <IconButton aria-pressed={!!menuAnchor} variant="Background" onClick={handleOpenMenu}>
              <Icon src={Icons.VerticalDots} size="200" />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      {menuAnchor && (
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
              <SpaceMenu
                room={space}
                requestClose={() => setMenuAnchor(undefined)}
              />
            </FocusTrap>
          }
        />
      )}
    </>
  );
}

type SpaceTombstoneProps = { roomId: string; replacementRoomId: string };
export function SpaceTombstone({ roomId, replacementRoomId }: SpaceTombstoneProps) {
  const mx = useMatrixClient();
  const { navigateSpace } = useRoomNavigate();

  const [joinState, handleJoin] = useAsyncCallback(
    useCallback(() => {
      const currentRoom = mx.getRoom(roomId);
      const via = currentRoom ? getViaServers(currentRoom) : [];
      return mx.joinRoom(replacementRoomId, {
        viaServers: via,
      });
    }, [mx, roomId, replacementRoomId])
  );
  const replacementRoom = mx.getRoom(replacementRoomId);

  const handleOpen = () => {
    if (replacementRoom) navigateSpace(replacementRoom.roomId);
    if (joinState.status === AsyncStatus.Success) navigateSpace(joinState.data.roomId);
  };

  return (
    <Box
      style={{
        padding: config.space.S200,
        borderRadius: config.radii.R400,
        borderWidth: config.borderWidth.B300,
      }}
      className={ContainerColor({ variant: 'Surface' })}
      direction="Column"
      gap="300"
    >
      <Box direction="Column" grow="Yes" gap="100">
        <Text size="L400">Space Upgraded</Text>
        <Text size="T200">This space has been replaced and is no longer active.</Text>
        {joinState.status === AsyncStatus.Error && (
          <Text className={BreakWord} style={{ color: color.Critical.Main }} size="T200">
            {(joinState.error as any)?.message ?? 'Failed to join replacement space!'}
          </Text>
        )}
      </Box>
      <Box direction="Column" shrink="No">
        {replacementRoom?.getMyMembership() === Membership.Join ||
        joinState.status === AsyncStatus.Success ? (
          <Button onClick={handleOpen} size="300" variant="Success" fill="Solid" radii="300">
            <Text size="B300">Open New Space</Text>
          </Button>
        ) : (
          <Button
            onClick={handleJoin}
            size="300"
            variant="Primary"
            fill="Solid"
            radii="300"
            before={
              joinState.status === AsyncStatus.Loading && (
                <Spinner size="100" variant="Primary" fill="Solid" />
              )
            }
            disabled={joinState.status === AsyncStatus.Loading}
          >
            <Text size="B300">Join New Space</Text>
          </Button>
        )}
      </Box>
    </Box>
  );
}

type JoinRoomConfirmPromptProps = {
  roomId: string;
  roomName: string;
  onDone: (joinedRoomId: string) => void;
  onCancel: () => void;
};
function JoinRoomConfirmPrompt({ roomId, roomName, onDone, onCancel }: JoinRoomConfirmPromptProps) {
  const mx = useMatrixClient();
  const [joinState, joinRoom] = useAsyncCallback<Room, unknown, []>(
    useCallback(() => mx.joinRoom(roomId), [mx, roomId])
  );

  const handleJoin = () => {
    joinRoom();
  };

  useEffect(() => {
    if (joinState.status === AsyncStatus.Success) {
      onDone(joinState.data.roomId);
    }
  }, [joinState, onDone]);

  let joinError: string | undefined;
  if (joinState.status === AsyncStatus.Error) {
    joinError = joinState.error instanceof Error ? joinState.error.message : 'Failed to join room.';
  }

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: onCancel,
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Dialog variant="Surface">
            <Header
              style={{
                padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                borderBottomWidth: config.borderWidth.B300,
              }}
              variant="Surface"
              size="500"
            >
              <Box grow="Yes">
                <Text size="H4">Join Room</Text>
              </Box>
              <IconButton size="300" onClick={onCancel} radii="300">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Header>
            <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
              <Box direction="Column" gap="200">
                <Text priority="400">Join &quot;{roomName}&quot;?</Text>
                {joinError && (
                  <Text style={{ color: color.Critical.Main }} size="T300">
                    {joinError}
                  </Text>
                )}
              </Box>
              <Button
                variant="Primary"
                onClick={handleJoin}
                before={
                  joinState.status === AsyncStatus.Loading ? (
                    <Spinner fill="Solid" variant="Primary" size="200" />
                  ) : (
                    <Icon src={Icons.Plus} size="100" />
                  )
                }
                aria-disabled={
                  joinState.status === AsyncStatus.Loading ||
                  joinState.status === AsyncStatus.Success
                }
              >
                <Text size="B400">
                  {joinState.status === AsyncStatus.Loading ? 'Joining...' : 'Join'}
                </Text>
              </Button>
            </Box>
          </Dialog>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}

export function Space() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const useAuthentication = useMediaAuthentication();
  const screenSize = useScreenSizeContext();
  const mobile = screenSize === ScreenSize.Mobile;
  const space = useSpace();
  useNavToActivePathMapper(space.roomId);
  const spaceIdOrAlias = getCanonicalAliasOrRoomId(mx, space.roomId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mDirects = useAtomValue(mDirectAtom);
  const roomToUnread = useAtomValue(roomToUnreadAtom);
  const allRooms = useAtomValue(allRoomsAtom);
  const allJoinedRooms = useMemo(() => new Set(allRooms), [allRooms]);
  const notificationPreferences = useRoomsNotificationPreferencesContext();
  const [roundAvatars] = useRoundAvatarsSetting();
  const [compactChats] = useCompactChatsSetting();
  const [showLastMessage] = useShowLastMessageSetting();
  const [alternativeSidebar] = useAlternativeSidebarSetting();
  const alternativeHorizontalPadding =
    screenSize === ScreenSize.Desktop ? config.space.S300 : config.space.S100;
  let alternativeAvatarSize: '200' | '300' | '400';
  if (mobile) {
    alternativeAvatarSize = compactChats ? '300' : '400';
  } else {
    alternativeAvatarSize = compactChats ? '200' : '300';
  }
  let alternativeAvatarSizePx = 50;
  if (alternativeAvatarSize === '200') alternativeAvatarSizePx = 28;
  else if (alternativeAvatarSize === '300') alternativeAvatarSizePx = 43;
  const alternativeAvatarStyle = {
    width: toRem(alternativeAvatarSizePx),
    height: toRem(alternativeAvatarSizePx),
  };

  const tombstoneEvent = useStateEvent(space, StateEvent.RoomTombstone);
  const selectedRoomId = useSelectedRoom();
  const selectedSpaceId = useSelectedSpace();
  const lobbySelected = useSpaceLobbySelected(spaceIdOrAlias);
  const searchSelected = useSpaceSearchSelected(spaceIdOrAlias);
  const callEmbed = useCallEmbed();
  const [joinPrompt, setJoinPrompt] = useState<{ roomId: string; roomName: string }>();

  const [closedCategories, setClosedCategories] = useAtom(useClosedNavCategoriesAtom());
  const getHierarchyRoomId = useCallback((room: unknown): string | undefined => {
    if (!room || typeof room !== 'object') return undefined;
    const candidate = (room as { room_id?: unknown; roomId?: unknown }).room_id
      ?? (room as { room_id?: unknown; roomId?: unknown }).roomId;
    return typeof candidate === 'string' ? candidate : undefined;
  }, []);
  const getHierarchyRoomName = useCallback((room: unknown): string | undefined => {
    if (!room || typeof room !== 'object') return undefined;
    const candidate = (room as { name?: unknown }).name;
    return typeof candidate === 'string' ? candidate : undefined;
  }, []);
  const getHierarchyRoomAlias = useCallback((room: unknown): string | undefined => {
    if (!room || typeof room !== 'object') return undefined;
    const candidate = (room as { canonical_alias?: unknown; canonicalAlias?: unknown }).canonical_alias
      ?? (room as { canonical_alias?: unknown; canonicalAlias?: unknown }).canonicalAlias;
    return typeof candidate === 'string' ? candidate : undefined;
  }, []);
  const getHierarchyRoomMemberCount = useCallback((room: unknown): number | undefined => {
    if (!room || typeof room !== 'object') return undefined;
    const candidate = (room as { num_joined_members?: unknown }).num_joined_members;
    return typeof candidate === 'number' ? candidate : undefined;
  }, []);
  const getHierarchyRoomAvatarUrl = useCallback((room: unknown): string | undefined => {
    if (!room || typeof room !== 'object') return undefined;
    const candidate = (room as { avatar_url?: unknown; avatarUrl?: unknown }).avatar_url
      ?? (room as { avatar_url?: unknown; avatarUrl?: unknown }).avatarUrl;
    return typeof candidate === 'string' ? candidate : undefined;
  }, []);

  const getRoom = useCallback(
    (rId: string): Room | undefined => {
      if (allJoinedRooms.has(rId)) {
        return mx.getRoom(rId) ?? undefined;
      }
      return undefined;
    },
    [mx, allJoinedRooms]
  );

  const hierarchy = useSpaceJoinedHierarchy(
    space.roomId,
    getRoom,
    useCallback(
      (parentId, roomId) => {
        if (alternativeSidebar) return false;
        if (!closedCategories.has(makeNavCategoryId(space.roomId, parentId))) {
          return false;
        }
        const showRoomAnyway =
          roomToUnread.has(roomId) || roomId === selectedRoomId || callEmbed?.roomId === roomId;
        return !showRoomAnyway;
      },
      [alternativeSidebar, space.roomId, closedCategories, roomToUnread, selectedRoomId, callEmbed]
    ),
    useCallback(
      (sId) => (alternativeSidebar ? false : closedCategories.has(makeNavCategoryId(space.roomId, sId))),
      [alternativeSidebar, closedCategories, space.roomId]
    )
  );
  const { rooms: hierarchyRooms } = useFetchSpaceHierarchyLevel(space.roomId, alternativeSidebar);
  const unjoinedRoomSummaries = useMemo(
    () => Array.from(hierarchyRooms.values()).reduce<
      {
        roomId: string;
        name?: string;
        alias?: string;
        memberCount?: number;
        avatarUrl?: string;
        roomType?: string;
        joinRule?: JoinRule;
      }[]
    >((acc, room) => {
      if (room.room_type === 'm.space') return acc;
      const roomId = getHierarchyRoomId(room);
      if (!roomId || allJoinedRooms.has(roomId)) return acc;
      acc.push({
        roomId,
        name: getHierarchyRoomName(room),
        alias: getHierarchyRoomAlias(room),
        memberCount: getHierarchyRoomMemberCount(room),
        avatarUrl: getHierarchyRoomAvatarUrl(room),
        roomType: room.room_type,
        joinRule: room.join_rule as JoinRule | undefined,
      });
      return acc;
    }, []),
    [
      hierarchyRooms,
      allJoinedRooms,
      getHierarchyRoomId,
      getHierarchyRoomName,
      getHierarchyRoomAlias,
      getHierarchyRoomMemberCount,
      getHierarchyRoomAvatarUrl,
    ]
  );

  const alternativeItems = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    const push = (roomId: string) => {
      if (seen.has(roomId)) return;
      seen.add(roomId);
      items.push(roomId);
    };
    hierarchy.forEach((item) => {
      if (item.roomId === space.roomId) return;
      push(item.roomId);
    });
    return items;
  }, [space.roomId, hierarchy]);

  const virtualizer = useVirtualizer({
    count: alternativeSidebar ? alternativeItems.length : hierarchy.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 0,
    overscan: 10,
  });

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  const getToLink = useCallback(
    (roomId: string) => getSpaceRoomPath(spaceIdOrAlias, getCanonicalAliasOrRoomId(mx, roomId)),
    [mx, spaceIdOrAlias]
  );
  const handleUnjoinedItemClick = useCallback((roomId: string, roomName: string) => {
    setJoinPrompt({ roomId, roomName });
  }, []);
  const handleJoinConfirmDone = useCallback(
    (joinedRoomId: string) => {
      setJoinPrompt(undefined);
      navigate(getToLink(joinedRoomId));
    },
    [navigate, getToLink]
  );

  return (
    <PageNav size={alternativeSidebar ? '500' : '400'}>
      <SpaceHeader searchSelected={searchSelected} />
      <PageNavContent scrollRef={scrollRef}>
        <Box direction="Column" gap={alternativeSidebar ? '0' : '300'}>
          {tombstoneEvent && (
            <SpaceTombstone
              roomId={space.roomId}
              replacementRoomId={tombstoneEvent.getContent().replacement_room}
            />
          )}
          {alternativeSidebar ? (
            <>
              <NavCategory
                style={{
                  height: virtualizer.getTotalSize(),
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((vItem) => {
                  const roomId = alternativeItems[vItem.index];
                  const room = roomId ? mx.getRoom(roomId) : undefined;
                  if (!room) return null;
                  const isSpaceItem = room.isSpaceRoom();
                  const isDirect = mDirects.has(roomId);
                  const previewSourceRoom = isSpaceItem
                    ? getSpaceChildren(room)
                        .map((childId) => mx.getRoom(childId))
                        .filter((childRoom): childRoom is NonNullable<typeof childRoom> => Boolean(childRoom))
                        .sort(
                          (a, b) =>
                            (b.getLastActiveTimestamp() ?? Number.MIN_SAFE_INTEGER) -
                            (a.getLastActiveTimestamp() ?? Number.MIN_SAFE_INTEGER)
                        )[0] ?? room
                    : room;

                  return (
                    <VirtualTile virtualItem={vItem} key={vItem.index} ref={virtualizer.measureElement}>
                      <RoomNavItem
                        room={room}
                        selected={
                          isSpaceItem
                            ? selectedSpaceId === roomId && lobbySelected
                            : selectedRoomId === roomId
                        }
                        showAvatar
                        direct={isDirect}
                        showLastMessage={showLastMessage}
                        compactChats={compactChats}
                        alternativeSidebarLayout
                        roundAvatars={roundAvatars}
                        previewSourceRoom={previewSourceRoom}
                        linkPath={
                          isSpaceItem
                            ? mobile
                              ? getSpacePath(getCanonicalAliasOrRoomId(mx, roomId))
                              : getSpaceLobbyPath(getCanonicalAliasOrRoomId(mx, roomId))
                            : getToLink(roomId)
                        }
                        notificationMode={getRoomNotificationMode(notificationPreferences, room.roomId)}
                      />
                    </VirtualTile>
                  );
                })}
              </NavCategory>
              {unjoinedRoomSummaries.length > 0 && (
                <NavCategory>
                  {unjoinedRoomSummaries.map((room) => (
                    <NavItem
                      key={room.roomId}
                      variant="Background"
                      radii="400"
                      style={{ margin: 0, marginBottom: config.space.S100 }}
                    >
                      <NavButton onClick={() => handleUnjoinedItemClick(room.roomId, room.name || room.alias || room.roomId)}>
                        <NavItemContent
                          style={{
                            paddingLeft: alternativeHorizontalPadding,
                            paddingTop: compactChats ? config.space.S100 : config.space.S200,
                            paddingBottom: compactChats ? config.space.S100 : config.space.S200,
                          }}
                        >
                          <Box as="span" grow="Yes" alignItems="Center" gap="300">
                            <Avatar
                              size={alternativeAvatarSize}
                              radii={roundAvatars ? 'Pill' : '400'}
                              style={alternativeAvatarStyle}
                            >
                              <RoomAvatar
                                roomId={room.roomId}
                                src={
                                  room.avatarUrl
                                    ? mxcUrlToHttp(mx, room.avatarUrl, useAuthentication, 96, 96, 'crop') ??
                                      undefined
                                    : undefined
                                }
                                alt={room.name || room.alias || room.roomId}
                                renderFallback={() => (
                                  <RoomIcon size={compactChats ? '100' : '200'} roomType={room.roomType} joinRule={room.joinRule} />
                                )}
                              />
                            </Avatar>
                            <Box
                              as="span"
                              grow="Yes"
                              direction="Column"
                              gap={showLastMessage ? '100' : undefined}
                            >
                              <Text
                                as="span"
                                size={!compactChats ? 'T400' : 'Inherit'}
                                style={{ fontWeight: 500 }}
                                truncate
                              >
                                {room.name || room.alias || room.roomId}
                              </Text>
                              {showLastMessage && (
                                <Text as="span" size={compactChats ? 'T200' : 'T300'} priority="300" truncate>
                                  {room.memberCount === undefined
                                    ? 'Members unknown'
                                    : `${room.memberCount} ${room.memberCount === 1 ? 'Member' : 'Members'}`}
                                </Text>
                              )}
                            </Box>
                            <Box as="span" shrink="No">
                              <Chip
                                as="span"
                                variant="Secondary"
                                fill="Soft"
                                size="400"
                                radii="Pill"
                                before={<Icon src={Icons.Plus} size="50" />}
                              >
                                <Text as="span" size="B300">
                                  Join
                                </Text>
                              </Chip>
                            </Box>
                          </Box>
                        </NavItemContent>
                      </NavButton>
                    </NavItem>
                  ))}
                </NavCategory>
              )}
            </>
          ) : (
            <>
              <NavCategory>
                <NavItem variant="Background" radii="400" aria-selected={lobbySelected}>
                  <NavLink to={getSpaceLobbyPath(getCanonicalAliasOrRoomId(mx, space.roomId))}>
                    <NavItemContent>
                      <Box as="span" grow="Yes" alignItems="Center" gap="200">
                        <Avatar size="200" radii="400">
                          <Icon src={Icons.Flag} size="100" filled={lobbySelected} />
                        </Avatar>
                        <Box as="span" grow="Yes">
                          <Text as="span" size="Inherit" truncate>
                            Lobby
                          </Text>
                        </Box>
                      </Box>
                    </NavItemContent>
                  </NavLink>
                </NavItem>
              </NavCategory>
              <NavCategory
                style={{
                  height: virtualizer.getTotalSize(),
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((vItem) => {
                  const { roomId } = hierarchy[vItem.index] ?? {};
                  const room = mx.getRoom(roomId);
                  if (!room) return null;

                  if (room.isSpaceRoom()) {
                    const categoryId = makeNavCategoryId(space.roomId, roomId);

                    return (
                      <VirtualTile
                        virtualItem={vItem}
                        key={vItem.index}
                        ref={virtualizer.measureElement}
                      >
                        <div style={{ paddingTop: vItem.index === 0 ? undefined : config.space.S400 }}>
                          <NavCategoryHeader>
                            <RoomNavCategoryButton
                              data-category-id={categoryId}
                              onClick={handleCategoryClick}
                              closed={closedCategories.has(categoryId)}
                            >
                              {roomId === space.roomId ? 'Rooms' : room?.name}
                            </RoomNavCategoryButton>
                          </NavCategoryHeader>
                        </div>
                      </VirtualTile>
                    );
                  }

                  return (
                    <VirtualTile virtualItem={vItem} key={vItem.index} ref={virtualizer.measureElement}>
                      <RoomNavItem
                        room={room}
                        selected={selectedRoomId === roomId}
                        showAvatar={mDirects.has(roomId)}
                        direct={mDirects.has(roomId)}
                        roundAvatars={roundAvatars}
                        linkPath={getToLink(roomId)}
                        notificationMode={getRoomNotificationMode(notificationPreferences, room.roomId)}
                      />
                    </VirtualTile>
                  );
                })}
              </NavCategory>
            </>
          )}
        </Box>
      </PageNavContent>
      {joinPrompt && (
        <JoinRoomConfirmPrompt
          roomId={joinPrompt.roomId}
          roomName={joinPrompt.roomName}
          onDone={handleJoinConfirmDone}
          onCancel={() => setJoinPrompt(undefined)}
        />
      )}
    </PageNav>
  );
}
