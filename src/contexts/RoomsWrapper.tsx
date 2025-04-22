import axios from 'axios';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import config from '../../config';

import { AuthContext } from './AuthWrapper';

import { MessageAuthor, RoomMember } from '../types/user';
import { Room } from '../types/room';
import { Message } from '../types/message';

const { API_URL } = config;

const defaultStore = {
  rooms: null,
  createRoom: async (roomName: string) => {
    throw new Error('createNewRoom is not implemented in defaultStore');
  },
  deleteRoom: async (roomID: string) => {},
  fetchRooms: async () => [],
  addRoom: (room: Room) => {},
  updateRoomMemberStatus: (
    roomID: string,
    IDsToRemove: { id: string; userLeft: boolean }[]
  ) => {},
  createOrUpdateMembers: (addedMembers: RoomMember[], room: Room) => {},
  selectRoom: async (roomID: string) => {
    throw new Error('selectRoom is not implemented in defaultStore');
  },
  selectedRoomID: null,
  currentRoom: null,
  pushMessage: async (message: Message) => {},
  pushMessageChunks: (
    roomID: string | null,
    messageID: string,
    chunk: string
  ) => {},
  setMessageAsRead: async (message: Message) => {},
};

type RoomsContextType = {
  rooms: Room[] | null;
  createRoom: (roomName: string) => Promise<Room | undefined>;
  deleteRoom: (roomID: string) => Promise<void>;
  fetchRooms: () => Promise<Room[]>;
  addRoom: (room: Room) => void;
  updateRoomMemberStatus: (
    roomID: string,
    IDsToRemove: { id: string; userLeft: boolean }[]
  ) => void;
  createOrUpdateMembers: (addedMembers: RoomMember[], room: Room) => void;
  selectRoom: (roomID: string) => Promise<Room | undefined>;
  selectedRoomID: string | null;
  currentRoom: Room | null;
  pushMessage: (message: Message) => Promise<void>;
  pushMessageChunks: (
    roomID: string | null,
    messageID: string,
    chunk: string
  ) => void;
  setMessageAsRead: (message: Message) => Promise<void>;
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
  // useEffect(() => {
  //   // BUG This runs twice on each selection change
  //   // Check if this effect can be deleted
  //   setStore(prevStore => {
  //     console.log('selectedRoomID changed: ', prevStore.selectedRoomID);

  //     const selectedRoom = prevStore.rooms?.find(
  //       r => r.id === prevStore.selectedRoomID
  //     );

  //     if (!selectedRoom) return prevStore;

  //     return { ...prevStore, currentRoom: selectedRoom };
  //   });
  // }, [store.selectedRoomID]);

  async function createRoom(roomName: string) {
    try {
      const { data: newRoom } = await axios.post<Room>(
        `${API_URL}/api/rooms`,
        { name: roomName },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
          },
        }
      );

      setStore(s => {
        const updatedRooms = [...(s.rooms || []), newRoom];
        const sortedRooms = sortRooms(updatedRooms);

        return { ...s, rooms: sortedRooms };
      });

      return newRoom;
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

      sortRooms(data);
      setStore(s => ({ ...s, rooms: data, selectedRoomID: data[0]?.id }));

      return data;
    } catch (err) {
      console.error('Error fetching rooms: ', err);
      return [];
    }
  }

  function addRoom(room: Room) {
    setStore(s => {
      let updatedRooms: Room[];

      if (s.rooms?.some(r => r.id === room.id)) {
        updatedRooms = s.rooms.map(r => {
          if (r.id === room.id) return { ...r, members: [...room.members] };
          return r;
        });
      } else {
        updatedRooms = [...(s.rooms || []), room];
      }

      const sortedRooms = sortRooms(updatedRooms);

      // Also update currentRoom for host
      if (s.selectedRoomID === room.id) {
        return {
          ...s,
          rooms: sortedRooms,
          currentRoom: { ...room, members: [...room.members] },
        };
      }

      // Only add room to store because the invitee should not enter new room automatically
      return { ...s, rooms: sortedRooms };
    });
  }

  function createOrUpdateMembers(addedMembers: RoomMember[], room: Room) {
    setStore(prevStore => {
      if (!prevStore.rooms || !prevStore.currentRoom) return prevStore;

      const targetRoom = prevStore.rooms.find(r => r.id === room.id) || room;

      const updatedMembers = targetRoom.members.map(m => {
        const replacingMember = addedMembers.find(am => am.id === m.id);
        if (!!replacingMember)
          return { ...m, userLeft: replacingMember.userLeft };
        return m;
      });

      const firstTimeMembers = addedMembers.filter(
        ftm => !targetRoom.members.map(m => m.id).includes(ftm.id)
      );

      const updatedRoom = {
        ...targetRoom,
        members: [...updatedMembers, ...firstTimeMembers],
      };

      let updatedRooms = prevStore.rooms.map(r => {
        if (r.id === room.id) return updatedRoom;
        return r;
      });

      if (!prevStore.rooms.some(r => r.id === room.id)) {
        updatedRooms = [...updatedRooms, room];
      }

      const sortedRooms = sortRooms(updatedRooms);

      if (room.id === prevStore.selectedRoomID) {
        return {
          ...prevStore,
          rooms: sortedRooms,
          currentRoom: updatedRoom,
        };
      } else {
        return {
          ...prevStore,
          rooms: sortedRooms,
        };
      }
    });
  }

  function updateRoomMemberStatus(
    roomID: string,
    IDsToRemove: { id: string; userLeft: boolean }[]
  ) {
    setStore(prevStore => {
      if (!prevStore.rooms) return prevStore;

      const updatedRooms = prevStore.rooms.map(room => {
        if (room.id !== roomID) return room;

        // Create a new reference for the members array
        const updatedMembers = room.members.map(member => {
          const updatedMember = {
            ...member,
            userLeft:
              IDsToRemove.find(item => item.id === member.id)?.userLeft ||
              member.userLeft,
          };

          const memberIsRemoved = IDsToRemove.map(item => item.id).includes(
            member.id
          );

          return memberIsRemoved ? updatedMember : member;
        });

        return { ...room, members: updatedMembers };
      });

      // Only update current room, if that was changed
      const updatedCurrentRoom =
        prevStore.currentRoom?.id === roomID
          ? updatedRooms.find(room => room.id === roomID)
          : prevStore.currentRoom;

      return {
        ...prevStore,
        rooms: updatedRooms,
        currentRoom: updatedCurrentRoom || null,
      };
    });
  }

  /**
   * Fetches the details of a selected room by its ID and updates the store.
   *
   * @param roomID - The ID of the room to fetch.
   * @returns Resolves when the room is successfully fetched and the store is updated.
   */
  async function selectRoom(roomID: string) {
    console.log('selectRoom called with roomID:', roomID);

    const localToken = localStorage.getItem('chatToken');

    try {
      await axios.put(`${API_URL}/api/rooms/${roomID}/read`, null, {
        headers: { Authorization: `Bearer ${localToken}` },
      });

      const { data: updatedRoom } = await axios.get<Room>(
        `${API_URL}/api/rooms/${roomID}`,
        {
          headers: { Authorization: `Bearer ${localToken}` },
        }
      );

      setStore(s => {
        if (!s.rooms) return s;

        const updatedRooms = s.rooms.map(room => {
          if (room.id === updatedRoom.id) return updatedRoom;
          return room;
        });

        if (!updatedRooms) return s;

        return {
          ...s,
          rooms: updatedRooms,
          selectedRoomID: roomID,
          currentRoom: updatedRoom,
        };
      });

      return updatedRoom;
    } catch (err) {
      throw err;
    }
  }

  async function setMessageAsRead(message: Message) {
    // Virtual update of the store
    setStore(s => {
      if (!s.rooms || !user) return s;

      const updatedRooms = s.rooms.map(room => {
        if (room.id !== message.roomId) return room;

        const updatedMessages = room.messages.map(m => {
          if (m.id !== message.id) return m;

          const userAsReader: MessageAuthor = {
            id: user.id,
            name: user.name,
            isDeleted: user.isDeleted,
            avatarUrl: user.avatarUrl,
          };

          return { ...m, readers: [...m.readers, userAsReader] };
        });

        return { ...room, messages: updatedMessages };
      });

      return { ...s, rooms: updatedRooms };
    });

    // Persisting message read status
    try {
      await axios.put(`${API_URL}/api/messages/${message.id}/read`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  /** Push a new message to the correct room */
  async function pushMessage(message: Message) {
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
          ? sortedRooms.find(r => r.id === message.roomId) || null
          : prevStore.currentRoom,
      };
    });
  }

  function pushMessageChunks(
    roomID: string | null,
    messageID: string,
    chunk: string
  ) {
    if (!roomID) return;

    setStore(prevStore => {
      const updatedMessages = prevStore
        .rooms!.find(r => r.id === roomID)!
        .messages.map(m => {
          if (m.id === messageID) return { ...m, content: m.content + chunk };
          return m;
        });

      const updatedRooms = prevStore.rooms!.map(r => {
        if (r.id === roomID) return { ...r, messages: updatedMessages };
        return r;
      });

      if (prevStore.selectedRoomID === roomID) {
        const updatedCurrentRoom = updatedRooms.find(r => r.id === roomID)!;

        return {
          ...prevStore,
          rooms: updatedRooms,
          currentRoom: updatedCurrentRoom,
        };
      } else {
        return { ...prevStore, rooms: updatedRooms };
      }
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
        // That said, messages sent by other users don't affect the order
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
        addRoom,
        updateRoomMemberStatus,
        createOrUpdateMembers,
        selectRoom,
        pushMessage,
        pushMessageChunks,
        setMessageAsRead,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
