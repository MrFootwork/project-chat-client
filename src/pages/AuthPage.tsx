import './AuthPage.css';

import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { useDisclosure } from '@mantine/hooks';

import { AuthContext } from '../contexts/AuthWrapper';

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
    if (!user) login(values);
  };

  /************
   * REGISTER
   ***********/
  const formRegister = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },

    validate: {
      email: value => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      confirmPassword: matchesField('password', 'Passwords are not the same'),
    },
  });

  const handleRegister = async (values: typeof formRegister.values) => {
    console.log('REGSITRATION: ', values);
    const { name, email, password } = values;
    const requestBody = { name, email, password };

    try {
      if (!user) await signup(requestBody);
    } catch (error) {
      // FIXME Handle the duplicate email error
      console.error('Error during registration:', error);
    }
  };

  // FIXME Add social login buttons

  const [
    wantToRegister,
    { open: openModalRegister, close: closeModalRegister },
  ] = useDisclosure(false);

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
          />

          <PasswordInput
            label='Password'
            placeholder='Input placeholder'
            key={formLogin.key('password')}
            {...formLogin.getInputProps('password')}
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
                label='Username'
                description='This will be your display name'
                placeholder='Your Username'
                key={formRegister.key('name')}
                {...formRegister.getInputProps('name')}
              />

              <TextInput
                withAsterisk
                label='Email'
                placeholder='your@email.com'
                key={formRegister.key('email')}
                {...formRegister.getInputProps('email')}
              />

              <PasswordInput
                withAsterisk
                label='Password'
                placeholder='Input placeholder'
                key={formRegister.key('password')}
                {...formRegister.getInputProps('password')}
              />

              <PasswordInput
                withAsterisk
                label='Repeat Password'
                placeholder='Input placeholder'
                key={formRegister.key('confirmPassword')}
                {...formRegister.getInputProps('confirmPassword')}
              />
            </Stack>

            <div className='button-container'>
              <Group justify='flex-end' mt='sm'>
                <Button onClick={closeModalRegister} variant='light'>
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
