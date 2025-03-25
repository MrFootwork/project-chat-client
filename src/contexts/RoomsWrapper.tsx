import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { Room } from '../types/room';

const API_URL = config.API_URL;

type RoomContext = Room | null;
type RoomsContext = Room[] | null;

const RoomsContext = React.createContext<{
  rooms: RoomsContext;
  currentRoom: RoomContext;
  setCurrentRoom: (room: RoomContext) => void;
  fetchSelectedRoom: (roomID: string) => Promise<void>;
}>({
  rooms: null,
  currentRoom: null,
  setCurrentRoom: () => {},
  fetchSelectedRoom: async () => {},
});

function RoomsWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<RoomsContext>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomContext>(null);

  // Initially after login fetch all rooms
  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  async function fetchRooms() {
    const fetchedRooms = await axios.get(API_URL + '/api/rooms', {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (fetchedRooms) setRooms(fetchedRooms.data);
  }

  // Fetch room for a given room ID
  async function fetchSelectedRoom(roomId: string) {
    const response = await axios.get(API_URL + `/api/rooms/${roomId}`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });

    const fetchedRoom = response.data as Room;

    if (!fetchedRoom) return;

    setCurrentRoom(fetchedRoom);
    setRooms(prevRooms => {
      // Update the room if it already exists in rooms
      const updatedRooms = (prevRooms || []).map(room =>
        room.id === fetchedRoom.id ? fetchedRoom : room
      );

      const isRoomPresent = updatedRooms.some(
        room => room.id === fetchedRoom.id
      );

      return isRoomPresent ? updatedRooms : [...updatedRooms, fetchedRoom];
    });
  }

  return (
    <RoomsContext.Provider
      value={{
        rooms,
        currentRoom,
        setCurrentRoom,
        fetchSelectedRoom,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
