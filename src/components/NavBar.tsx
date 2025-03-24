import './NavBar.css';
import config from '../../config';

import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';

import { AuthContext } from '../contexts/AuthWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const navigate = useNavigate();
  const location = useLocation();

  const isOnAuthPage = location.pathname.includes('/auth');

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
  }

  return (
    <nav className='navbar-container'>
      <h1>Navbar</h1>
      <p className='navbar-text'>
        Env: {config.API_URL} <br />
        User: "{user?.name}" {user?.id} <br />
        Socket: {socket?.id}
      </p>

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
