import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useNavigate } from 'react-router-dom';
import { RoomsContext } from '../contexts/RoomsWrapper';
import './ChatPage.css';
import { Room } from '../types/room';
import Messenger from '../components/Messenger';

const ChatPage = () => {
  const { user, validateToken } = useContext(AuthContext);
  const { rooms } = useContext(RoomsContext);
  const navigate = useNavigate();

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  useEffect(() => {
    validateToken();
    if (!user) navigate('/');
  }, []);

  function selectRoom(roomId: string) {
    const selectedRoom = rooms?.filter(room => room.id === roomId)?.[0] || null;
    if (!selectRoom) console.warn('Could not select a room.');
    setCurrentRoom(selectedRoom);
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
