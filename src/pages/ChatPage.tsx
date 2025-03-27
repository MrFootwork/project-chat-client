import './ChatPage.css';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import Messenger from '../components/Messenger';

const ChatPage = () => {
  const navigate = useNavigate();

  /**********
   * AUTH
   **********/
  const { user, validateToken } = useContext(AuthContext);

  useEffect(() => {
    validateToken();
    if (!user) navigate('/');
  }, []);

  /**********
   * ROOMS
   **********/
  const { rooms, fetchSelectedRoom } = useContext(RoomsContext);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const isInitialRender = useRef(true);

  // Load messages for current room on first render
  useEffect(() => {
    const isFirstRender = rooms && isInitialRender.current;

    if (isFirstRender) {
      console.log('Initial Render detected: ', isFirstRender);

      fetchSelectedRoom(rooms[0].id);
      isInitialRender.current = false;
    }

    return;
  }, [rooms]);

  // Fetch selected room messages
  async function selectRoom(roomId: string) {
    setSelectedRoomId(roomId);
    await fetchSelectedRoom(roomId);
  }

  return (
    <div className='chat-page-container'>
      <nav className='rooms-container'>
        <header>
          <h1>Groups</h1>
        </header>

        <ol className='room-button-container'>
          {rooms?.map((room, firstElement) => {
            return (
              <li key={room.id}>
                <input
                  defaultChecked={!firstElement}
                  type='radio'
                  name='room'
                  id={`room-${room.id}`}
                  onChange={() => selectRoom(room.id)}
                />
                <label htmlFor={`room-${room.id}`}>{room.name}</label>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className='messenger-container'>
        <Messenger enteringRoomEvent={selectedRoomId} />
      </section>
    </div>
  );
};

export default ChatPage;
