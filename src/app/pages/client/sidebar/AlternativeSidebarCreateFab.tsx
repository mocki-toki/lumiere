import React, { MouseEventHandler, useState } from 'react';
import {
  Box,
  Icon,
  Icons,
  Menu,
  PopOut,
  RectCords,
  Text,
  Tooltip,
  TooltipProvider,
  config,
  toRem,
} from 'folds';
import classNames from 'classnames';
import FocusTrap from 'focus-trap-react';
import { useNavigate } from 'react-router-dom';
import {
  encodeSearchParamValueArray,
  getCreatePath,
  getDirectCreatePath,
  getHomeCreatePath,
  getSpacePath,
  withSearchParam,
} from '../../pathUtils';
import { stopPropagation } from '../../../utils/keyboard';
import { SidebarAvatar, SidebarItem } from '../../../components/sidebar';
import { ContainerColor } from '../../../styles/ContainerColor.css';
import { SequenceCard } from '../../../components/sequence-card';
import { SettingTile } from '../../../components/setting-tile';
import { JoinAddressPrompt } from '../../../components/join-address-prompt';
import { _RoomSearchParams } from '../../paths';
import * as css from './AlternativeSidebarCreateFab.css';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

export function AlternativeSidebarCreateFab() {
  const navigate = useNavigate();
  const screenSize = useScreenSizeContext();
  const mobile = screenSize === ScreenSize.Mobile;
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();
  const [joinAddress, setJoinAddress] = useState(false);

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const cords = evt.currentTarget.getBoundingClientRect();
    setMenuAnchor((currentState) => {
      if (currentState) return undefined;
      return cords;
    });
  };

  const handleCreateChat = () => {
    navigate(getDirectCreatePath());
    setMenuAnchor(undefined);
  };

  const handleCreateRoom = () => {
    navigate(getHomeCreatePath());
    setMenuAnchor(undefined);
  };

  const handleCreateSpace = () => {
    navigate(getCreatePath());
    setMenuAnchor(undefined);
  };

  const handleJoinWithAddress = () => {
    setJoinAddress(true);
    setMenuAnchor(undefined);
  };

  return (
    <Box className={classNames(css.FabContainer, mobile && css.FabContainerMobile)}>
      <SidebarItem className={css.FabSidebarItem}>
        <TooltipProvider
          delay={400}
          position="Top"
          tooltip={
            <Tooltip style={{ maxWidth: toRem(280) }}>
              <Text size="H5">Create</Text>
            </Tooltip>
          }
        >
          {(triggerRef) => (
            <PopOut
              anchor={menuAnchor}
              position="Top"
              align="End"
              offset={8}
              content={
                <FocusTrap
                  focusTrapOptions={{
                    returnFocusOnDeactivate: false,
                    initialFocus: false,
                    onDeactivate: () => setMenuAnchor(undefined),
                    clickOutsideDeactivates: true,
                    isKeyForward: (evt: KeyboardEvent) =>
                      evt.key === 'ArrowDown' || evt.key === 'ArrowRight',
                    isKeyBackward: (evt: KeyboardEvent) =>
                      evt.key === 'ArrowUp' || evt.key === 'ArrowLeft',
                    escapeDeactivates: stopPropagation,
                  }}
                >
                  <Menu>
                    <Box direction="Column">
                      <SequenceCard
                        style={{ padding: config.space.S300 }}
                        variant="Surface"
                        direction="Column"
                        gap="100"
                        radii="0"
                        as="button"
                        type="button"
                        onClick={handleCreateChat}
                      >
                        <SettingTile before={<Icon size="400" src={Icons.User} />}>
                          <Text size="H6">Create Chat</Text>
                          <Text size="T300" priority="300">
                            Start a new direct conversation.
                          </Text>
                        </SettingTile>
                      </SequenceCard>
                      <SequenceCard
                        style={{ padding: config.space.S300 }}
                        variant="Surface"
                        direction="Column"
                        gap="100"
                        radii="0"
                        as="button"
                        type="button"
                        onClick={handleCreateRoom}
                      >
                        <SettingTile before={<Icon size="400" src={Icons.Hash} />}>
                          <Text size="H6">Create Room</Text>
                          <Text size="T300" priority="300">
                            Create a room for group conversations.
                          </Text>
                        </SettingTile>
                      </SequenceCard>
                      <SequenceCard
                        style={{ padding: config.space.S300 }}
                        variant="Surface"
                        direction="Column"
                        gap="100"
                        radii="0"
                        as="button"
                        type="button"
                        onClick={handleCreateSpace}
                      >
                        <SettingTile before={<Icon size="400" src={Icons.Space} />}>
                          <Text size="H6">Create Space</Text>
                          <Text size="T300" priority="300">
                            Build a space for your community.
                          </Text>
                        </SettingTile>
                      </SequenceCard>
                      <SequenceCard
                        style={{ padding: config.space.S300 }}
                        variant="Surface"
                        direction="Column"
                        gap="100"
                        radii="0"
                        as="button"
                        type="button"
                        onClick={handleJoinWithAddress}
                      >
                        <SettingTile before={<Icon size="400" src={Icons.Link} />}>
                          <Text size="H6">Join with Address</Text>
                          <Text size="T300" priority="300">
                            Become a part of existing community.
                          </Text>
                        </SettingTile>
                      </SequenceCard>
                    </Box>
                  </Menu>
                </FocusTrap>
              }
            >
              <SidebarAvatar
                className={classNames(
                  css.FabSidebarAvatar,
                  menuAnchor ? ContainerColor({ variant: 'Surface' }) : undefined
                )}
                as="button"
                ref={triggerRef}
                outlined
                onClick={handleOpenMenu}
              >
                <Icon src={Icons.Plus} />
              </SidebarAvatar>
              {joinAddress && (
                <JoinAddressPrompt
                  onCancel={() => setJoinAddress(false)}
                  onOpen={(roomIdOrAlias, viaServers) => {
                    setJoinAddress(false);
                    const path = getSpacePath(roomIdOrAlias);
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
            </PopOut>
          )}
        </TooltipProvider>
      </SidebarItem>
    </Box>
  );
}
