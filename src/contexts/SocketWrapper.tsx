import config from '../../config';
import { MessageAuthor, RoomMember, User } from '../types/user';
import { Room } from '../types/room';
import { Message } from '../types/message';

import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { notifications } from '@mantine/notifications';
import { IconCopyPlus, IconDoorOff } from '@tabler/icons-react';

import { AuthContext } from './AuthWrapper';
import { RoomsContext } from './RoomsWrapper';

type SocketType = Socket | null;

type SocketContextType = {
  socket: SocketType;
  botModel: string;
  setBotModel: React.Dispatch<React.SetStateAction<string>>;
  online: Record<string, boolean>;
};

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  botModel: 'gpt',
  setBotModel: () => {},
  online: {},
});

function SocketWrapper({ children }: { children: ReactNode }) {
  const { user, setUser, token } = useContext(AuthContext);
  const {
    rooms,
    updateRoomMemberStatus,
    createOrUpdateMembers,
    selectedRoomID,
    pushMessageChunks,
    updateMessage,
    selectRoom,
    deleteRoom,
  } = useContext(RoomsContext);

  const [socketServer, setSocket] = useState<SocketType>(null);
  const [botModel, setBotModel] = useState<string>('gpt');
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

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
    // HACK rooms?.[0]?.id gives the best result
  }, [socketServer, rooms?.[0]?.id]);

  // Listener for users online and offline
  useEffect(() => {
    if (!socketServer?.connected) return;

    const handleUserOnline = (userID: string) => {
      setOnlineMap(prev => ({ ...prev, [userID]: true }));
    };

    const handleUserOffline = (userID: string) => {
      setOnlineMap(prev => {
        const updated = { ...prev };
        delete updated[userID];
        return updated;
      });
    };

    const handleInitialOnlineStatus = (onlineUserIDs: string[]) => {
      setOnlineMap(() => {
        const initialMap: Record<string, boolean> = {};
        onlineUserIDs.forEach(userID => {
          initialMap[userID] = true;
        });
        return initialMap;
      });
    };

    // Request initial online statuses
    socketServer.emit('get-initial-online-status');

    socketServer.on('initial-online-status', handleInitialOnlineStatus);
    socketServer.on('user-online', handleUserOnline);
    socketServer.on('user-offline', handleUserOffline);

    return () => {
      socketServer.off('initial-online-status', handleInitialOnlineStatus);
      socketServer.off('user-online', handleUserOnline);
      socketServer.off('user-offline', handleUserOffline);
    };
  }, [socketServer?.connected]);

  // Listener for Messages
  useEffect(() => {
    const handleMessageUpdate = (message: Message) => {
      updateMessage(message);
    };

    socketServer?.on('edited-message', handleMessageUpdate);
    socketServer?.on('deleted-message', handleMessageUpdate);

    return () => {
      socketServer?.off('edited-message', handleMessageUpdate);
      socketServer?.off('deleted-message', handleMessageUpdate);
    };
  }, [socketServer?.connected, updateMessage]);

  // Listener for AI stream
  useEffect(() => {
    if (!socketServer?.connected) return;

    const handleAIStream = (messageID: string, chunk: string) =>
      pushMessageChunks(selectedRoomID, messageID, chunk);

    socketServer.on('stream-bot-message', handleAIStream);

    return () => {
      socketServer.off('stream-bot-message', handleAIStream);
    };
  }, [
    socketServer?.connected,
    user?.friends,
    selectRoom,
    handleNewRoomMember,
    handleRoomMemberRemoval,
  ]);

  // Listener for room deletions
  useEffect(() => {
    if (!socketServer?.connected) return;

    const handleRoomDeletion = (roomID: string) => {
      console.log('🚮 Deleting room', roomID);
      deleteRoom(roomID);
    };

    socketServer.on('deleted-room', handleRoomDeletion);

    return () => {
      socketServer.off('deleted-room', handleRoomDeletion);
    };
  }, [socketServer?.connected, rooms]);

  // Listener for room members
  useEffect(() => {
    if (!socketServer?.connected) return;

    socketServer.on('invited-to-room', handleNewRoomMember);
    socketServer.on('removed-from-room', handleRoomMemberRemoval);

    return () => {
      socketServer.off('invited-to-room', handleNewRoomMember);
      socketServer.off('removed-from-room', handleRoomMemberRemoval);
    };
  }, [
    socketServer?.connected,
    selectedRoomID,
    JSON.stringify(rooms?.map(r => ({ id: r.id, members: r.members }))),
  ]);

  // Listener for user friends
  useEffect(() => {
    if (!socketServer?.connected) return;

    socketServer.on('added-friend', handleNewFriend);

    return () => {
      socketServer.off('added-friend', handleNewFriend);
    };
  }, [socketServer?.connected, user?.friends]);

  function handleRoomMemberRemoval(room: Room, IDsToRemove: string[]) {
    console.log(
      'Receive Removal:',
      IDsToRemove,
      room.members.map(m => ({ name: m.name, left: m.userLeft }))
    );

    const allMembers = room.members.map(m => ({
      id: m.id,
      userLeft: m.userLeft,
    }));

    const selectedMembers = allMembers.filter(m => IDsToRemove.includes(m.id));

    // Add room to store so it can be displayed in the UI
    updateRoomMemberStatus(room.id, selectedMembers);

    if (IDsToRemove.includes(user!.id)) {
      notifications.show({
        title: 'Room removal',
        message: `You have been removed from room: ${room.name}`,
        icon: <IconDoorOff />,
      });
    }
  }

  function handleNewRoomMember(room: Room, addedMembers: RoomMember[]) {
    console.log('Invited to new room', room.name);
    // Add room to store so it can be displayed in the UI
    // addRoom(room);
    const userEntersRoomFirstTime = !rooms!.map(r => r.id).includes(room.id);

    createOrUpdateMembers(addedMembers, room);

    if (addedMembers.map(m => m.id).includes(user!.id)) {
      notifications.show({
        title: 'Room invitation',
        message: `You have been invited to a room: ${room.name}`,
        icon: <IconCopyPlus />,
      });
    }
  }

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

    // State to track if the error notification has been shown
    let notificationShown = false;

    // Handle connection errors
    socket.on('connect_error', error => {
      console.error('Socket connection failed:', error.message);

      if (!notificationShown) {
        notifications.show({
          title: 'Connection Error',
          message: 'Failed to connect to the server. Please try again later.',
          color: 'red',
          autoClose: false,
        });
        notificationShown = true;
      }
    });

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
    <SocketContext.Provider
      value={{ socket: socketServer, botModel, setBotModel, online: onlineMap }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export { SocketContext, SocketWrapper };
