import React from 'react';
import { Avatar, Box, Icon, IconButton, Icons, Text, config, toRem } from 'folds';
import { useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { NavCategory, NavItem, NavItemContent, NavLink } from '../../../components/nav';
import { getHomePath, getInboxInvitesPath, getInboxNotificationsPath } from '../../pathUtils';
import {
  useInboxInvitesSelected,
  useInboxNotificationsSelected,
} from '../../../hooks/router/useInbox';
import { UnreadBadge } from '../../../components/unread-badge';
import { allInvitesAtom } from '../../../state/room-list/inviteList';
import { useNavToActivePathMapper } from '../../../hooks/useNavToActivePathMapper';
import { PageNav, PageNavContent, PageNavHeader } from '../../../components/page';
import {
  useAlternativeSidebarSetting,
  useCompactChatsSetting,
  useRoundAvatarsSetting,
  useShowLastMessageSetting,
} from '../../../features/settings/lumiere-settings/store';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

type InboxNavItemProps = {
  label: string;
  subtitle?: string;
  iconSrc: string;
  selected: boolean;
  to: string;
  alternativeSidebar: boolean;
  compactChats: boolean;
  roundAvatars: boolean;
  showSubtitle: boolean;
  badgeCount?: number;
  highlight?: boolean;
};
function InboxNavItem({
  label,
  subtitle,
  iconSrc,
  selected,
  to,
  alternativeSidebar,
  compactChats,
  roundAvatars,
  showSubtitle,
  badgeCount,
  highlight,
}: InboxNavItemProps) {
  const screenSize = useScreenSizeContext();
  const mobile = screenSize === ScreenSize.Mobile;
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
  const avatarStyle = alternativeSidebar
    ? {
        width: toRem(avatarSizePx),
        height: toRem(avatarSizePx),
      }
    : undefined;
  const iconSize = alternativeSidebar && !compactChats ? '200' : '100';

  return (
    <NavItem
      variant="Background"
      radii="400"
      highlight={highlight}
      aria-selected={selected}
      style={alternativeSidebar ? { margin: 0, marginBottom: config.space.S100 } : undefined}
    >
      <NavLink to={to}>
        <NavItemContent
          style={
            alternativeSidebar
              ? {
                  paddingLeft: horizontalPadding,
                  paddingTop: compactChats ? config.space.S100 : config.space.S200,
                  paddingBottom: compactChats ? config.space.S100 : config.space.S200,
                }
              : undefined
          }
        >
          <Box as="span" grow="Yes" alignItems="Center" gap={alternativeSidebar ? '300' : '200'}>
            <Avatar
              size={avatarSize}
              radii={roundAvatars ? 'Pill' : '400'}
              style={avatarStyle}
            >
              <Icon src={iconSrc} size={iconSize} filled={selected} />
            </Avatar>
            <Box as="span" grow="Yes" direction="Column" gap={showSubtitle ? '50' : undefined}>
              <Text
                as="span"
                size={alternativeSidebar && !compactChats ? 'T400' : 'Inherit'}
                style={alternativeSidebar ? { fontWeight: 500 } : undefined}
                truncate
              >
                {label}
              </Text>
              {showSubtitle && subtitle && (
                <Text as="span" size={compactChats ? 'T200' : 'T300'} priority="300" truncate>
                  {subtitle}
                </Text>
              )}
            </Box>
            {badgeCount && badgeCount > 0 && <UnreadBadge highlight count={badgeCount} />}
          </Box>
        </NavItemContent>
      </NavLink>
    </NavItem>
  );
}

function InvitesNavItem({
  alternativeSidebar,
  compactChats,
  roundAvatars,
  showLastMessage,
}: {
  alternativeSidebar: boolean;
  compactChats: boolean;
  roundAvatars: boolean;
  showLastMessage: boolean;
}) {
  const invitesSelected = useInboxInvitesSelected();
  const allInvites = useAtomValue(allInvitesAtom);
  const inviteCount = allInvites.length;

  return (
    <InboxNavItem
      label="Invites"
      subtitle="Room and space invites"
      iconSrc={Icons.Mail}
      selected={invitesSelected}
      to={getInboxInvitesPath()}
      alternativeSidebar={alternativeSidebar}
      compactChats={compactChats}
      roundAvatars={roundAvatars}
      showSubtitle={showLastMessage}
      badgeCount={inviteCount > 0 ? inviteCount : undefined}
      highlight={inviteCount > 0 ? true : undefined}
    />
  );
}

export function Inbox() {
  useNavToActivePathMapper('inbox');
  const navigate = useNavigate();
  const notificationsSelected = useInboxNotificationsSelected();
  const [alternativeSidebar] = useAlternativeSidebarSetting();
  const [compactChats] = useCompactChatsSetting();
  const [roundAvatars] = useRoundAvatarsSetting();
  const [showLastMessage] = useShowLastMessageSetting();
  const handleBackHome = () => navigate(getHomePath());

  return (
    <PageNav size={alternativeSidebar ? '500' : '400'}>
      <PageNavHeader>
        <Box grow="Yes" gap="300">
          <Box grow="Yes" alignItems="Center" gap="200">
            {alternativeSidebar && (
              <IconButton fill="None" onClick={handleBackHome}>
                <Icon src={Icons.ArrowLeft} />
              </IconButton>
            )}
            <Text size="H4" truncate style={alternativeSidebar ? { fontWeight: 500 } : undefined}>
              Inbox
            </Text>
          </Box>
        </Box>
      </PageNavHeader>

      <PageNavContent>
        <Box direction="Column" gap={alternativeSidebar ? '0' : '300'}>
          <NavCategory>
            <InboxNavItem
              label="Notifications"
              subtitle="Mentions and unread activity"
              iconSrc={Icons.MessageUnread}
              selected={notificationsSelected}
              to={getInboxNotificationsPath()}
              alternativeSidebar={alternativeSidebar}
              compactChats={compactChats}
              roundAvatars={roundAvatars}
              showSubtitle={alternativeSidebar && showLastMessage}
            />
            <InvitesNavItem
              alternativeSidebar={alternativeSidebar}
              compactChats={compactChats}
              roundAvatars={roundAvatars}
              showLastMessage={alternativeSidebar && showLastMessage}
            />
          </NavCategory>
        </Box>
      </PageNavContent>
    </PageNav>
  );
}
