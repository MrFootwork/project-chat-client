import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { Room } from '../types/room';

const API_URL = config.API_URL;

type RoomContext = Room | null;
type RoomsContext = Room[] | null;

const RoomsContext = React.createContext({
  rooms: [] as RoomsContext,
  currentRoom: null as RoomContext,
  setCurrentRoom: (room: RoomContext) => {},
});

function RoomsWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<RoomsContext>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomContext>(null);

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  async function fetchRooms() {
    // const fetchedRooms = await axios.get(API_URL + '/api/rooms/all', {
    // TESTING for now fetch all rooms
    // Should be only the user's rooms in the end.
    const fetchedRooms = await axios.get(API_URL + '/api/rooms', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (fetchedRooms) setRooms(fetchedRooms.data);
  }

  return (
    <RoomsContext.Provider value={{ rooms, currentRoom, setCurrentRoom }}>
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
