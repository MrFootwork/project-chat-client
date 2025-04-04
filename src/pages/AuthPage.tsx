import './AuthPage.css';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useForm } from '@mantine/form';
import { Button, Group, PasswordInput, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/chat');
  }, [user]);

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
    if (!user) login(values);
  };

  // FIXME Add social login buttons
  // FIXME Login possible with email OR name
  // FIXME Registration screen
  return (
    <>
      <header className='auth-header'>
        <h1>Login to get started!</h1>
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
        </form>
      </div>
    </>
  );
};

export default AuthPage;
