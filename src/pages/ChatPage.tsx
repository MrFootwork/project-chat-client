import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';
import { useNavigate } from 'react-router-dom';
import { RoomsContext } from '../contexts/RoomsWrapper';
import './ChatPage.css';
import { Room } from '../types/room';

const ChatPage = () => {
  const { user, validateToken } = useContext(AuthContext);
  const { rooms } = useContext(RoomsContext);
  const navigate = useNavigate();

  const [currentRoom, setCurrentRoom] = useState<Room>();

  useEffect(() => {
    validateToken();
    if (!user) navigate('/');
  }, []);

  function selectRoom(roomId: string) {
    const selectedRoom = rooms?.filter(room => room.id === roomId)?.[0];
    setCurrentRoom(selectedRoom);
  }

  return (
    <div className='chat-page-container'>
      <nav className='rooms-container'>
        <header>
          <h1>ChatPage</h1>
        </header>
        <ol>
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
        <p>Here are the messages.</p>
        {currentRoom ? <>{currentRoom.name}</> : ''}
      </section>
    </div>
  );
};

export default ChatPage;
