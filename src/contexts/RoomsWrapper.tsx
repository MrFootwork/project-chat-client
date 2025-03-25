import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { Room } from '../types/room';
import { Message } from '../types/message';

const API_URL = config.API_URL;

type RoomContext = Room | null;
type RoomsContext = Room[] | null;

const RoomsContext = React.createContext<{
  rooms: RoomsContext;
  currentRoom: RoomContext;
  // setCurrentRoom: (room: RoomContext) => void;
  fetchSelectedRoom: (roomID: string) => Promise<void>;
  updateRoomByMessage: (message: Message) => void;
}>({
  rooms: null,
  currentRoom: null,
  // setCurrentRoom: () => {},
  fetchSelectedRoom: async () => {},
  updateRoomByMessage: () => {},
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
      // TODO There is redundant logic here. Check and refactor.
      // Replace with fetchedRoom if it already exists in rooms
      const updatedRooms = (prevRooms || []).map(room =>
        room.id === fetchedRoom.id ? fetchedRoom : room
      );

      // I suspect this is redundant
      const isRoomPresent = updatedRooms.some(
        room => room.id === fetchedRoom.id
      );

      // Update the room if it already exists in rooms
      return isRoomPresent ? updatedRooms : [...updatedRooms, fetchedRoom];
    });
  }

  // FIXME Count and store unread messages for each room

  // FIXME Push new room messages to the room
  // set readBy if match on currentRoom
  function updateRoomByMessage(message: Message) {
    console.log('Adding message...', message);
    setRooms(prevRooms => {
      return prevRooms;
    });
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
