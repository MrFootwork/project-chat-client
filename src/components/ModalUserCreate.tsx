import { ResponseError } from '../types/error';

import React, { useContext } from 'react';
import axios from 'axios';

import { matchesField, useForm } from '@mantine/form';
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
};

const ModalSignUp: React.FC<ModalSignUpProps> = ({ onClose }) => {
  const { signup } = useContext(AuthContext);

  const formRegister = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },

    validate: {
      name: value => (value.length < 3 ? 'Name too short' : null),
      email: value => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: value => (value.length < 3 ? 'Password too short' : null),
      confirmPassword: matchesField('password', 'Passwords do not match.'),
    },
  });

  const handleRegister = async (values: typeof formRegister.values) => {
    const { name, email, password } = values;
    const requestBody = { name, email, password };
    formRegister.validate();

    try {
      await signup(requestBody);

      onClose();
      formRegister.reset();

      // FIXME Send confirmation mail
      notifications.show({
        title: 'Registration successful',
        message:
          'You successfully registered! Check your email for confirmation.',
        color: 'green',
      });
    } catch (error) {
      console.error('Error during registration:', error);

      if (axios.isAxiosError(error)) {
        notifications.show({
          title: 'Registration failed',
          message: 'The server is down. Please try again later.',
          color: 'red',
        });

        return;
      }

      notifications.show({
        title: 'Regsitration failed',
        message: (error as any).message,
        color: 'red',
      });

      if (
        (error as ResponseError).code === '409' &&
        (error as ResponseError).details?.target.includes('email')
      ) {
        formRegister.setFieldError('email', 'Email taken. Try again.');
      }

      if (
        (error as ResponseError).code === '409' &&
        (error as ResponseError).details?.target.includes('name')
      ) {
        formRegister.setFieldError('name', 'Name taken. Try again.');
      }
    }
  };

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={`Register for an Account`}
      yOffset='10rem'
      className='modal-register'
    >
      <form onSubmit={formRegister.onSubmit(handleRegister)}>
        <Stack mb='lg'>
          <TextInput
            withAsterisk
            data-autofocus
            label='Username'
            description='This will be your display name'
            placeholder='Your Username'
            key={formRegister.key('name')}
            {...formRegister.getInputProps('name')}
            className={`${
              formRegister.getInputProps('name').error ? 'error' : ''
            }`}
          />

          <TextInput
            withAsterisk
            label='Email'
            placeholder='your@email.com'
            key={formRegister.key('email')}
            {...formRegister.getInputProps('email')}
            className={`${
              formRegister.getInputProps('email').error ? 'error' : ''
            }`}
          />

          <PasswordInput
            withAsterisk
            label='Password'
            placeholder='Your Password'
            key={formRegister.key('password')}
            {...formRegister.getInputProps('password')}
            className={`${
              formRegister.getInputProps('password').error ? 'error' : ''
            }`}
          />

          <PasswordInput
            withAsterisk
            label='Confirm Password'
            placeholder='Your Password'
            key={formRegister.key('confirmPassword')}
            {...formRegister.getInputProps('confirmPassword')}
            className={`${
              formRegister.getInputProps('confirmPassword').error ? 'error' : ''
            }`}
          />
        </Stack>

        <div className='button-container'>
          <Group justify='flex-end' mt='sm'>
            <Button onClick={onClose} variant='outline'>
              Cancel
            </Button>
            <Button type='submit'>Register</Button>
          </Group>
        </div>
      </form>
    </Modal>
  );
};

export default ModalSignUp;
