import './ChatPage.css';
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

import Messenger from '../components/Messenger';
import IndicatorUnread from '../components/IndicatorUnread';
import { Room } from '../types/room';

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

  // Initial page load
  useEffect(() => {
    console.log('Loading from ChatPage...');
    fetchRooms();
  }, []);

  // After initial load, fetch the first room messages & set messages to being read
  // Needs this effect to access the rooms from before
  useEffect(() => {
    if (rooms?.length) {
      console.log('Fetch selected room from ChatPage...', rooms?.length);
      fetchSelectedRoom(rooms[0]?.id || '');
    }

    // console.table(
    //   rooms?.map(r => {
    //     return {
    //       room: r.name,
    //       total: r.messages.length,
    //       unread: roomHasUnreadMessages(r),
    //     };
    //   })
    // );
  }, [rooms && rooms.length]);

  // Fetch selected room messages
  function handleRoomSelection(roomID: string) {
    fetchSelectedRoom(roomID);
  }

  /**********
   * MESSAGES
   **********/
  function roomHasUnreadMessages(room: Room) {
    return room.messages.some(message => {
      const onReadersList = message.readers.some(readers => {
        return readers.id === user?.id;
      });

      return !onReadersList;
    });
  }

  return (
    <div className='chat-page-container'>
      <nav className='rooms-container'>
        <header>
          <h1>Groups</h1>
        </header>

        <ol className='room-button-container'>
          {rooms?.map((room, firstElement) => {
            const hasUnreadMessage = roomHasUnreadMessages(room);
            const isSelectedRoom = room.id === selectedRoomID;

            return (
              <li key={room.id}>
                <input
                  defaultChecked={!firstElement}
                  type='radio'
                  name='room'
                  id={`room-${room.id}`}
                  onChange={() => handleRoomSelection(room.id)}
                />
                <label htmlFor={`room-${room.id}`}>
                  {room.name}
                  <IndicatorUnread
                    visible={hasUnreadMessage && !isSelectedRoom}
                    position={{
                      top: '1rem',
                      right: '.5rem',
                    }}
                  />
                </label>
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
