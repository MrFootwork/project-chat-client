import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { Room } from '../types/room';
import { Message } from '../types/message';
import { MessageAuthor } from '../types/user';

const API_URL = config.API_URL;

type RoomContext = Room | null;
type RoomsContext = Room[] | null;
type MessageCountMapType = {
  [roomId: string]: { total: number; unread: number };
};

const RoomsContext = React.createContext<{
  rooms: RoomsContext;
  currentRoom: RoomContext;
  fetchSelectedRoom: (roomID: string) => Promise<void>;
  updateRoomMessages: (message: Message) => void;
  messageCountMap: MessageCountMapType;
}>({
  rooms: null,
  currentRoom: null,
  fetchSelectedRoom: async () => {},
  updateRoomMessages: () => {},
  messageCountMap: {},
});

function RoomsWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<RoomsContext>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomContext>(null);
  const [messageCountMap, setMessageCountMap] = useState<MessageCountMapType>(
    {}
  );

  // Initially after login fetch all rooms
  useEffect(() => {
    if (!user) return;
    console.groupCollapsed('fetchRooms');

    fetchRooms().then(() => {
      console.log('Rooms final state:', rooms);
    });

    console.groupEnd();
  }, [!!user]);

  useEffect(() => {
    if (!rooms || !user) return;
    refreshMessageMap();
  }, [user, rooms]);

  async function fetchRooms() {
    const fetchedRooms = await axios.get(API_URL + '/api/rooms', {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(`Fetched Rooms: `, fetchedRooms.data);

    if (fetchedRooms) setRooms(fetchedRooms.data);
  }

  function refreshMessageMap() {
    const newMessageMap: MessageCountMapType = {};
    console.groupCollapsed('refreshUnreadMessages');

    rooms?.forEach(room => {
      const unreadMessages = room.messages.filter(message => {
        if (!message.readers)
          console.warn(
            'searching for unread messages: ',
            message,
            message.readers
          );
        return !message.readers?.find(reader => reader.id === user?.id);
      });

      newMessageMap[`${room.id} | ${room.name}`] = {
        total: room.messages.length,
        unread: unreadMessages.length,
      };
      console.log('Messages:', room.name, room.messages.length);
      // unreadMessagesMap[room.id] = unreadMessages.length;
    });

    setMessageCountMap(newMessageMap);
    console.table(newMessageMap);
    console.groupEnd();
  }

  /**
   * Fetches the details of a specific room by its ID and updates the state.
   *
   * This function performs the following steps:
   * 1. Sends a GET request to fetch the room details from the server.
   * 2. Updates the `currentRoom` state with the fetched room data.
   * 3. Updates the `rooms` state by replacing the existing room with the fetched room
   *    or appending it if it doesn't already exist.
   *
   * @param {string} roomId - The ID of the room to fetch.
   * @returns {Promise<void>} A promise that resolves when the room data is fetched and state is updated.
   *
   * @example
   * await fetchSelectedRoom('12345');
   */
  async function fetchSelectedRoom(roomId: string) {
    console.groupCollapsed(
      'fetchSelectedRoom',
      roomId,
      '|',
      rooms?.find(r => r.id === roomId)?.name
    );

    const response = await axios.get(API_URL + `/api/rooms/${roomId}`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    const fetchedRoom = response.data as Room;
    console.log(`Room from DB:`, fetchedRoom);

    if (!fetchedRoom) {
      console.groupEnd();
      return;
    }

    const readResponse = await axios.put(
      API_URL + `/api/rooms/${roomId}/read`,
      undefined,
      { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(
      `DB Response on setting messages to 'read':`,
      readResponse.status,
      readResponse.data
    );

    // console.log('rooms before update: ', rooms?['test01'].messages);
    console.log(
      'rooms before update: ',
      rooms?.find(r => r.id === roomId)?.messages
    );
    console.log('currentRoom before update: ', currentRoom?.messages);

    // Refresh state data
    setCurrentRoom(fetchedRoom);
    setRooms(prevRooms => {
      // Replace with fetchedRoom if it already exists in rooms
      const updatedRooms = (prevRooms || []).map(room =>
        room.id === fetchedRoom.id ? fetchedRoom : room
      );

      // I suspect this is redundant
      const isRoomPresent = updatedRooms.some(
        room => room.id === fetchedRoom.id
      );

      // Append fetchedRoom if it doesn't exist in rooms
      return isRoomPresent ? updatedRooms : [...updatedRooms, fetchedRoom];
    });

    console.log(
      'rooms after update: ',
      rooms?.find(r => r.id === roomId)?.messages
    );
    console.log('currentRoom after update: ', currentRoom?.messages);

    console.groupEnd();
  }

  /**
   * Updates the room data by adding a new message to the appropriate room.
   *
   * This function performs the following steps:
   * 1. Verifies if the user is logged in. If not, logs an error and exits.
   * 2. Checks if the room associated with the message exists in the current user's rooms.
   * 3. Ensures the message is not already present in the room to avoid duplicates.
   * 4. Adds the current user to the `readers` property of the message if the message belongs to the current room.
   * 5. Updates the state of `rooms` by appending the new message to the appropriate room.
   * 6. Updates the state of `currentRoom` if the message belongs to the currently selected room.
   *
   * @param {Message} message - The message object to be added to the room.
   * @throws Will log an error if the user is not logged in or if the room for the message is not found.
   *
   * @example
   * const newMessage = {
   *   id: '123',
   *   roomId: '456',
   *   content: 'Hello, world!',
   *   createdAt: new Date(),
   *   readers: [],
   * };
   * updateRoomByMessage(newMessage);
   */
  function updateRoomMessages(message: Message) {
    console.groupCollapsed('updateRoomMessages', message.roomId);
    // Check if user is logged in
    if (!user) {
      console.error('User not found while updating room by message');
      console.groupEnd();
      return;
    }

    // Check if room of this message exists in the rooms state
    const targetRoom = rooms?.find(room => room.id === message.roomId);

    console.assert(!!targetRoom, 'Room not found for message:', message);

    if (!targetRoom) {
      console.groupEnd();
      return;
    }

    console.log('found room', targetRoom);

    // Check if the room already has this message
    const hasThisMessage = targetRoom?.messages.some(m => m.id === message.id);

    if (hasThisMessage) {
      console.error('Room already has this message:', { message, targetRoom });
      console.groupEnd();
      return;
    }

    const messageAuthor: MessageAuthor = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      isDeleted: user.isDeleted,
    };

    // Add current user to readers list of currentRoom
    if (currentRoom?.id === message.roomId) message.readers = [messageAuthor];

    // console.log('rooms before update: ', rooms?['test01'].messages);
    // console.log('rooms before update: ', rooms['test01']);
    console.log('currentRoom before update: ', currentRoom?.messages);

    // Compute updated state synchronously
    const updatedRooms =
      rooms?.map(room => {
        if (room.id === targetRoom.id) {
          return {
            ...room,
            messages: [...room.messages, message], // Create a new messages array
          };
        }
        return room;
      }) || [];

    const updatedCurrentRoom =
      currentRoom?.id === message.roomId
        ? {
            ...currentRoom,
            messages: [...currentRoom.messages, message],
          }
        : currentRoom;
    console.log(
      `🚀 ~ new count updatedCurrentRoom:`,
      updatedCurrentRoom?.messages.length
    );

    // Update state
    setRooms(updatedRooms);
    setCurrentRoom(updatedCurrentRoom);

    // console.log('Updated rooms: ', rooms?.messages);
    console.log('Updated currentRoom: ', updatedCurrentRoom?.messages);

    // const messageCount = updatedRooms.map(room => {
    //   return {
    //     roomId: room.id,
    //     roomName: room.name,
    //     total: room.messages.length,
    //     unread: room.messages.filter(
    //       message => !message.readers.find(reader => reader.id === user?.id)
    //     ).length,
    //   };
    // });

    // console.table(messageCount);

    console.groupEnd();
  }

  return (
    <RoomsContext.Provider
      value={{
        rooms,
        currentRoom,
        fetchSelectedRoom,
        updateRoomMessages,
        messageCountMap,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
