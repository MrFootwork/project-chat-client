import React, { useContext } from 'react';
import axios from 'axios';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import { RoomsContext } from '../contexts/RoomsWrapper';
import { ThemeContext } from '../contexts/ThemeWrapper';

type ModalProfileEditProps = {
  onClose: () => void;
  fullscreen: boolean;
};

const ModalProfileEdit: React.FC<ModalProfileEditProps> = props => {
  const { createRoom, selectRoom } = useContext(RoomsContext);
  const { toggleButtonContainer } = useContext(ThemeContext);

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
      props.onClose();
      formRoomCreation.reset();
    }
  }

  return (
    <Modal
      opened={true}
      onClose={props.onClose}
      title={`Create new room`}
      yOffset='10rem'
      className='modal-delete-room'
      fullScreen={props.fullscreen}
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
          <Button variant='outline' onClick={props.onClose}>
            Cancel
          </Button>
          <Button type='submit'>Create</Button>
        </Group>
      </form>
    </Modal>
  );
};

export default ModalProfileEdit;
