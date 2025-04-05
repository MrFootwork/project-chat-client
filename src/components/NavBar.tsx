import './NavBar.css';
import config from '../../config';

import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  MantineColorScheme,
  useMantineColorScheme,
} from '@mantine/core';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import { IconMoon, IconSun, IconSunMoon } from '@tabler/icons-react';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { selectedRoomID } = useContext(RoomsContext);

  const navigate = useNavigate();
  const location = useLocation();

  /**********
   * AUTH
   *********/
  const isOnAuthPage = location.pathname.includes('/auth');

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
  }

  /******************
   * Theme Handling
   ******************/
  const { setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });

  const [currentTheme, setCurrentTheme] = useState<MantineColorScheme>('auto');

  // Set Mantine's color scheme whenever currentTheme changes
  useEffect(() => {
    setColorScheme(currentTheme);
  }, [currentTheme, setColorScheme]);

  // Cycles themes through auto, dark, and light
  function handleNextTheme() {
    setCurrentTheme(prevTheme => {
      const themes: MantineColorScheme[] = ['auto', 'dark', 'light'];
      const currentIndex = themes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];

      return nextTheme;
    });
  }

  return (
    <nav className='navbar-container'>
      <h1 style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        Messenger
      </h1>

      {config.ENV === 'development' ? (
        <p className='navbar-text'>
          Env: {config.API_URL} <br />
          User: "{user?.name}" {user?.id} <br />
          Socket: {socket?.id} <br />
          Room: {selectedRoomID}
        </p>
      ) : (
        ''
      )}

      <div className='button-container'>
        <div
          className='button-theme-toggler icon-button'
          onClick={handleNextTheme}
          title='Cycle themes through auto, dark, and light'
        >
          {
            {
              auto: <IconSunMoon />,
              dark: <IconMoon />,
              light: <IconSun />,
            }[currentTheme]
          }
        </div>

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
