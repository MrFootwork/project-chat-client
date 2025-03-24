import './ChatPage.css';
import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

import Messenger from '../components/Messenger';

import { Room } from '../types/room';

const ChatPage = () => {
  const navigate = useNavigate();

  // Auth
  const { user, validateToken, token } = useContext(AuthContext);

  useEffect(() => {
    validateToken();
    if (!user) navigate('/');
  }, []);

  // Room
  const { rooms } = useContext(RoomsContext);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

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
