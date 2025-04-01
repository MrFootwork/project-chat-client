import axios from 'axios';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import config from '../../config';
import { Room } from '../types/room';
import { Message } from '../types/message';

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

  // Set Current Room on each selection change
  useEffect(() => {
    console.log('Selection changed: ', store.selectedRoomID);
    const selectedRoom = store.rooms?.find(r => r.id === store.selectedRoomID);
    if (!selectedRoom) return;

    // HACK doesn't load initially without this
    setStore(s => ({ ...s, currentRoom: selectedRoom }));
  }, [store.selectedRoomID]);

  // Fetch all rooms on mount
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

  // Fetch and set selected room on room change
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

    if (isCurrentRoom) {
      const updatedCurrentRoom =
        updatedRooms.find(r => r.id === message.roomId) || null;

      setStore(s => ({
        ...s,
        rooms: updatedRooms,
        currentRoom: updatedCurrentRoom,
      }));
    } else {
      setStore(s => ({ ...s, rooms: updatedRooms }));
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
