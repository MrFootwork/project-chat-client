import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { Room } from '../types/room';
import { Message } from '../types/message';
import { AuthContext } from './AuthWrapper';

const API_URL = config.API_URL;

const defaultStore = {
  rooms: null,
  createRoom: async (roomName: string) => {
    throw new Error('createNewRoom is not implemented in defaultStore');
  },
  deleteRoom: async (roomID: string) => {},
  fetchRooms: async () => [],
  fetchSelectedRoom: async (roomID: string) => {},
  selectedRoomID: null,
  currentRoom: null,
  pushMessage: async (message: Message) => {},
};

type RoomsContextType = {
  rooms: Room[] | null;
  createRoom: (roomName: string) => Promise<Room | undefined>;
  deleteRoom: (roomID: string) => Promise<void>;
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
    // HACK doesn't load initially without this
    setStore(prevStore => {
      console.log('Selection changed: ', prevStore.selectedRoomID);
      const selectedRoom = prevStore.rooms?.find(
        r => r.id === prevStore.selectedRoomID
      );
      if (!selectedRoom) return prevStore;

      return { ...prevStore, currentRoom: selectedRoom };
    });
  }, [store.selectedRoomID]);

  async function createRoom(roomName: string) {
    try {
      const { data } = await axios.post<Room>(
        `${API_URL}/api/rooms`,
        { name: roomName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
          },
        }
      );

      console.log('New room created successfully: ', data);
      setStore(s => ({ ...s, rooms: [...s.rooms!, data] }));

      return data;
    } catch (err) {
      console.error('Error creating new room: ', err);
    }
  }

  async function deleteRoom(roomID: string) {
    try {
      const { data } = await axios.delete<Room>(
        `${API_URL}/api/rooms/${roomID}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
          },
        }
      );

      console.log('Room deleted successfully: ', data);

      setStore(s => {
        const updatedRooms =
          s.rooms?.filter(room => room.id !== roomID) || null;

        console.log('rooms state after deletion:', updatedRooms);

        return {
          ...s,
          rooms: updatedRooms,
        };
      });
    } catch (err) {
      console.error('Error deleting room: ', err);
    }
  }

  /**
   * Fetches all rooms of user by token from the API and updates the store.
   * Logs an error if the request fails.
   *
   * @returns A promise that resolves with the list of rooms or an empty array on failure.
   */
  async function fetchRooms() {
    try {
      // Fetch rooms
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
      const response = await axios.put(
        ` ${API_URL}/api/rooms/${roomID}/read`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
          },
        }
      );

      if (response)
        console.info(
          `Entering Room ${roomID} | message: ${response.data.message}`
        );

      const { data } = await axios.get<Room>(`${API_URL}/api/rooms/${roomID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
        },
      });

      // console.log('Selected room fetched successfully: ', data);

      setStore(s => {
        if (!s.rooms) return s;

        const updatedRooms = s.rooms.map(room => {
          if (room.id === data.id) return data;
          return room;
        });

        if (!updatedRooms) return s;

        return {
          ...s,
          rooms: updatedRooms,
          selectedRoomID: roomID,
          currentRoom: data,
        };
      });
    } catch (err) {
      console.error('Error fetching selected room: ', err);
    }
  }

  // Push a new message to the correct room
  async function pushMessage(message: Message) {
    // Dependencies on state should address those inside the setter
    // using prevStore to avoid stale closures
    setStore(prevStore => {
      if (!prevStore.rooms) return prevStore;

      const updatedRooms = prevStore.rooms.map(room => {
        if (room.id === message.roomId) {
          return { ...room, messages: [...room.messages, message] };
        }
        return room;
      });

      const isCurrentRoom = prevStore.currentRoom?.id === message.roomId;

      return {
        ...prevStore,
        rooms: updatedRooms,
        currentRoom: isCurrentRoom
          ? updatedRooms.find(r => r.id === message.roomId) || null
          : prevStore.currentRoom,
      };
    });
  }

  return (
    <RoomsContext.Provider
      value={{
        ...store,
        createRoom,
        deleteRoom,
        fetchRooms,
        fetchSelectedRoom,
        pushMessage,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
