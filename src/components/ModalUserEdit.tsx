import { ResponseError } from '../types/error';

import React, { useContext } from 'react';
import axios from 'axios';

import { useForm } from '@mantine/form';
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { AuthContext } from '../contexts/AuthWrapper';

type ModalSignUpProps = {
  onClose: () => void;
  fullscreen: boolean;
};

const ModalUserCreate: React.FC<ModalSignUpProps> = props => {
  const { updateUser, user, validatePassword } = useContext(AuthContext);

  if (!user) return;

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      newPassword: '',
      oldPassword: '',
    },

    validate: {
      name: (value: string) => (value.length < 3 ? 'Name too short' : null),
      email: value => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      avatarUrl: value => {
        if (!value) return null;
        return /^(https?:\/\/)[\w.-]+(\.[\w.-]+)+[\/#?]?.*$/.test(value)
          ? null
          : 'Invalid URL';
      },
      newPassword: (value: string) => {
        if (!value.length) return null;
        return value.length < 3 ? 'Password too short' : null;
      },
    },
  });

  const handleUpdate = async (values: typeof form.values) => {
    const { name, email, avatarUrl, newPassword, oldPassword } = values;
    const requestBody = {
      name,
      email,
      avatarUrl,
      password: newPassword,
    };
    form.validate();

    try {
      const confirmed = await validatePassword(oldPassword);

      if (!confirmed) {
        form.setFieldError('oldPassword', 'Incorrect current password');
        return;
      }

      const updatedUser = await updateUser(requestBody);
      console.log(`🚀 ~ handleUpdate ~ updatedUser:`, updatedUser);

      // FIXME refresh token & user

      props.onClose();
      form.reset();

      // FIXME Send confirmation mail
      notifications.show({
        title: 'User update successful',
        message: 'You successfully updated your profile!',
        color: 'green',
      });
    } catch (error) {
      console.error('Error during update:', error);

      if (axios.isAxiosError(error)) {
        notifications.show({
          title: 'User update failed',
          message: 'The server is down. Please try again later.',
          color: 'red',
        });

        return;
      }

      notifications.show({
        title: 'Profile update failed',
        message: (error as any).message,
        color: 'red',
      });

      if (
        (error as ResponseError).code === '409' &&
        (error as ResponseError).details?.target.includes('email')
      ) {
        form.setFieldError('email', 'Email taken. Try again.');
      }

      if (
        (error as ResponseError).code === '409' &&
        (error as ResponseError).details?.target.includes('name')
      ) {
        form.setFieldError('name', 'Name taken. Try again.');
      }
    }
  };

  return (
    <Modal
      opened={true}
      onClose={props.onClose}
      title={`Change Profile Data`}
      yOffset='10rem'
      className='modal-register'
      fullScreen={props.fullscreen}
    >
      <form onSubmit={form.onSubmit(handleUpdate)}>
        <Stack mb='lg'>
          <TextInput
            data-autofocus
            label='Username'
            description='This will be your display name'
            placeholder='Your Username'
            key={form.key('name')}
            {...form.getInputProps('name')}
            className={`${form.getInputProps('name').error ? 'error' : ''}`}
          />

          <TextInput
            label='Email'
            placeholder='your@email.com'
            key={form.key('email')}
            {...form.getInputProps('email')}
            className={`${form.getInputProps('email').error ? 'error' : ''}`}
          />

          <TextInput
            label='Avatar'
            placeholder='Avatar URL'
            key={form.key('avatarUrl')}
            {...form.getInputProps('avatarUrl')}
            className={`${
              form.getInputProps('avatarUrl').error ? 'error' : ''
            }`}
          />

          <PasswordInput
            label='Password'
            placeholder='Your Password'
            description="Leave this empty, if you don't intend to change your password."
            key={form.key('newPassword')}
            {...form.getInputProps('newPassword')}
            className={`${
              form.getInputProps('newPassword').error ? 'error' : ''
            }`}
          />

          <PasswordInput
            withAsterisk
            label='Confirm with current Password'
            placeholder='Your current Password'
            key={form.key('oldPassword')}
            {...form.getInputProps('oldPassword')}
            className={`${
              form.getInputProps('oldPassword').error ? 'error' : ''
            }`}
          />
        </Stack>

        <div className='button-container'>
          <Group justify='flex-end' mt='sm'>
            <Button onClick={props.onClose} variant='outline'>
              Cancel
            </Button>
            <Button type='submit'>Save</Button>
          </Group>
        </div>
      </form>
    </Modal>
  );
};

export default ModalUserCreate;
