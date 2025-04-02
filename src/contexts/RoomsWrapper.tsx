import axios from 'axios';
import React, {
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import config from '../../config';
import { Room } from '../types/room';
import { Message } from '../types/message';
import { AuthContext } from './AuthWrapper';

const API_URL = config.API_URL;

const defaultStore = {
  rooms: null,
  fetchRooms: async () => [],
  fetchSelectedRoom: async (roomID: string) => {},
  selectedRoomID: null,
  currentRoom: null,
  pushMessage: async (message: Message) => {},
};

type RoomsContextType = {
  rooms: Room[] | null;
  fetchRooms: () => Promise<Room[]>;
  fetchSelectedRoom: (roomID: string) => Promise<void>;
  selectedRoomID: string | null;
  currentRoom: Room | null;
  pushMessage: (message: Message) => Promise<void>;
};

const RoomsContext = React.createContext<RoomsContextType>(defaultStore);

function RoomsWrapper({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<RoomsContextType>(defaultStore);
  const { logout } = useContext(AuthContext);

  // Reset to default, if user logs out
  useEffect(() => {
    setStore(s => ({
      ...s,
      rooms: null,
      selectedRoomID: null,
      currentRoom: null,
    }));
  }, [logout]);

  // Set Current Room on each selection change
  useEffect(() => {
    console.log('Selection changed: ', store.selectedRoomID);
    const selectedRoom = store.rooms?.find(r => r.id === store.selectedRoomID);
    if (!selectedRoom) return;

    // HACK doesn't load initially without this
    setStore(s => ({ ...s, currentRoom: selectedRoom }));
  }, [store.selectedRoomID]);

  /**
   * Fetches all rooms of user by token from the API and updates the store.
   * Logs an error if the request fails.
   *
   * @returns A promise that resolves with the list of rooms or an empty array on failure.
   */
  async function fetchRooms() {
    try {
      const { data } = await axios.get<Room[]>(`${API_URL}/api/rooms`, {
        headers: {
          // TODO add token retrieval method
          Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
        },
      });

      console.log('Rooms fetched successfully: ', data);
      setStore(s => ({ ...s, rooms: data, selectedRoomID: data[0]?.id }));

      return data;
    } catch (err) {
      console.error('Error fetching rooms: ', err);
      return [];
    }
  }

  /**
   * Fetches the details of a selected room by its ID and updates the store.
   *
   * @param roomID - The ID of the room to fetch.
   * @returns Resolves when the room is successfully fetched and the store is updated.
   */
  async function fetchSelectedRoom(roomID: string) {
    try {
      const { data } = await axios.get<Room>(`${API_URL}/api/rooms/${roomID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
        },
      });

      // console.log('Selected room fetched successfully: ', data);

      if (!store.rooms) return;

      const updatedRooms = store.rooms.map(room => {
        if (room.id === data.id) return data;
        return room;
      });

      if (!updatedRooms) return;

      setStore(s => ({
        ...s,
        rooms: updatedRooms,
        selectedRoomID: roomID,
        currentRoom: data,
      }));
    } catch (err) {
      console.error('Error fetching selected room: ', err);
    }
  }

  // Push a new message to the correct room
  async function pushMessage(message: Message) {
    if (!store.rooms) return;

    const updatedRooms = store.rooms.map(room => {
      if (room.id === message.roomId) {
        return { ...room, messages: [...room.messages, message] };
      }
      return room;
    });

    const isCurrentRoom = store.currentRoom?.id === message.roomId;

    if (!isCurrentRoom) {
      setStore(s => ({ ...s, rooms: updatedRooms }));
    } else if (isCurrentRoom) {
      const updatedCurrentRoom =
        updatedRooms.find(r => r.id === message.roomId) || null;

      setStore(s => ({
        ...s,
        rooms: updatedRooms,
        currentRoom: updatedCurrentRoom,
      }));
    }
  }

  return (
    <RoomsContext.Provider
      value={{ ...store, fetchRooms, fetchSelectedRoom, pushMessage }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
