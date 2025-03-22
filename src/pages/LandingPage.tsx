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
    <div>
      <header>
        <h1>LandingPage</h1>
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
