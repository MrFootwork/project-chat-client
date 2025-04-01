import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import config from '../../config';

import { AuthContext } from './AuthWrapper';
import { RoomsContext } from './RoomsWrapper';

type SocketType = Socket | null;

type SocketContextType = { socket: SocketType };

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
});

function SocketWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const { rooms } = useContext(RoomsContext);

  const [socketServer, setSocket] = useState<SocketType>(null);

  useEffect(() => {
    // HACK Without the timeout, the socket would disconnect sometimes
    // on room changes. Test if that's still the case!
    setTimeout(() => {
      const isReadyToConnect = token && user && !!rooms?.length;

      if (isReadyToConnect) {
        console.group('SocketWrapper');

        // Avoid reconnecting if the socket is already connected
        if (socketServer) {
          console.log('Socket is already connected. Skipping reconnection.');
          return;
        }

        console.log('Connecting to socket server...');

        const socketServerURL = config.API_URL;
        const socket = io(socketServerURL, { auth: { token } });

        setSocket(socket);

        socket.on('connect', () => {
          console.groupCollapsed('Socket connected', socket.id);
          console.table({ socket });
          console.table({ user });
          console.table(rooms);

          if (!rooms) {
            console.warn('You have no rooms: ', rooms);
            return;
          }

          const roomIDs = rooms.map(room => room.id);

          socket.emit('join-room', roomIDs);
          console.groupEnd();
          console.groupEnd();
        });

        return () => {
          console.groupCollapsed('Socket disconnecting');
          console.log(`Disconnecting from socket server ${socket.id}...`);
          socket.disconnect();
          setSocket(null);
          console.log('Disconnected from socket server.');
          console.groupEnd();
        };
      }

      // Disconnect if the user or token are missing
      if (!isReadyToConnect && socketServer) {
        console.log(
          'Disconnecting due to missing token, user, or rooms...',
          token,
          user,
          rooms
        );
        socketServer.disconnect();
        setSocket(null);
        console.log('Disconnected from socket server.');
      }
    }, 500);
  }, [user?.id, token, Boolean(rooms?.length)]);

  return (
    <SocketContext.Provider value={{ socket: socketServer }}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketWrapper, SocketContext };
