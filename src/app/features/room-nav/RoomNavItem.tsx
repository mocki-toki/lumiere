import React, { MouseEventHandler, forwardRef, useState } from 'react';
import { Room } from 'matrix-js-sdk';
import {
  Avatar,
  Box,
  Icon,
  IconButton,
  Icons,
  Text,
  Menu,
  MenuItem,
  config,
  PopOut,
  toRem,
  Line,
  RectCords,
  Badge,
  Spinner,
} from 'folds';
import { useFocusWithin, useHover } from 'react-aria';
import FocusTrap from 'focus-trap-react';
import { useAtom, useAtomValue } from 'jotai';
import { NavItem, NavItemContent, NavItemOptions, NavLink } from '../../components/nav';
import { UnreadBadge, UnreadBadgeCenter } from '../../components/unread-badge';
import { RoomAvatar, RoomIcon } from '../../components/room-avatar';
import { UserAvatar } from '../../components/user-avatar';
import { getDirectRoomAvatarUrl, getRoomAvatarUrl, getStateEvent } from '../../utils/room';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomUnread } from '../../state/hooks/unread';
import { roomToUnreadAtom } from '../../state/room/roomToUnread';
import { getPowersLevelFromMatrixEvent, usePowerLevels } from '../../hooks/usePowerLevels';
import { copyToClipboard } from '../../utils/dom';
import { markAsRead } from '../../utils/notifications';
import { UseStateProvider } from '../../components/UseStateProvider';
import { LeaveRoomPrompt } from '../../components/leave-room-prompt';
import { LeaveSpacePrompt } from '../../components/leave-space-prompt';
import { useRoomTypingMember } from '../../hooks/useRoomTypingMembers';
import { TypingIndicator } from '../../components/typing-indicator';
import { stopPropagation } from '../../utils/keyboard';
import { getMatrixToRoom } from '../../plugins/matrix-to';
import { getCanonicalAliasOrRoomId, getMxIdLocalPart, isRoomAlias } from '../../utils/matrix';
import { getViaServers } from '../../plugins/via-servers';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { useOpenRoomSettings } from '../../state/hooks/roomSettings';
import { useOpenSpaceSettings } from '../../state/hooks/spaceSettings';
import { useSpaceOptionally } from '../../hooks/useSpace';
import {
  getRoomNotificationModeIcon,
  RoomNotificationMode,
} from '../../hooks/useRoomsNotificationPreferences';
import { RoomNotificationModeSwitcher } from '../../components/RoomNotificationSwitcher';
import { getRoomCreatorsForRoomId, useRoomCreators } from '../../hooks/useRoomCreators';
import { getRoomPermissionsAPI, useRoomPermissions } from '../../hooks/useRoomPermissions';
import { InviteUserPrompt } from '../../components/invite-user-prompt';
import { useRoomName } from '../../hooks/useRoomMeta';
import { useCallMembers, useCallSession } from '../../hooks/useCall';
import { useCallEmbed, useCallStart } from '../../hooks/useCallEmbed';
import { callChatAtom } from '../../state/callEmbed';
import { useCallPreferencesAtom } from '../../state/hooks/callPreferences';
import { useAutoDiscoveryInfo } from '../../hooks/useAutoDiscoveryInfo';
import { livekitSupport } from '../../hooks/useLivekitSupport';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { MessageEvent, StateEvent } from '../../../types/matrix/room';

type RoomNavItemMenuProps = {
  room: Room;
  requestClose: () => void;
  notificationMode?: RoomNotificationMode;
};
const RoomNavItemMenu = forwardRef<HTMLDivElement, RoomNavItemMenuProps>(
  ({ room, requestClose, notificationMode }, ref) => {
    const screenSize = useScreenSizeContext();
    const touchMenu = screenSize === ScreenSize.Mobile || screenSize === ScreenSize.Tablet;
    const menuIconSize = touchMenu ? '200' : '100';
    const menuIconWrapStyle = touchMenu ? { marginLeft: config.space.S100 } : undefined;
    const menuGroupGap = touchMenu ? '200' : '100';
    const menuGroupPadding = touchMenu ? config.space.S200 : config.space.S100;
    const menuMaxWidth = touchMenu ? toRem(200) : toRem(160);
    const mx = useMatrixClient();
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const unread = useRoomUnread(room.roomId, roomToUnreadAtom);
    const powerLevels = usePowerLevels(room);
    const creators = useRoomCreators(room);

    const permissions = useRoomPermissions(creators, powerLevels);
    const canInvite = permissions.action('invite', mx.getSafeUserId());
    const openRoomSettings = useOpenRoomSettings();
    const openSpaceSettings = useOpenSpaceSettings();
    const space = useSpaceOptionally();
    const isSpace = room.getType() === 'm.space';

    const [invitePrompt, setInvitePrompt] = useState(false);

    const handleMarkAsRead = () => {
      markAsRead(mx, room.roomId, hideActivity);
      requestClose();
    };

    const handleInvite = () => {
      setInvitePrompt(true);
    };

    const handleCopyLink = () => {
      const roomIdOrAlias = getCanonicalAliasOrRoomId(mx, room.roomId);
      const viaServers = isRoomAlias(roomIdOrAlias) ? undefined : getViaServers(room);
      copyToClipboard(getMatrixToRoom(roomIdOrAlias, viaServers));
      requestClose();
    };

    const handleRoomSettings = () => {
      openRoomSettings(room.roomId, space?.roomId);
      requestClose();
    };
    const handleSpaceSettings = () => {
      openSpaceSettings(room.roomId, space?.roomId);
      requestClose();
    };

    if (isSpace) {
      return (
        <Menu ref={ref} style={{ maxWidth: menuMaxWidth, width: '100vw' }}>
          {invitePrompt && room && (
            <InviteUserPrompt
              room={room}
              requestClose={() => {
                setInvitePrompt(false);
                requestClose();
              }}
            />
          )}
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
              onClick={handleSpaceSettings}
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

    return (
      <Menu ref={ref} style={{ maxWidth: menuMaxWidth, width: '100vw' }}>
        {invitePrompt && room && (
          <InviteUserPrompt
            room={room}
            requestClose={() => {
              setInvitePrompt(false);
              requestClose();
            }}
          />
        )}
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
            disabled={!unread}
          >
            <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
              Mark as Read
            </Text>
          </MenuItem>
          <RoomNotificationModeSwitcher roomId={room.roomId} value={notificationMode}>
            {(handleOpen, opened, changing) => (
              <MenuItem
                size="300"
                after={
                  changing ? (
                    <Spinner size="100" variant="Secondary" />
                  ) : (
                    <Box style={menuIconWrapStyle}>
                      <Icon size={menuIconSize} src={getRoomNotificationModeIcon(notificationMode)} />
                    </Box>
                  )
                }
                radii="300"
                aria-pressed={opened}
                onClick={handleOpen}
              >
                <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                  Notifications
                </Text>
              </MenuItem>
            )}
          </RoomNotificationModeSwitcher>
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
              Room Settings
            </Text>
          </MenuItem>
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
                    Leave Room
                  </Text>
                </MenuItem>
                {promptLeave && (
                  <LeaveRoomPrompt
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

function CallChatToggle() {
  const [chat, setChat] = useAtom(callChatAtom);

  return (
    <IconButton
      onClick={() => setChat(!chat)}
      aria-pressed={chat}
      aria-label="Toggle Chat"
      variant="Background"
      fill="None"
      size="300"
      radii="300"
    >
      <Icon size="50" src={Icons.Message} filled={chat} />
    </IconButton>
  );
}

type RoomNavItemProps = {
  room: Room;
  selected: boolean;
  linkPath: string;
  notificationMode?: RoomNotificationMode;
  showAvatar?: boolean;
  direct?: boolean;
  showLastMessage?: boolean;
  previewSourceRoom?: Room;
  compactChats?: boolean;
  roundAvatars?: boolean;
  alternativeSidebarLayout?: boolean;
};
export function RoomNavItem({
  room,
  selected,
  showAvatar,
  direct,
  showLastMessage,
  previewSourceRoom,
  compactChats = true,
  roundAvatars = false,
  alternativeSidebarLayout = false,
  notificationMode,
  linkPath,
}: RoomNavItemProps) {
  const screenSize = useScreenSizeContext();
  const mobile = screenSize === ScreenSize.Mobile;
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const [hover, setHover] = useState(false);
  const { hoverProps } = useHover({ onHoverChange: setHover });
  const { focusWithinProps } = useFocusWithin({ onFocusWithinChange: setHover });
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();
  const unread = useRoomUnread(room.roomId, roomToUnreadAtom);
  const typingMember = useRoomTypingMember(room.roomId).filter(
    (receipt) => receipt.userId !== mx.getUserId()
  );

  const roomName = useRoomName(room);
  const sourceRoom = previewSourceRoom ?? room;
  const latestRenderedEvent = (() => {
    const liveEvents = sourceRoom.getLiveTimeline().getEvents();
    for (let i = liveEvents.length - 1; i >= 0; i -= 1) {
      const evt = liveEvents[i];
      if (evt) {
        const type = evt.getType();
        if (
          type === MessageEvent.RoomMessage ||
          type === MessageEvent.RoomMessageEncrypted ||
          type === MessageEvent.Sticker ||
          type === StateEvent.RoomName ||
          type === StateEvent.RoomTopic ||
          type === StateEvent.RoomAvatar
        ) {
          return evt;
        }
      }
    }
    return sourceRoom.getLastLiveEvent();
  })();
  const roomLastMessage = (() => {
    const evt = latestRenderedEvent;
    if (!evt) return undefined;

    const type = evt.getType();
    const content = evt.getContent<Record<string, unknown>>();
    const body = typeof content.body === 'string' ? content.body : undefined;
    const normalizedBody = body?.replace(/\s+/g, ' ').trim();
    const senderId = evt.getSender();
    const senderName =
      (senderId && sourceRoom.getMember(senderId)?.name) ||
      (senderId && getMxIdLocalPart(senderId)) ||
      senderId;

    if (type === MessageEvent.RoomMessage || type === MessageEvent.RoomMessageEncrypted) {
      const text =
        normalizedBody ||
        (type === MessageEvent.RoomMessageEncrypted ? 'Encrypted message' : 'Message');
      return senderName ? `${senderName}: ${text}` : text;
    }
    if (type === MessageEvent.Sticker) {
      const text = normalizedBody || 'Sticker';
      return senderName ? `${senderName}: ${text}` : text;
    }
    if (type === StateEvent.RoomName) {
      const name = typeof content.name === 'string' ? content.name.trim() : '';
      if (name) return `Room renamed to ${name}`;
      return 'Room name updated';
    }
    if (type === StateEvent.RoomTopic) {
      const topic = typeof content.topic === 'string' ? content.topic.trim() : '';
      if (topic) return `Topic: ${topic}`;
      return 'Room topic updated';
    }
    if (type === StateEvent.RoomAvatar) return 'Room avatar updated';
    return normalizedBody;
  })();

  const handleContextMenu: MouseEventHandler<HTMLElement> = (evt) => {
    evt.preventDefault();
    setMenuAnchor({
      x: evt.clientX,
      y: evt.clientY,
      width: 0,
      height: 0,
    });
  };

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };

  const optionsVisible = hover || !!menuAnchor;
  const menuIconSize =
    alternativeSidebarLayout && !(screenSize === ScreenSize.Desktop && compactChats) ? '200' : '50';
  const callSession = useCallSession(room);
  const callMembers = useCallMembers(room, callSession);
  const startCall = useCallStart(direct);
  const callEmbed = useCallEmbed();
  const callPref = useAtomValue(useCallPreferencesAtom());
  const autoDiscoveryInfo = useAutoDiscoveryInfo();

  const handleStartCall: MouseEventHandler<HTMLAnchorElement> = (evt) => {
    const powerLevelsEvent = getStateEvent(room, StateEvent.RoomPowerLevels);
    const powerLevels = getPowersLevelFromMatrixEvent(powerLevelsEvent);
    const creators = getRoomCreatorsForRoomId(mx, room.roomId);
    const permissions = getRoomPermissionsAPI(creators, powerLevels);

    const hasCallPermission = permissions.event(
      StateEvent.GroupCallMemberPrefix,
      mx.getSafeUserId()
    );

    // Do not join if missing permissions or no livekit support and call is not started by others
    if (!hasCallPermission || (!livekitSupport(autoDiscoveryInfo) && callMembers.length === 0)) {
      return;
    }

    // Do not join if already in call
    if (callEmbed) {
      return;
    }
    // Start call in second click
    if (selected) {
      evt.preventDefault();
      startCall(room, callPref);
    }
  };
  let itemMarginBottom: string | undefined;
  if (!alternativeSidebarLayout) {
    if (showLastMessage) {
      itemMarginBottom = compactChats ? config.space.S100 : config.space.S200;
    } else if (!compactChats) {
      itemMarginBottom = config.space.S200;
    }
  } else {
    itemMarginBottom = config.space.S100;
  }
  let avatarSize: '200' | '300' | '400';
  if (mobile) {
    avatarSize = compactChats ? '300' : '400';
  } else {
    avatarSize = compactChats ? '200' : '300';
  }
  let alternativeAvatarStyle:
    | {
        width: string;
        height: string;
      }
    | undefined;
  if (alternativeSidebarLayout) {
    let avatarSizePx = 50;
    if (avatarSize === '200') avatarSizePx = 28;
    else if (avatarSize === '300') avatarSizePx = 43;
    alternativeAvatarStyle = {
      width: toRem(avatarSizePx),
      height: toRem(avatarSizePx),
    };
  }
  const userFallbackIconSize = alternativeSidebarLayout && !compactChats ? '200' : '100';
  const alternativeHorizontalPadding =
    screenSize === ScreenSize.Desktop ? config.space.S300 : config.space.S100;
  let contentPaddingStyle:
    | {
        paddingTop: string;
        paddingBottom: string;
      }
    | undefined;
  if (alternativeSidebarLayout) {
    contentPaddingStyle = {
      paddingTop: compactChats ? config.space.S100 : config.space.S200,
      paddingBottom: compactChats ? config.space.S100 : config.space.S200,
    };
  } else if (!compactChats) {
    contentPaddingStyle = {
      paddingTop: config.space.S100,
      paddingBottom: config.space.S100,
    };
  }
  let avatarContent = (
    <RoomIcon
      style={{
        opacity: unread ? config.opacity.P500 : config.opacity.P300,
      }}
      filled={selected}
      size="100"
      joinRule={room.getJoinRule()}
      roomType={room.getType()}
    />
  );
  if (showAvatar) {
    avatarContent = direct ? (
      <UserAvatar
        userId={room.getAvatarFallbackMember()?.userId ?? room.roomId}
        src={getDirectRoomAvatarUrl(mx, room, 96, useAuthentication)}
        alt={roomName}
        renderFallback={() => <Icon size={userFallbackIconSize} src={Icons.User} filled />}
      />
    ) : (
      <RoomAvatar
        roomId={room.roomId}
        src={getRoomAvatarUrl(mx, room, 96, useAuthentication)}
        alt={roomName}
        renderFallback={() => (
          <RoomIcon size={userFallbackIconSize} joinRule={room.getJoinRule()} roomType={room.getType()} />
        )}
      />
    );
  }

  return (
    <NavItem
      variant="Background"
      radii="400"
      highlight={unread !== undefined}
      aria-selected={selected}
      data-hover={!!menuAnchor}
      style={{
        margin: alternativeSidebarLayout ? 0 : undefined,
        marginBottom: itemMarginBottom,
      }}
      onContextMenu={handleContextMenu}
      {...hoverProps}
      {...focusWithinProps}
    >
      <NavLink to={linkPath} onClick={room.isCallRoom() ? handleStartCall : undefined}>
        <NavItemContent
          style={{
            paddingLeft: alternativeSidebarLayout ? alternativeHorizontalPadding : config.space.S100,
            ...contentPaddingStyle,
          }}
        >
          <Box as="span" grow="Yes" alignItems="Center" gap="300">
            <Avatar size={avatarSize} radii={roundAvatars ? 'Pill' : '400'} style={alternativeAvatarStyle}>
              {avatarContent}
            </Avatar>
            <Box as="span" grow="Yes" direction="Column" gap="50">
              <Text
                priority={unread ? '500' : '300'}
                as="span"
                size={compactChats ? 'Inherit' : 'T400'}
                style={alternativeSidebarLayout ? { fontWeight: 500 } : undefined}
                truncate
              >
                {roomName}
              </Text>
              {showLastMessage && roomLastMessage && (
                <Text as="span" size={compactChats ? 'T200' : 'T300'} priority="300" truncate>
                  {roomLastMessage}
                </Text>
              )}
            </Box>
            {!optionsVisible && !unread && !selected && typingMember.length > 0 && (
              <Badge size="300" variant="Secondary" fill="Soft" radii="Pill" outlined>
                <TypingIndicator size="300" disableAnimation />
              </Badge>
            )}
            {!optionsVisible && unread && (
              <UnreadBadgeCenter>
                <UnreadBadge highlight={unread.highlight > 0} count={unread.total} />
              </UnreadBadgeCenter>
            )}
            {!optionsVisible && notificationMode !== RoomNotificationMode.Unset && (
              <Icon
                size="50"
                src={getRoomNotificationModeIcon(notificationMode)}
                aria-label={notificationMode}
              />
            )}
            {room.isCallRoom() && callMembers.length > 0 && (
              <Badge variant="Critical" fill="Solid" size="400">
                <Text as="span" size="L400" truncate>
                  {callMembers.length} Live
                </Text>
              </Badge>
            )}
          </Box>
        </NavItemContent>
      </NavLink>
      {optionsVisible && (
        <NavItemOptions>
          {selected && (callEmbed?.roomId === room.roomId || room.isCallRoom()) && (
            <CallChatToggle />
          )}
          <PopOut
            id={`menu-${room.roomId}`}
            aria-expanded={!!menuAnchor}
            anchor={menuAnchor}
            offset={menuAnchor?.width === 0 ? 0 : undefined}
            alignOffset={menuAnchor?.width === 0 ? 0 : -5}
            position="Bottom"
            align={menuAnchor?.width === 0 ? 'Start' : 'End'}
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
                <RoomNavItemMenu
                  room={room}
                  requestClose={() => setMenuAnchor(undefined)}
                  notificationMode={notificationMode}
                />
              </FocusTrap>
            }
          >
            <IconButton
              onClick={handleOpenMenu}
              aria-pressed={!!menuAnchor}
              aria-controls={`menu-${room.roomId}`}
              aria-label="More Options"
              variant="Background"
              fill="None"
              size="300"
              radii="300"
            >
              <Icon size={menuIconSize} src={Icons.VerticalDots} />
            </IconButton>
          </PopOut>
        </NavItemOptions>
      )}
    </NavItem>
  );
}
