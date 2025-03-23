import { Button } from '@mantine/core';
import './NavBar.css';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useLocation, useNavigate } from 'react-router-dom';

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isOnAuthPage = location.pathname.includes('/auth');

  async function authHandler() {
    if (user) logout();
    if (!user) navigate('/auth');
  }

  useEffect(() => {
    console.log('PARAMS: ', location.pathname);
  }, []);

  return (
    <nav className='navbar-container'>
      <h1>Navbar</h1>

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
