import './ChatPage.css';
import { Room } from '../types/room';

import { useContext, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import { ThemeContext } from '../contexts/ThemeWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconCopyPlus } from '@tabler/icons-react';
import { Indicator, useMantineTheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import Messenger from '../components/Messenger';
import { useModal } from '../contexts/ModalContext';

const ChatPage = () => {
  const theme = useMantineTheme();
  const { openModal } = useModal();
  const navigate = useNavigate();

  /**********
   * AUTH
   **********/
  const { user } = useContext(AuthContext);

  /**********
   * ROOMS
   **********/
  const { roomID } = useParams();

  const { rooms, deleteRoom, fetchRooms, selectRoom, selectedRoomID } =
    useContext(RoomsContext);

  // Initial page load with logged in user
  useEffect(() => {
    console.log('Loading from ChatPage...');
    if (user) fetchRooms();
    // HACK Need to refetch after adding friends because adding friends causes to lose rooms state
  }, [user]);

  const firstRoomFetchedInitially = useRef(false);

  // After initial load, fetch the first room messages & set messages to being read
  // Needs this effect to access the rooms from before
  useEffect(() => {
    if (rooms?.length && !firstRoomFetchedInitially.current) {
      console.log('Fetch selected room on ChatPage...', rooms?.length);

      const firstRoomID = rooms[0]?.id || '';
      const RoomIDFromURL = roomID || '';

      selectRoom(RoomIDFromURL).catch(error => {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 404) {
            console.error(error);

            notifications.show({
              title: `Room doesn't exist`,
              message: `Room ${RoomIDFromURL} doesn't exist.`,
              color: 'red',
            });

            selectRoom(firstRoomID);
          } else {
            console.warn('Axios error occurred:', error.message);
          }
        }
      });

      navigate(`/chat/${RoomIDFromURL}`, { replace: true });

      // Only run once after initial load
      // Otherwise, it would also run, when new rooms are added
      firstRoomFetchedInitially.current = true;
    }
  }, [rooms && rooms.length]);

  // Fetch selected room messages
  const { isMobile, showButtonContainer, toggleButtonContainer } =
    useContext(ThemeContext);

  async function handleRoomSelection(roomID: string) {
    try {
      if (showButtonContainer) toggleButtonContainer();

      // BUG Navigating back should also load the current roomID
      await selectRoom(roomID);
      navigate(`/chat/${roomID}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.warn('Axios error details:', error.response?.data);

        if (error.response?.status === 404) {
          // Host deleted the room
          // => remove it from store
          deleteRoom(roomID);
        }
        return;
      }

      console.error('Unkown error during room Selection:', error);

      notifications.show({
        title: 'Room selection failed',
        message: (error as any).message,
        color: 'red',
      });
    }
  }

  /**********
   * MESSAGES
   **********/
  function roomHasUnreadMessages(room: Room) {
    if (!room.messages) return false;

    return room.messages.some(message => {
      const onReadersList = message.readers.some(readers => {
        return readers.id === user?.id;
      });

      return !onReadersList;
    });
  }

  function countUnreadMessages(room: Room) {
    if (!room.messages) return null;

    return room.messages.reduce((count, message) => {
      return count + +!message.readers.some(r => r.id === user?.id) || 0;
    }, 0);
  }

  /**********
   * Header
   **********/
  const Header = () => {
    return (
      <header>
        <h1>Groups</h1>

        <div
          className='button-create-room icon-button'
          // onClick={openRoomCreate}
          onClick={() => openModal('createRoom')}
          title='Create new room'
        >
          <IconCopyPlus />
        </div>
      </header>
    );
  };

  /****************
   * Room Buttons
   ***************/
  const RoomButtons = () => {
    if (!rooms) return '';

    return rooms?.map(room => {
      const hasUnreadMessage = roomHasUnreadMessages(room);
      const isSelectedRoom = room.id === selectedRoomID;
      const userInRoom = room?.members?.find(m => m.id === user?.id) || null; // Caused errors in new rooms
      const isKickedOut = !userInRoom || userInRoom.userLeft;

      return (
        <Indicator
          key={room.id}
          position='middle-end'
          label={countUnreadMessages(room)}
          offset={20}
          size={20}
          disabled={!hasUnreadMessage || isSelectedRoom}
        >
          <li>
            <input
              checked={isSelectedRoom}
              type='radio'
              name='room'
              id={`room-${room.id}`}
              onClick={() => handleRoomSelection(room.id)}
              readOnly // onChange introduces undesirable behavior => needs readonly if no onChange is provided
            />

            <label
              htmlFor={`room-${room.id}`}
              style={{
                color: `${isKickedOut ? theme.colors.gray[6] : 'inherit'}`,
              }}
            >
              {room.name}
            </label>
          </li>
        </Indicator>
      );
    });
  };

  return (
    <div className={`chat-page-container ${isMobile ? 'mobile' : ''}`}>
      {/*************
       * Desktop
       ************/}
      {!isMobile && (
        <>
          <nav className='rooms-container'>
            {Header()}

            <ol className='room-button-container'>{RoomButtons()}</ol>
          </nav>
          <section className='messenger-container'>
            <Messenger key={selectedRoomID} />
          </section>{' '}
        </>
      )}

      {/*************
       * Mobile
       ************/}
      {isMobile && (
        <>
          {/* FIXME Slide in and out animation */}
          {showButtonContainer ? (
            <nav className='rooms-container'>
              {Header()}

              <ol className='room-button-container'>{RoomButtons()}</ol>
            </nav>
          ) : (
            <section className='messenger-container'>
              <Messenger key={selectedRoomID} />
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ChatPage;
