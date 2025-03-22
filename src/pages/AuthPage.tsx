import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useForm } from '@mantine/form';
import axios from 'axios';
import config from '../../config';
import { Button, Group, PasswordInput, TextInput } from '@mantine/core';

type Props = {};
const API_URL = config.API_URL;

const AuthPage = (props: Props) => {
  const { user, setUser, token, setToken } = useContext(AuthContext);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },

    validate: {
      email: value => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    // console.log(values);
    const { data } = await axios.post(API_URL + '/auth/login', {
      email: values.email,
      password: values.password,
    });
    // console.log(data);
    setToken(data.jwt);
    window.localStorage.setItem('chatToken', data.jwt);
    const response = await axios.get(API_URL + '/api/users/me', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${data.jwt}`,
      },
    });
    console.log('User Client data: ', response.data);
    setUser(response.data);
    // FIXME Connect to socket
  };

  return (
    <>
      <header>
        <h1>AuthPage</h1>
      </header>
      <div className='form-container'>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            withAsterisk
            label='Email'
            placeholder='your@email.com'
            key={form.key('email')}
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label='Password'
            placeholder='Input placeholder'
            key={form.key('password')}
            {...form.getInputProps('password')}
          />

          <Group justify='flex-end' mt='md'>
            <Button type='submit'>Login</Button>
          </Group>

          <div>
            <h3>Login Status</h3>
            {user ? (
              <p>Logged in as: {user.name || user.email}</p>
            ) : (
              <p>Not logged in</p>
            )}
          </div>
        </form>
      </div>
    </>
  );
};

export default AuthPage;
