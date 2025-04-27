import './AuthPage.css';
import { ResponseError } from '../types/error';

import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import { AuthContext } from '../contexts/AuthWrapper';
import { useModal } from '../contexts/ModalContext';

const AuthPage = () => {
  const { user, login } = useContext(AuthContext);
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

      // BUG Don't cover navbar => show at bottom?
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

  // FIXME Add social login buttons
  const { openModal } = useModal();

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
            <Anchor onClick={() => openModal('signup')}>register</Anchor>.
          </p>

          <Group justify='flex-end' mt='sm'>
            <Button type='submit'>Login</Button>
          </Group>
        </form>
      </div>
    </>
  );
};

export default AuthPage;
