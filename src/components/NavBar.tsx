import { Button } from '@mantine/core';
import './NavBar.css';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../../config';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
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
      <p>
        {config.API_URL} <br />
        {user?.name}: {user?.id}
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
