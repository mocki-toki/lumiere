import React from 'react';
import { Box, Icon, IconButton, Icons, Scroll, Switch, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { SequenceCardStyle } from '../styles.css';
import {
  useAlternativeSidebarSetting,
  useCompactChatsSetting,
  useRoundAvatarsSetting,
  useShowLastMessageSetting,
} from './store';

type LumiereSettingsProps = {
  requestClose: () => void;
};

export function LumiereSettings({ requestClose }: LumiereSettingsProps) {
  const [alternativeSidebar, setAlternativeSidebar] = useAlternativeSidebarSetting();
  const [showLastMessage, setShowLastMessage] = useShowLastMessageSetting();
  const [compactChats, setCompactChats] = useCompactChatsSetting();
  const [roundAvatars, setRoundAvatars] = useRoundAvatarsSetting();

  return (
    <Page>
      <PageHeader outlined={false}>
        <Box grow="Yes" gap="200">
          <Box grow="Yes" alignItems="Center" gap="200">
            <Text size="H3" truncate>
              Lumiere Settings
            </Text>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <Box direction="Column" gap="700">
              <Box direction="Column" gap="100">
                <Text size="L400">Sidebar</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Alternative Variant (like Telegram)"
                    description="Combines Home and Direct Messages, shows Spaces in the conversation list, and enables the floating create menu."
                    after={<Switch value={alternativeSidebar} onChange={setAlternativeSidebar} />}
                  />
                  <SettingTile
                    title="Show Last Message"
                    description="Shows the latest message as a subtitle in chats, rooms, and spaces."
                    after={<Switch value={showLastMessage} onChange={setShowLastMessage} />}
                  />
                  <SettingTile
                    title="Compact Chats"
                    description="Uses tighter chat rows with smaller avatars and spacing."
                    after={<Switch value={compactChats} onChange={setCompactChats} />}
                  />
                </SequenceCard>
              </Box>
              <Box direction="Column" gap="100">
                <Text size="L400">Design</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Round Avatars"
                    description="Displays chat, room, and space avatars as circles."
                    after={<Switch value={roundAvatars} onChange={setRoundAvatars} />}
                  />
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
