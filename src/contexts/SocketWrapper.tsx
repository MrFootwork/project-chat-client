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
  const { rooms, addRoom, selectedRoomID, pushMessageChunks } =
    useContext(RoomsContext);

  const [socketServer, setSocket] = useState<SocketType>(null);

  // Setup on mount
  useEffect(() => {
    if (!token || !user) return;
    if (socketServer) return; // Only setup once

    setupSocket();
  }, [token, user?.id, socketServer]);

  // Connect socket & join rooms
  useEffect(() => {
    if (rooms && socketServer) {
      connectSocket(socketServer);
    }

    return () => disconnectSocket(socketServer);
  }, [socketServer, rooms?.[0]?.id]);

  // Listener for AI stream
  useEffect(() => {
    if (!socketServer?.connected) return;

    const handleAIStream = (messageID: string, chunk: string) =>
      pushMessageChunks(selectedRoomID, messageID, chunk);

    socketServer.on('stream-bot-message', handleAIStream);

    return () => {
      socketServer.off('stream-bot-message', handleAIStream);
    };
  }, [socketServer?.connected, user?.friends]);

  // Listener for user friends
  useEffect(() => {
    if (!socketServer?.connected) return;

    socketServer.on('added-friend', handleNewFriend);

    return () => {
      socketServer.off('added-friend', handleNewFriend);
    };
  }, [socketServer?.connected, user?.friends]);

  // Listener for room members
  useEffect(() => {
    if (!socketServer?.connected) return;

    socketServer.on('invited-to-room', handleNewRoomMember);

    return () => {
      socketServer.off('invited-to-room', handleNewRoomMember);
    };
  }, [
    socketServer?.connected,
    rooms?.map(r => ({ id: r.id, members: r.members })),
  ]);

  function handleNewFriend(meUser: User, newFriend: MessageAuthor) {
    notifications.show({
      title: 'New friend',
      message: `You have a new friend: ${newFriend.name}`,
      icon: <IconCopyPlus />,
    });

    setUser(prevUser => {
      if (!prevUser?.friends.some(f => f.id === newFriend.id)) {
        return {
          ...prevUser,
          friends: [...prevUser!.friends, newFriend],
        } as User;
      }

      return prevUser;
    });
  }

  function handleNewRoomMember(room: Room, host: User) {
    // Add room to store so it can be displayed in the UI
    addRoom(room);

    if (host.id !== user?.id) {
      notifications.show({
        title: 'Room invitation',
        message: `You have been invited to a room: ${room.name}`,
        icon: <IconCopyPlus />,
      });
    }
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
