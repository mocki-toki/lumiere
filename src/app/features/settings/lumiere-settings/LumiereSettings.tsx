import React from 'react';
import { Box, Icon, IconButton, Icons, Scroll, Switch, Text } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { SequenceCardStyle } from '../styles.css';
import { useAlternativeSidebarSetting } from './store';

type LumiereSettingsProps = {
  requestClose: () => void;
};

export function LumiereSettings({ requestClose }: LumiereSettingsProps) {
  const [alternativeSidebar, setAlternativeSidebar] = useAlternativeSidebarSetting();

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
            <Box direction="Column" gap="100">
              <Text size="L400">Design</Text>
              <SequenceCard
                className={SequenceCardStyle}
                variant="SurfaceVariant"
                direction="Column"
                gap="400"
              >
                <SettingTile
                  title="Alternative Sidebar"
                  description="Use the alternative sidebar layout and create menu."
                  after={<Switch value={alternativeSidebar} onChange={setAlternativeSidebar} />}
                />
              </SequenceCard>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
