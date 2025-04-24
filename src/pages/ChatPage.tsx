import './ChatPage.css';
import { Room } from '../types/room';

import { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { ThemeContext } from '../contexts/ThemeWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconCopyPlus } from '@tabler/icons-react';
import {
  Button,
  Group,
  Indicator,
  Modal,
  Stack,
  TextInput,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';

import Messenger from '../components/Messenger';

const ChatPage = () => {
  const navigate = useNavigate();
  const theme = useMantineTheme();

  /**********
   * AUTH
   **********/
  const { user, token, validateToken } = useContext(AuthContext);

  useEffect(() => {
    if (user && token) return;
    validateToken();
    if (!user) navigate('/');
  }, []);

  /**********
   * ROOMS
   **********/
  const {
    rooms,
    createRoom,
    deleteRoom,
    fetchRooms,
    selectRoom,
    selectedRoomID,
  } = useContext(RoomsContext);

  // Initial page load
  useEffect(() => {
    console.log('Loading from ChatPage...');
    fetchRooms();
    // HACK Need to refetch after adding friends because adding friends cuase to loose rooms state
  }, [user]);

  const firstRoomFetchedInitially = useRef(false);

  // After initial load, fetch the first room messages & set messages to being read
  // Needs this effect to access the rooms from before
  useEffect(() => {
    if (rooms?.length && !firstRoomFetchedInitially.current) {
      console.log('Fetch selected room on ChatPage...', rooms?.length);
      selectRoom(rooms[0]?.id || '');
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
      await selectRoom(roomID);

      if (showButtonContainer) {
        setTimeout(() => {
          toggleButtonContainer();
        }, 500);
      }
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

  // Create new room
  const [wantToCreateRoom, { open: openRoomCreate, close: closeRoomCreate }] =
    useDisclosure(false);

  useEffect(() => {
    if (!wantToCreateRoom) formRoomCreation.reset();
  }, [wantToCreateRoom]);

  const formRoomCreation = useForm({
    mode: 'uncontrolled',
    initialValues: { name: '' },
    validate: {
      name: value => (value.length < 3 ? 'Name too short' : null),
    },
  });

  async function handleRoomCreation(values: typeof formRoomCreation.values) {
    try {
      const newRoom = await createRoom(values.name);
      console.log(`🚀 ~ handleRoomCreation ~ newRoom:`, newRoom);

      notifications.show({
        title: 'Room creation',
        message: 'Room created!',
      });

      if (newRoom) {
        selectRoom(newRoom.id);
        toggleButtonContainer();
      }
    } catch (error: unknown) {
      console.error('Error during room creation:', error);

      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }

      notifications.show({
        title: 'Room creation failed',
        message: (error as any).message,
        color: 'red',
      });
    } finally {
      closeRoomCreate();
      formRoomCreation.reset();
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

        {/* TODO Make all icon-buttons a component */}
        <div
          className='button-create-room icon-button'
          onClick={openRoomCreate}
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
              onChange={
                isMobile ? () => handleRoomSelection(room.id) : () => {}
              }
              onClick={isMobile ? () => {} : () => handleRoomSelection(room.id)}
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

      <Modal
        opened={wantToCreateRoom}
        onClose={closeRoomCreate}
        title={`Create new room`}
        yOffset='10rem'
        className='modal-delete-room'
      >
        <form onSubmit={formRoomCreation.onSubmit(handleRoomCreation)}>
          <Stack mb='lg'>
            <TextInput
              withAsterisk
              label='Room name'
              placeholder='Choose a nice name for your room'
              data-autofocus
              key={formRoomCreation.key('name')}
              {...formRoomCreation.getInputProps('name')}
              className={`${
                formRoomCreation.getInputProps('name').error ? 'error' : ''
              }`}
            />
          </Stack>

          <Group justify='flex-end' mt='sm'>
            <Button variant='outline' onClick={closeRoomCreate}>
              Cancel
            </Button>
            <Button type='submit'>Create</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};

export default ChatPage;
