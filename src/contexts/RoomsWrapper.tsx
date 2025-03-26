import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { Room } from '../types/room';
import { Message } from '../types/message';

const API_URL = config.API_URL;

type RoomContext = Room | null;
type RoomsContext = Room[] | null;
type UnreadRoomMessagesMap = { [roomId: string]: number };

const RoomsContext = React.createContext<{
  rooms: RoomsContext;
  currentRoom: RoomContext;
  fetchSelectedRoom: (roomID: string) => Promise<void>;
  updateRoomByMessage: (message: Message) => void;
}>({
  rooms: null,
  currentRoom: null,
  fetchSelectedRoom: async () => {},
  updateRoomByMessage: () => {},
});

function RoomsWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<RoomsContext>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomContext>(null);
  const [unreadRoomMessagesMap, setUnreadRoomMessagesMap] =
    useState<UnreadRoomMessagesMap>({});

  // Initially after login fetch all rooms
  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  // FIXME Count and store unread messages for each room

  async function fetchRooms() {
    const fetchedRooms = await axios.get(API_URL + '/api/rooms', {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (fetchedRooms) setRooms(fetchedRooms.data);
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
    const response = await axios.get(API_URL + `/api/rooms/${roomId}`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    const fetchedRoom = response.data as Room;

    if (!fetchedRoom) return;

    const readResponse = await axios.put(
      API_URL + `/api/rooms/${roomId}/read`,
      undefined,
      { withCredentials: true, headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(
      `🚀 ~ fetchSelectedRoom ~ readResponse:`,
      readResponse.status,
      readResponse.data
    );

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
  }

  /**
   * Updates the room data by adding a new message to the appropriate room.
   *
   * This function performs the following steps:
   * 1. Verifies if the user is logged in. If not, logs an error and exits.
   * 2. Checks if the room associated with the message exists in the current user's rooms.
   * 3. Ensures the message is not already present in the room to avoid duplicates.
   * 4. Adds the current user to the `readBy` property of the message if the message belongs to the current room.
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
   *   readBy: [],
   * };
   * updateRoomByMessage(newMessage);
   */
  function updateRoomByMessage(message: Message) {
    console.groupCollapsed('updateRoomByMessage', message.roomId);
    // Check if user is logged in
    if (!user) {
      console.error('User not found while updating room by message');
      console.groupEnd();
      return;
    }

    // Check if room of this message exists in the user's rooms list
    const roomWithNewMessage = rooms?.find(room => room.id === message.roomId);

    console.assert(
      !!roomWithNewMessage,
      'Room not found for message:',
      message
    );

    if (!roomWithNewMessage) {
      console.groupEnd();
      return;
    }

    // Check if the message is already present in the room
    const isMessagePresent = roomWithNewMessage?.messages.some(
      m => m.id === message.id
    );

    if (isMessagePresent) {
      console.groupEnd();
      return;
    }

    const messageAuthor = {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
      isDeleted: user.isDeleted,
    };

    // Add current user to readBy of currentRoom
    if (currentRoom?.id === message.roomId) message.readBy = [messageAuthor];

    // Compute updated state synchronously
    const updatedRooms =
      rooms?.map(room => {
        if (room.id === roomWithNewMessage.id) {
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

    // Update state
    setRooms(updatedRooms);
    setCurrentRoom(updatedCurrentRoom);

    console.log('Updated rooms: ', updatedRooms);
    console.log('Updated currentRoom: ', updatedCurrentRoom);

    console.groupEnd();
  }

  return (
    <RoomsContext.Provider
      value={{
        rooms,
        currentRoom,
        fetchSelectedRoom,
        updateRoomByMessage,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
