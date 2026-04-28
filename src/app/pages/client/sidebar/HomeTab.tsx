import React, { MouseEventHandler, forwardRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Icon, Icons, Menu, MenuItem, PopOut, RectCords, Text, config, toRem } from 'folds';
import { useAtomValue } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { useDirects, useOrphanRooms } from '../../../state/hooks/roomList';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { mDirectAtom } from '../../../state/mDirectList';
import { roomToParentsAtom } from '../../../state/room/roomToParents';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { roomToUnreadAtom } from '../../../state/room/roomToUnread';
import { getHomePath, joinPathComponent } from '../../pathUtils';
import { useRoomsUnread } from '../../../state/hooks/unread';
import {
  SidebarAvatar,
  SidebarItem,
  SidebarItemBadge,
  SidebarItemTooltip,
} from '../../../components/sidebar';
import { useHomeSelected } from '../../../hooks/router/useHomeSelected';
import { UnreadBadge } from '../../../components/unread-badge';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { useNavToActivePathAtom } from '../../../state/hooks/navToActivePath';
import { useHomeRooms } from '../home/useHomeRooms';
import { useDirectRooms } from '../direct/useDirectRooms';
import { markAsRead } from '../../../utils/notifications';
import { stopPropagation } from '../../../utils/keyboard';
import { useSetting } from '../../../state/hooks/settings';
import { settingsAtom } from '../../../state/settings';
import { useDirectSelected } from '../../../hooks/router/useDirectSelected';
import { useAlternativeSidebarSetting } from '../../../features/settings/lumiere-settings/store';

type HomeMenuProps = {
  includeDirect: boolean;
  requestClose: () => void;
};
const HomeMenu = forwardRef<HTMLDivElement, HomeMenuProps>(
  ({ includeDirect, requestClose }, ref) => {
    const screenSize = useScreenSizeContext();
    const touchMenu = screenSize === ScreenSize.Mobile || screenSize === ScreenSize.Tablet;
    const menuIconSize = touchMenu ? '200' : '100';
    const menuIconWrapStyle = touchMenu ? { marginLeft: config.space.S200 } : undefined;
    const menuMaxWidth = touchMenu ? toRem(220) : toRem(160);
    const homeRooms = useHomeRooms();
    const directRooms = useDirectRooms();
    const [hideActivity] = useSetting(settingsAtom, 'hideActivity');
    const unread = useRoomsUnread(
      includeDirect ? [...homeRooms, ...directRooms] : homeRooms,
      roomToUnreadAtom
    );
    const mx = useMatrixClient();

    const handleMarkAsRead = () => {
      if (!unread) return;
      (includeDirect ? [...homeRooms, ...directRooms] : homeRooms).forEach((rId) =>
        markAsRead(mx, rId, hideActivity)
      );
      requestClose();
    };

    return (
      <Menu ref={ref} style={{ maxWidth: menuMaxWidth, width: '100vw' }}>
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

export function HomeTab() {
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();
  const navToActivePath = useAtomValue(useNavToActivePathAtom());
  const [alternativeSidebar] = useAlternativeSidebarSetting();

  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const orphanRooms = useOrphanRooms(mx, allRoomsAtom, mDirects, roomToParents);
  const directs = useDirects(mx, allRoomsAtom, mDirects);
  const directUnread = useRoomsUnread(directs, roomToUnreadAtom);
  const homeUnread = useRoomsUnread(orphanRooms, roomToUnreadAtom);
  const homeSelected = useHomeSelected();
  const directSelected = useDirectSelected();
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const mergedUnread = alternativeSidebar
    ? {
        total: (homeUnread?.total ?? 0) + (directUnread?.total ?? 0),
        highlight: (homeUnread?.highlight ?? 0) + (directUnread?.highlight ?? 0),
      }
    : homeUnread;
  const hasMergedUnread = !!mergedUnread && (mergedUnread.total > 0 || mergedUnread.highlight > 0);
  const mergedSelected = alternativeSidebar ? homeSelected || directSelected : homeSelected;

  const handleHomeClick = () => {
    const activePath = navToActivePath.get('home');
    if (activePath && screenSize !== ScreenSize.Mobile) {
      navigate(joinPathComponent(activePath));
      return;
    }

    navigate(getHomePath());
  };

  const handleContextMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    evt.preventDefault();
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  return (
    <SidebarItem active={mergedSelected}>
      <SidebarItemTooltip tooltip={alternativeSidebar ? 'Home & Direct Messages' : 'Home'}>
        {(triggerRef) => (
          <SidebarAvatar
            as="button"
            ref={triggerRef}
            outlined
            onClick={handleHomeClick}
            onContextMenu={handleContextMenu}
          >
            <Icon src={Icons.Home} filled={mergedSelected} />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
      {hasMergedUnread && (
        <SidebarItemBadge hasCount={mergedUnread.total > 0}>
          <UnreadBadge highlight={mergedUnread.highlight > 0} count={mergedUnread.total} />
        </SidebarItemBadge>
      )}
      {menuAnchor && (
        <PopOut
          anchor={menuAnchor}
          position="Right"
          align="Start"
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
                includeDirect={alternativeSidebar}
                requestClose={() => setMenuAnchor(undefined)}
              />
            </FocusTrap>
          }
        />
      )}
    </SidebarItem>
  );
}
