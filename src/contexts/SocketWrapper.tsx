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
    const isReadyToConnect = token && user && (rooms?.length ?? 0) > 0;

    console.log('Checking connection status...', { isReadyToConnect });

    if (isReadyToConnect) {
      // Avoid reconnecting if the socket is already connected
      if (socketServer) {
        console.log('Socket is already connected. Skipping reconnection.');
        return;
      }

      const socketServerURL = config.API_URL;
      const socket = io(socketServerURL, { auth: { token } });

      setSocket(socket);

      socket.on('connect', () => {
        console.log(`You are connected to socket ${socket.id} as ${user.name}`);
        console.log(`These are your rooms: `, rooms);

        if (!rooms) {
          console.warn('Rooms is null');
          return;
        }

        const roomIDs = rooms.map(room => room.id);
        socket.emit('join-room', roomIDs);
      });

      return () => {
        console.log('Disconnecting from socket server...');
        socket.disconnect();
        setSocket(null);
        console.log('Disconnected from socket server.');
      };
    }

    // Disconnect if the user or token are missing
    if (!isReadyToConnect && socketServer) {
      console.log('Disconnecting due to missing token, user, or rooms...');
      socketServer.disconnect();
      setSocket(null);
    }
  }, [token, JSON.stringify(rooms), JSON.stringify(rooms)]);

  return (
    <SocketContext.Provider value={{ socket: socketServer }}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketWrapper, SocketContext };
