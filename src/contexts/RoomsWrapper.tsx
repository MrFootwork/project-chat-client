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
  isLoading: false,
  createRoom: async (roomName: string) => {
    throw new Error('createNewRoom is not implemented in defaultStore');
  },
  deleteRoom: async (roomID: string | undefined) => {},
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
  fetchNextPage: async (
    page: number,
    {
      scrollHeight,
      scrollTop,
      display,
    }: {
      scrollHeight: React.RefObject<number>;
      scrollTop: React.RefObject<number>;
      display: React.RefObject<HTMLDivElement | null>;
    }
  ) => {
    throw new Error('selectRoom is not implemented in defaultStore');
  },
  hasMore: false,
  selectedRoomID: null,
  currentRoom: null,
  pushMessage: async (message: Message) => {},
  pushMessageChunks: (
    roomID: string | null,
    messageID: string,
    chunk: string
  ) => {},
  updateMessage: (message: Message) => {},
  setMessageAsRead: async (message: Message) => {},
};

type RoomsContextType = {
  rooms: Room[] | null;
  isLoading: boolean;
  createRoom: (roomName: string) => Promise<Room | undefined>;
  deleteRoom: (roomID: string | undefined) => void;
  fetchRooms: () => Promise<Room[]>;
  addRoom: (room: Room) => void;
  updateRoomMemberStatus: (
    roomID: string,
    IDsToRemove: { id: string; userLeft: boolean }[]
  ) => void;
  createOrUpdateMembers: (addedMembers: RoomMember[], room: Room) => void;
  selectRoom: (roomID: string) => Promise<Room | undefined>;
  fetchNextPage: (
    page: number,
    {
      scrollHeight,
      scrollTop,
      display,
    }: {
      scrollHeight: React.RefObject<number>;
      scrollTop: React.RefObject<number>;
      display: React.RefObject<HTMLDivElement | null>;
    }
  ) => Promise<void>;
  hasMore: boolean;
  selectedRoomID: string | null;
  currentRoom: Room | null;
  pushMessage: (message: Message) => Promise<void>;
  pushMessageChunks: (
    roomID: string | null,
    messageID: string,
    chunk: string
  ) => void;
  updateMessage: (message: Message) => void;
  setMessageAsRead: (message: Message) => Promise<void>;
};

const RoomsContext = React.createContext<RoomsContextType>(defaultStore);

function RoomsWrapper({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<RoomsContextType>(defaultStore);
  const { logout, user, token } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Reset to default, if user logs out
  useEffect(() => {
    // HACK Guard against: navigate() in ChatPage would trigger a logout...
    // Don't reset the store, if user is still logged in
    if (user && token) return;

    setStore(s => ({
      ...s,
      rooms: null,
      selectedRoomID: null,
      currentRoom: null,
    }));
  }, [logout]);

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

  function deleteRoom(roomID: string | undefined) {
    if (!roomID) {
      console.warn(`Provide a valid room ID: ${roomID} cannot be deleted.`);
      return;
    }

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
        rooms: [...updatedRooms],
        selectedRoomID: mewSelectedRoomID,
        currentRoom: { ...(newCurrentRoom || s.currentRoom || ({} as Room)) },
      };
    });
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
    setIsLoading(true);

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

      setHasMore(true);

      return updatedRoom;
    } catch (error) {
      setHasMore(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Fetches the next page of messages for the currently selected room.
   *
   * @param page - The page number to fetch.
   * @returns A promise that resolves to `true` if there is more data to fetch, or `false` if there is no more data.
   */
  async function fetchNextPage(
    page: number,
    {
      scrollHeight,
      scrollTop,
      display,
    }: {
      scrollHeight: React.RefObject<number>;
      scrollTop: React.RefObject<number>;
      display: React.RefObject<HTMLDivElement | null>;
    }
  ) {
    if (!hasMore) return;

    const roomID = store.selectedRoomID;
    const localToken = localStorage.getItem('chatToken');

    try {
      const { data: updatedRoom } = await axios.get<Room>(
        `${API_URL}/api/rooms/${roomID}?page=${page}`,
        {
          headers: { Authorization: `Bearer ${localToken}` },
        }
      );

      const updatedMessages = updatedRoom.messages;

      // Store scroll position
      scrollHeight.current = display.current?.scrollHeight || 0;
      scrollTop.current = display.current?.scrollTop || 0;

      // Next page is empty
      if (!updatedMessages.length) {
        setHasMore(false);
        return;
      }

      setIsLoading(true);

      setStore(s => {
        if (!s.rooms) return s;

        const mergedMessages = [...updatedMessages, ...s.currentRoom!.messages];

        const deduplicatedMessages = [
          ...new Map(mergedMessages.map(msg => [msg.id, msg])).values(),
        ];

        const updatedCurrentRoom = {
          ...s.currentRoom!,
          messages: deduplicatedMessages,
        };

        const updatedRooms = s.rooms.map(room => {
          if (room.id !== updatedRoom.id) return room;
          return { ...room, messages: deduplicatedMessages };
        });

        if (!updatedRooms) return s;

        return {
          ...s,
          rooms: updatedRooms,
          currentRoom: updatedCurrentRoom,
        };
      });
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  // Update message in store
  function updateMessage(message: Message) {
    setStore(s => {
      if (!s.rooms || !user) return s;

      const messageInCurrentRoom = s.selectedRoomID === message.roomId;
      let updatedRoom = {} as Room;

      const updatedRooms = s.rooms.map(room => {
        if (room.id !== message.roomId) return room;

        const updatedMessages = room.messages.map(m => {
          if (m.id !== message.id) return m;

          return {
            ...m,
            deleted: message.deleted,
            content: message.content,
            edited: message.edited,
            updatedAt: message.updatedAt,
          };
        });

        if (messageInCurrentRoom)
          updatedRoom = { ...room, messages: [...updatedMessages] };

        return { ...room, messages: updatedMessages };
      });

      if (messageInCurrentRoom) {
        return { ...s, rooms: updatedRooms, currentRoom: updatedRoom };
      } else {
        return { ...s, rooms: updatedRooms };
      }
    });
  }

  async function setMessageAsRead(message: Message) {
    // Virtual update of the store
    setStore(s => {
      if (!s.rooms || !user) return s;

      const messageInCurrentRoom = s.selectedRoomID === message.roomId;
      let updatedRoom = {} as Room;

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

        if (messageInCurrentRoom)
          updatedRoom = { ...room, messages: [...updatedMessages] };

        return { ...room, messages: updatedMessages };
      });

      if (messageInCurrentRoom) {
        return { ...s, rooms: updatedRooms, currentRoom: updatedRoom };
      } else {
        return { ...s, rooms: updatedRooms };
      }
    });

    // Persisting message read status
    try {
      const oldStoreMessageIsRead = store.rooms
        ?.find(r => r.id === message.roomId)
        ?.messages.find(m => m.id === message.id)
        ?.readers.some(r => r.id === user?.id);

      if (!oldStoreMessageIsRead)
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
        isLoading,
        createRoom,
        deleteRoom,
        fetchRooms,
        addRoom,
        updateRoomMemberStatus,
        createOrUpdateMembers,
        selectRoom,
        fetchNextPage,
        hasMore,
        pushMessage,
        pushMessageChunks,
        updateMessage,
        setMessageAsRead,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export { RoomsWrapper, RoomsContext };
