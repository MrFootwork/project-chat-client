import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';
import { AuthContext } from './AuthWrapper';
import { Room } from '../types/room';

const API_URL = config.API_URL;

type RoomContext = Room[] | null;

const RoomsContext = React.createContext({
  rooms: [] as RoomContext,
});

function RoomsWrapper({ children }: { children: ReactNode }) {
  const { user, token } = useContext(AuthContext);
  const [rooms, setRooms] = useState<RoomContext>(null);

  useEffect(() => {
    if (user) fetchRooms();
  }, [user]);

  async function fetchRooms() {
    const fetchedRooms = await axios.get(API_URL + '/api/rooms', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (fetchedRooms) setRooms(fetchedRooms.data);
  }

  return (
    <RoomsContext.Provider value={{ rooms }}>{children}</RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
