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

  // Connect and reconnect with new room after room creation
  useEffect(() => {
    const isReadyToConnect = token && user && !!rooms?.length;

    if (!isReadyToConnect) return;

    const socket = setupSocket();
    connectSocket(socket);

    return () => disconnectSocket(socket);
  }, [rooms?.length]);

  function connectSocket(socket: SocketType) {
    if (!socket) return;

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
  }

  function setupSocket() {
    console.log('Connecting to socket server...');

    const socketServerURL = config.API_URL;
    const socket = io(socketServerURL, { auth: { token } });

    setSocket(socket);

    return socket;
  }

  function disconnectSocket(socket: SocketType) {
    if (!socket) return;

    console.groupCollapsed('Socket disconnecting');
    console.log(`Disconnecting from socket server ${socket.id}...`);
    socket.disconnect();
    setSocket(null);
    console.log('Disconnected from socket server.');
    console.groupEnd();
  }

  return (
    <SocketContext.Provider value={{ socket: socketServer }}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketWrapper, SocketContext };
