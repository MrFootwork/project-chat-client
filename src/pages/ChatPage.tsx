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
  const { rooms, fetchRooms, fetchSelectedRoom, selectedRoomID } =
    useContext(RoomsContext);

  // initial page load
  useEffect(() => {
    fetchRooms();
  }, []);

  // Fetch selected room messages
  function handleRoomSelection(roomID: string) {
    fetchSelectedRoom(roomID);
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
                {/* FIXME Add unread messages icon */}
                <input
                  defaultChecked={!firstElement}
                  type='radio'
                  name='room'
                  id={`room-${room.id}`}
                  onChange={() => handleRoomSelection(room.id)}
                />
                <label htmlFor={`room-${room.id}`}>{room.name}</label>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className='messenger-container'>
        <Messenger key={selectedRoomID} />
      </section>
    </div>
  );
};

export default ChatPage;
