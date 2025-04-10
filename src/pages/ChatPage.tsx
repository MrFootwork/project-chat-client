import './ChatPage.css';
import { Room } from '../types/room';

import { useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconCopyPlus } from '@tabler/icons-react';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';

import Messenger from '../components/Messenger';
import IndicatorUnread from '../components/IndicatorUnread';

const ChatPage = () => {
  const navigate = useNavigate();

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
  const { rooms, createRoom, fetchRooms, selectRoom, selectedRoomID } =
    useContext(RoomsContext);

  // Initial page load
  useEffect(() => {
    console.log('Loading from ChatPage...');
    fetchRooms();
  }, []);

  const firstRoomFetchedInitially = useRef(false);

  // After initial load, fetch the first room messages & set messages to being read
  // Needs this effect to access the rooms from before
  useEffect(() => {
    if (rooms?.length && !firstRoomFetchedInitially.current) {
      console.log('Fetch selected room from ChatPage...', rooms?.length);
      selectRoom(rooms[0]?.id || '');
      // Only run once after initial load
      // Otherwise, it would also run, when new rooms are added
      firstRoomFetchedInitially.current = true;
    }
  }, [rooms && rooms.length]);

  // Fetch selected room messages
  function handleRoomSelection(roomID: string) {
    selectRoom(roomID);
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

      if (newRoom) selectRoom(newRoom.id);
    } catch (error: unknown) {
      console.error('Error during login:', error);

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

  return (
    <div className='chat-page-container'>
      {/* FIXME make responsive */}
      <nav className='rooms-container'>
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

        <ol className='room-button-container'>
          {rooms?.map(room => {
            const hasUnreadMessage = roomHasUnreadMessages(room);
            const isSelectedRoom = room.id === selectedRoomID;

            return (
              <li key={room.id}>
                <input
                  checked={isSelectedRoom}
                  type='radio'
                  name='room'
                  id={`room-${room.id}`}
                  onChange={() => handleRoomSelection(room.id)}
                />
                <label htmlFor={`room-${room.id}`}>
                  {room.name}
                  <IndicatorUnread
                    visible={hasUnreadMessage && !isSelectedRoom}
                    position={{
                      top: '1rem',
                      right: '.5rem',
                    }}
                  />
                </label>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className='messenger-container'>
        <Messenger key={selectedRoomID} />
      </section>

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
