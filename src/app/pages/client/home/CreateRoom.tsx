import React, { useEffect } from 'react';
import { Box, Icon, Icons, Scroll, IconButton } from 'folds';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Page,
  PageContent,
  PageContentCenter,
  PageHeader,
  PageHero,
  PageHeroSection,
} from '../../../components/page';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';
import { BackRouteHandler } from '../../../components/BackRouteHandler';
import { CreateRoomForm } from '../../../features/create-room';
import { useRoomNavigate } from '../../../hooks/useRoomNavigate';
import { CreateChat } from '../../../features/create-chat';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { getDMRoomFor } from '../../../utils/matrix';
import { useDirectRooms } from '../direct/useDirectRooms';
import { getHomeRoomPath } from '../../pathUtils';
import { useAlternativeSidebarSetting } from '../../../features/settings/lumiere-settings/store';

export function HomeCreateRoom() {
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();
  const [alternativeSidebar] = useAlternativeSidebarSetting();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const userId = searchParams.get('userId') ?? undefined;
  const isCreateChat = alternativeSidebar && mode === 'chat';
  const directs = useDirectRooms();

  const { navigateRoom } = useRoomNavigate();

  useEffect(() => {
    if (!isCreateChat || !userId) return;
    const roomId = getDMRoomFor(mx, userId)?.roomId;
    if (roomId && directs.includes(roomId)) {
      navigate(getHomeRoomPath(roomId), { replace: true });
    }
  }, [isCreateChat, userId, mx, directs, navigate]);

  return (
    <Page>
      {screenSize === ScreenSize.Mobile && (
        <PageHeader balance outlined={false}>
          <Box grow="Yes" alignItems="Center" gap="200">
            <BackRouteHandler>
              {(onBack) => (
                <IconButton onClick={onBack}>
                  <Icon src={Icons.ArrowLeft} />
                </IconButton>
              )}
            </BackRouteHandler>
          </Box>
        </PageHeader>
      )}
      <Box grow="Yes">
        <Scroll hideTrack visibility="Hover">
          <PageContent>
            <PageContentCenter>
              <PageHeroSection>
                <Box direction="Column" gap="700">
                  {isCreateChat ? (
                    <>
                      <PageHero
                        icon={<Icon size="600" src={Icons.Mention} />}
                        title="Create Chat"
                        subTitle="Start a private, encrypted chat by entering a user ID."
                      />
                      <CreateChat defaultUserId={userId} />
                    </>
                  ) : (
                    <>
                      <PageHero
                        icon={<Icon size="600" src={Icons.Hash} />}
                        title="Create Room"
                        subTitle="Build a Room for Real-Time Conversations."
                      />
                      <CreateRoomForm onCreate={navigateRoom} />
                    </>
                  )}
                </Box>
              </PageHeroSection>
            </PageContentCenter>
          </PageContent>
        </Scroll>
      </Box>
    </Page>
  );
}
