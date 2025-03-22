import { Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

type Props = {};

const LandingPage = (props: Props) => {
  const navigate = useNavigate();
  const handleLoginClick = () => {
    navigate('/login'); // Replace '/login' with your desired route
  };
  return (
    <div>
      <header>
        <h1>LandingPage</h1>
      </header>
      <section>
        <Button variant='filled' onClick={handleLoginClick}>
          Login
        </Button>
      </section>
    </div>
  );
};

export default LandingPage;
