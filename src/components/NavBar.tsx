import './NavBar.css';
import config from '../../config';

import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconArrowLeft } from '@tabler/icons-react';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { currentRoom } = useContext(RoomsContext);

  const navigate = useNavigate();
  const location = useLocation();

  // Auth Handling
  const isOnAuthPage = location.pathname.includes('/auth');

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
  }

  // Theme Handling
  const { toggleColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme();

  return (
    <nav className='navbar-container'>
      <h1>Messenger</h1>
      <p className='navbar-text'>
        Env: {config.API_URL} <br />
        User: "{user?.name}" {user?.id} <br />
        Socket: {socket?.id} <br />
        Room: {currentRoom?.id}
      </p>

      {/* <Button onClick={toggleColorScheme}>
        {computedColorScheme === 'light' ? 'Dark' : 'Light'}
      </Button> */}

      {/* FIXME Choose good Icon */}
      <IconArrowLeft onClick={toggleColorScheme}>
        {computedColorScheme === 'light' ? 'Dark' : 'Light'}
      </IconArrowLeft>

      {isOnAuthPage ? (
        ''
      ) : (
        <Button type='submit' onClick={authHandler}>
          {user ? 'Logout' : 'Login'}
        </Button>
      )}
    </nav>
  );
};

export default NavBar;
