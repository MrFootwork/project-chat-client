import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { Room } from '../types/room';
import { Message } from '../types/message';
import { AuthContext } from './AuthWrapper';

const { API_URL } = config;

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
  const { logout, user } = useContext(AuthContext);

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
    // BUG This runs twice on each selection change
    setStore(prevStore => {
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

      setStore(s => {
        const updatedRooms = [...(s.rooms || []), data];
        const sortedRooms = sortRooms(updatedRooms);

        return { ...s, rooms: sortedRooms };
      });

      return data;
    } catch (err) {
      console.error('Error creating new room: ', err);
    }
  }

  async function deleteRoom(roomID: string) {
    try {
      await axios.delete<Room>(`${API_URL}/api/rooms/${roomID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
        },
      });

      setStore(s => {
        const updatedRooms = s.rooms?.filter(room => room.id !== roomID) || [];

        if (updatedRooms.length === 0)
          return { ...s, rooms: null, selectedRoomID: null, currentRoom: null };

        const mewSelectedRoomID = updatedRooms[0].id;
        const newCurrentRoom = updatedRooms.find(
          room => room.id === mewSelectedRoomID
        );

        return {
          ...s,
          rooms: updatedRooms,
          selectedRoomID: mewSelectedRoomID,
          currentRoom: newCurrentRoom || s.currentRoom,
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

      sortRooms(data);
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
    // BUG Set this message to being read for the current user if in current room
    setStore(prevStore => {
      if (!prevStore.rooms) return prevStore;

      const updatedRooms = prevStore.rooms.map(room => {
        if (room.id === message.roomId)
          return { ...room, messages: [...room.messages, message] };

        return room;
      });

      // Sort so ChatPage would order the newest on top
      const sortedRooms = sortRooms(updatedRooms);

      const isCurrentRoom = prevStore.currentRoom?.id === message.roomId;

      return {
        ...prevStore,
        rooms: sortedRooms,
        currentRoom: isCurrentRoom
          ? updatedRooms.find(r => r.id === message.roomId) || null
          : prevStore.currentRoom,
      };
    });
  }

  /**
   * Sorts an array of rooms in place based on the latest message date or creation date.
   * Only messages sent by the current user are considered for determining the latest activity.
   * Rooms with the most recent activity are placed at the beginning of the array.
   *
   * @param rooms - The array of rooms to sort.
   * @returns The sorted array of rooms.
   */
  function sortRooms(rooms: Room[]) {
    return rooms.sort((a, b) => {
      const latestDateA = getLatestMessageDate(a);
      const latestDateB = getLatestMessageDate(b);

      return latestDateB - latestDateA;
    });

    function getLatestMessageDate(room: Room) {
      if (!room.messages || room.messages.length === 0)
        return new Date(room.createdAt).getTime();

      const latestMessageDates = room.messages.map(m => {
        // Only consider messages sent by the current user
        if (m.author.id === user?.id) return new Date(m.createdAt).getTime();

        return -Infinity;
      });

      return Math.max(...latestMessageDates);
    }
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
