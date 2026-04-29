import React, { useEffect, useState } from 'react';
import { Box, Button, Icon, IconButton, Icons, Scroll, Spinner, Switch, Text, color, config } from 'folds';
import { Page, PageContent, PageHeader } from '../../../components/page';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { SequenceCardStyle } from '../styles.css';
import { Modal500 } from '../../../components/Modal500';
import {
  useAlternativeSidebarSetting,
  useChangelogDismissedForVersionSetting,
  useCompactChatsSetting,
  useDisableMessageOptionsBarSetting,
  useNeverShowChangelogSetting,
  useRoundAvatarsSetting,
  useShowLastMessageSetting,
} from './store';
import { LUMIERE_VERSION } from '../../../branding/version';

type LumiereSettingsProps = {
  requestClose: () => void;
};

export function LumiereSettings({ requestClose }: LumiereSettingsProps) {
  type ChangelogRelease = {
    id: number;
    name: string | null;
    tag_name: string;
    published_at: string | null;
    body: string | null;
    html_url: string;
  };
  const [alternativeSidebar, setAlternativeSidebar] = useAlternativeSidebarSetting();
  const [showLastMessage, setShowLastMessage] = useShowLastMessageSetting();
  const [compactChats, setCompactChats] = useCompactChatsSetting();
  const [disableMessageOptionsBar, setDisableMessageOptionsBar] =
    useDisableMessageOptionsBarSetting();
  const [roundAvatars, setRoundAvatars] = useRoundAvatarsSetting();
  const [neverShowChangelog, setNeverShowChangelog] = useNeverShowChangelogSetting();
  const [, setChangelogDismissedForVersion] = useChangelogDismissedForVersionSetting();
  const [openChangelog, setOpenChangelog] = useState(false);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string>();
  const [releases, setReleases] = useState<ChangelogRelease[]>([]);

  useEffect(() => {
    if (!openChangelog) return undefined;
    let disposed = false;
    const load = async () => {
      setLoadingReleases(true);
      setReleasesError(undefined);
      try {
        const res = await fetch('https://api.github.com/repos/mocki-toki/lumiere/releases?per_page=20');
        if (!res.ok) throw new Error(`Failed to load releases (${res.status})`);
        const data = (await res.json()) as unknown;
        if (!Array.isArray(data)) throw new Error('Invalid releases response');
        const mapped = data
          .map((item) => item as Partial<ChangelogRelease>)
          .filter(
            (item): item is ChangelogRelease =>
              typeof item.id === 'number' && typeof item.tag_name === 'string'
          )
          .map((item) => ({
            id: item.id,
            name: item.name ?? null,
            tag_name: item.tag_name,
            published_at: item.published_at ?? null,
            body: item.body ?? null,
            html_url:
              item.html_url ?? `https://github.com/mocki-toki/lumiere/releases/tag/${item.tag_name}`,
          }));
        if (!disposed) setReleases(mapped);
      } catch (e) {
        if (!disposed) setReleasesError(e instanceof Error ? e.message : 'Failed to load changelog');
      } finally {
        if (!disposed) setLoadingReleases(false);
      }
    };
    load();
    return () => {
      disposed = true;
    };
  }, [openChangelog]);

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
                <Text size="L400">Chat</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Disable Message Action Bar"
                    description="Hides the hover message action bar. Right-click context menu still works."
                    after={
                      <Switch
                        value={disableMessageOptionsBar}
                        onChange={setDisableMessageOptionsBar}
                      />
                    }
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
              <Box direction="Column" gap="100">
                <Text size="L400">Updates</Text>
                <SequenceCard
                  className={SequenceCardStyle}
                  variant="SurfaceVariant"
                  direction="Column"
                  gap="400"
                >
                  <SettingTile
                    title="Never Show Changelog"
                    description="Never display changelog card in Home."
                    after={
                      <Switch
                        value={neverShowChangelog}
                        onChange={(value) => {
                          setNeverShowChangelog(value);
                          if (!value) {
                            setChangelogDismissedForVersion('');
                          } else {
                            setChangelogDismissedForVersion(LUMIERE_VERSION);
                          }
                        }}
                      />
                    }
                  />
                  <SettingTile
                    title="Open Changelog"
                    description="Open the latest Lumiere release notes."
                    after={
                      <Button
                        onClick={() => setOpenChangelog(true)}
                        variant="Secondary"
                        fill="Soft"
                        size="300"
                        radii="300"
                        before={<Icon src={Icons.Link} size="100" />}
                      >
                        <Text size="B300">Open</Text>
                      </Button>
                    }
                  />
                </SequenceCard>
              </Box>
            </Box>
          </PageContent>
        </Scroll>
      </Box>
      {openChangelog && (
        <Modal500 requestClose={() => setOpenChangelog(false)}>
          <Box direction="Column" style={{ height: '90vh' }}>
            <Box
              shrink="No"
              alignItems="Center"
              gap="200"
              style={{
                padding: `${config.space.S200} ${config.space.S300}`,
                borderBottom: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
              }}
            >
              <Box grow="Yes">
                <Text as="span" size="H4" truncate>
                  Changelog
                </Text>
              </Box>
              <IconButton onClick={() => setOpenChangelog(false)} variant="Background">
                <Icon src={Icons.Cross} />
              </IconButton>
            </Box>
            <Scroll hideTrack visibility="Hover">
              <Box direction="Column" gap="300" style={{ padding: config.space.S300 }}>
                {loadingReleases && (
                  <Box
                    alignItems="Center"
                    justifyContent="Center"
                    gap="200"
                    style={{ color: color.Success.Main, minHeight: '50vh' }}
                  >
                    <Spinner size="200" variant="Success" />
                    <Text size="T300">Loading releases...</Text>
                  </Box>
                )}
                {!loadingReleases && releasesError && (
                  <Box direction="Column" gap="200">
                    <Text size="L400" style={{ color: color.Critical.Main }}>
                      Failed to load changelog
                    </Text>
                    <Text size="T300" priority="300">
                      {releasesError}
                    </Text>
                  </Box>
                )}
                {!loadingReleases && !releasesError && releases.length === 0 && (
                  <Text size="T300" priority="300">
                    No releases found.
                  </Text>
                )}
                {!loadingReleases &&
                  !releasesError &&
                  releases.map((release) => (
                    <Box
                      key={release.id}
                      direction="Column"
                      gap="200"
                      style={{
                        padding: config.space.S300,
                        borderRadius: config.radii.R400,
                        border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
                      }}
                    >
                      <Box alignItems="Center" gap="200" wrap="Wrap">
                        <Text size="L400" style={{ fontWeight: 600 }}>
                          {release.name || release.tag_name}
                        </Text>
                        {release.published_at && (
                          <Text size="T200" priority="300">
                            {new Date(release.published_at).toLocaleDateString()}
                          </Text>
                        )}
                      </Box>
                      <Text size="T300" style={{ whiteSpace: 'pre-wrap' }}>
                        {release.body?.trim() || 'No details provided.'}
                      </Text>
                      <Box>
                        <Button
                          as="a"
                          href={release.html_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          size="300"
                          variant="Secondary"
                          fill="Soft"
                          radii="300"
                          before={<Icon src={Icons.Link} size="100" />}
                        >
                          <Text size="B300">Open on GitHub</Text>
                        </Button>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Scroll>
          </Box>
        </Modal500>
      )}
    </Page>
  );
}
