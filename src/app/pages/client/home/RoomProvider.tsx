import React, { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { IsDirectRoomProvider, RoomProvider } from '../../../hooks/useRoom';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { JoinBeforeNavigate } from '../../../features/join-before-navigate';
import { useHomeRooms } from './useHomeRooms';
import { useSearchParamsViaServers } from '../../../hooks/router/useSearchParamsViaServers';
import { useDirectRooms } from '../direct/useDirectRooms';
import { useAlternativeSidebarSetting } from '../../../features/settings/lumiere-settings/store';
import { mDirectAtom } from '../../../state/mDirectList';

export function HomeRouteRoomProvider({ children }: { children: ReactNode }) {
  const mx = useMatrixClient();
  const [alternativeSidebar] = useAlternativeSidebarSetting();
  const homeRooms = useHomeRooms();
  const directRooms = useDirectRooms();
  const mDirects = useAtomValue(mDirectAtom);
  const rooms = alternativeSidebar ? [...homeRooms, ...directRooms] : homeRooms;

  const { roomIdOrAlias, eventId } = useParams();
  const viaServers = useSearchParamsViaServers();
  const roomId = useSelectedRoom();
  const room = mx.getRoom(roomId);

  if (!roomIdOrAlias) return null;

  if (!room || !rooms.includes(room.roomId)) {
    return (
      <JoinBeforeNavigate
        roomIdOrAlias={roomIdOrAlias}
        eventId={eventId}
        viaServers={viaServers}
      />
    );
  }

  return (
    <RoomProvider key={room.roomId} value={room}>
      <IsDirectRoomProvider value={mDirects.has(room.roomId)}>{children}</IsDirectRoomProvider>
    </RoomProvider>
  );
}
