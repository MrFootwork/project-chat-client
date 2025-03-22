import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const { user, validateToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    validateToken();
    if (!user) navigate('/');
  }, []);

  return (
    <div>
      <header>
        <h1>ChatPage</h1>
      </header>
      <section>
        <p>Here is some chatting going on</p>
        <div>
          <h3>Login Status</h3>
          {user ? (
            <p>Logged in as: {user.name || user.email}</p>
          ) : (
            <p>Not logged in</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ChatPage;
