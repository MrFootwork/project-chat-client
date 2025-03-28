import './LandingPage.css';
import { Button } from '@mantine/core';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthWrapper';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleLoginClick = () => {
    navigate('/auth');
  };

  return (
    <div className='landing-page'>
      <header>
        <h1>Welcome to Messenger</h1>
        <p>
          Stay connected with your friends and meet new people! Messenger is
          your go-to messenger app for seamless and secure conversations.
          Whether you're catching up with old friends or making new ones, we've
          got you covered.
        </p>
      </header>

      <section>
        <Button variant='filled' onClick={handleLoginClick}>
          {user ? 'Browse Chat Rooms' : 'Login'}
        </Button>
      </section>
    </div>
  );
};

export default LandingPage;
