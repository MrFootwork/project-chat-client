import './AuthPage.css';

import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { matchesField, useForm } from '@mantine/form';
import {
  Anchor,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

import { AuthContext } from '../contexts/AuthWrapper';
import { ResponseError } from '../types/error';

const AuthPage = () => {
  const { user, login, signup } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/chat');
  }, [user]);

  /*********
   * LOGIN
   ********/
  const formLogin = useForm({
    mode: 'uncontrolled',
    initialValues: {
      credential: '',
      password: '',
    },
  });

  const handleLogin = async (values: typeof formLogin.values) => {
    try {
      await login(values);

      notifications.show({
        title: 'Login successful',
        message: 'You successfully logged in! 🎉',
      });
    } catch (error: unknown) {
      console.error('Error during login:', error);

      if (axios.isAxiosError(error)) {
        notifications.show({
          title: 'Login failed',
          message: 'The server is down. Please try again later.',
          color: 'red',
        });

        return;
      }

      if (
        (error as ResponseError).code === '401' &&
        (error as ResponseError).details?.error === 'wrong_credentials'
      ) {
        formLogin.setFieldError('credential', (error as ResponseError).message);
        formLogin.setFieldError('password', (error as ResponseError).message);
      }

      notifications.show({
        title: 'Login failed',
        message: (error as any).message,
        color: 'red',
      });
    }
  };

  useEffect(() => {
    if (Object.keys(formLogin.errors).length === 0) return;

    console.log(
      '❌ ERRORS detected',
      formLogin.errors,
      formLogin.getInputProps('credential').error
    );
    formLogin.getInputProps('credential').error;
  }, [formLogin.errors]);

  /************
   * REGISTER
   ***********/
  const [
    wantToRegister,
    { open: openModalRegister, close: closeModalRegister },
  ] = useDisclosure(false);

  // Clear form when modal is closed
  useEffect(() => {
    if (!wantToRegister) formRegister.reset();
  }, [wantToRegister]);

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

      closeModalRegister();
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

  // FIXME Add social login buttons

  return (
    <>
      <header className='auth-header'>
        <h1>Login to get started!</h1>
      </header>

      <div className='form-container'>
        <form onSubmit={formLogin.onSubmit(handleLogin)}>
          <TextInput
            label='Name or Email'
            placeholder='your@email.com'
            key={formLogin.key('credential')}
            {...formLogin.getInputProps('credential')}
            className={`${
              formLogin.getInputProps('credential').error ? 'error' : ''
            }`}
          />

          <PasswordInput
            label='Password'
            placeholder='Input placeholder'
            key={formLogin.key('password')}
            {...formLogin.getInputProps('password')}
            className={`${
              formLogin.getInputProps('password').error ? 'error' : ''
            }`}
          />

          <p>
            Don't have an account, yet? Please{' '}
            <Anchor onClick={openModalRegister}>register</Anchor>.
          </p>

          <Group justify='flex-end' mt='sm'>
            <Button type='submit'>Login</Button>
          </Group>
        </form>
      </div>

      {wantToRegister ? (
        <Modal
          opened={wantToRegister}
          onClose={closeModalRegister}
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
                  formRegister.getInputProps('confirmPassword').error
                    ? 'error'
                    : ''
                }`}
              />
            </Stack>

            <div className='button-container'>
              <Group justify='flex-end' mt='sm'>
                <Button onClick={closeModalRegister} variant='outline'>
                  Cancel
                </Button>
                <Button type='submit'>Register</Button>
              </Group>
            </div>
          </form>
        </Modal>
      ) : (
        ''
      )}
    </>
  );
};

export default AuthPage;
