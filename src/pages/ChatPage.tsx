import './ChatPage.css';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import Messenger from '../components/Messenger';

const ChatPage = () => {
  const navigate = useNavigate();

  // Auth
  const { user, validateToken } = useContext(AuthContext);

  useEffect(() => {
    validateToken();
    if (!user) navigate('/');
  }, []);

  // Room
  const { rooms, currentRoom, fetchSelectedRoom } = useContext(RoomsContext);

  async function selectRoom(roomId: string) {
    // refetch room messages for the selected room
    const selectedRoom = await fetchSelectedRoom(roomId);
  }

  return (
    <div className='chat-page-container'>
      <nav className='rooms-container'>
        <header>
          <h1>ChatPage</h1>
        </header>

        <ol className='room-button-container'>
          {rooms?.map(room => {
            return (
              <li key={room.id}>
                <button onClick={() => selectRoom(room.id)}>{room.name}</button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className='messenger-container'>
        <Messenger room={currentRoom} />
      </section>
    </div>
  );
};

export default ChatPage;
