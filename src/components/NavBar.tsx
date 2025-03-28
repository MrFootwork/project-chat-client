import './NavBar.css';
import config from '../../config';

import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconMoon, IconSun, IconSunFilled } from '@tabler/icons-react';

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
  const { toggleColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });
  const computedColorScheme = useComputedColorScheme();

  const [isDark, setIsDark] = useState(computedColorScheme === 'dark');

  // FIXME debug Icon
  function toggleTheme() {
    toggleColorScheme();
    setIsDark(computedColorScheme === 'dark');
  }

  return (
    <nav className='navbar-container'>
      <h1>Messenger</h1>

      {config.ENV === 'development' ? (
        <p className='navbar-text'>
          Env: {config.API_URL} <br />
          User: "{user?.name}" {user?.id} <br />
          Socket: {socket?.id} <br />
          Room: {currentRoom?.id}
        </p>
      ) : (
        ''
      )}

      <div className='button-container'>
        <button className='button-theme-toggler'>
          {isDark ? (
            <IconMoon onClick={toggleTheme} />
          ) : (
            <IconSun onClick={toggleTheme} />
          )}
        </button>

        {isOnAuthPage ? (
          ''
        ) : (
          <Button type='submit' onClick={authHandler}>
            {user ? 'Logout' : 'Login'}
          </Button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
