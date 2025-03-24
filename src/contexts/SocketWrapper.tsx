import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { io, Socket } from 'socket.io-client';
import { RoomsContext } from './RoomsWrapper';

type SocketType = Socket | null;

type SocketContextType = { socket: SocketType };

const SocketContext = React.createContext<SocketContextType>({ socket: null });

function SocketWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const { rooms } = useContext(RoomsContext);

  const [socket, setSocket] = useState<SocketType>(null);
  const [readyToConnect, setReadyToConnect] = useState(false);

  useEffect(() => {
    if (token && user && rooms?.length) setReadyToConnect(true);
  }, [token, user, rooms]);

  useEffect(() => {
    if (!(token && user && rooms?.length)) return;

    const socketServerURL = config.API_URL;
    const socketServer = io(socketServerURL, { auth: { token } });

    setSocket(socketServer);

    socketServer.on('connect', () => {
      console.log(
        `You are connected to socket ${socketServer.id} as ${user.name}`
      );
    });

    return () => {
      socketServer.disconnect();
      setSocket(null);
      console.log('Disconnected from socket server.');
    };
  }, [readyToConnect]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export { SocketWrapper, SocketContext };
