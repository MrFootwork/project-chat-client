import config from '../../config';
import { MessageAuthor, User } from '../types/user';
import { Room } from '../types/room';

import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { notifications } from '@mantine/notifications';
import { IconCopyPlus } from '@tabler/icons-react';

import { AuthContext } from './AuthWrapper';
import { RoomsContext } from './RoomsWrapper';

type SocketType = Socket | null;

type SocketContextType = { socket: SocketType };

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
});

function SocketWrapper({ children }: { children: ReactNode }) {
  const { user, setUser, token } = useContext(AuthContext);
  const { rooms, addRoom } = useContext(RoomsContext);

  const [socketServer, setSocket] = useState<SocketType>(null);

  // Connect and reconnect with new room after room creation
  useEffect(() => {
    const isReadyToConnect = token && user && !!rooms?.length;

    if (!isReadyToConnect) return;

    const socket = setupSocket();
    connectSocket(socket);
    listenForRoomInvitations(socket);
    listenForNewFriends(socket);

    return () => disconnectSocket(socket);
  }, [rooms?.length]);

  function listenForNewFriends(socket: SocketType) {
    if (!socket || !user) return;

    socket.on('added-friend', (meUser: User, newFriend: MessageAuthor) => {
      notifications.show({
        title: 'New friend',
        message: `You have a new friend: ${newFriend.name}`,
        icon: <IconCopyPlus />,
      });

      setUser(prevUser => {
        if (!prevUser?.friends.some(f => f.id === newFriend.id)) {
          // Using spread Operator would cause app to lose state of rooms etc.
          prevUser!.friends.push(newFriend);
        }

        return prevUser;
      });
    });
  }

  function listenForRoomInvitations(socket: SocketType) {
    if (!socket) return;

    socket.on('invited-to-room', (room: Room, host: User) => {
      // Add room to store so it can be displayed in the UI
      addRoom(room);

      if (host.id !== user?.id) {
        notifications.show({
          title: 'Room invitation',
          message: `You have been invited to a room: ${room.name}`,
          icon: <IconCopyPlus />,
        });
      }
    });
  }

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
