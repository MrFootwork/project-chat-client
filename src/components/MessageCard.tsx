import './MessageCard.css';
import { User } from '../types/user';
import type { Message } from '../types/message';

import { useContext, useMemo, useRef } from 'react';
import TheAvatar from './TheAvatar';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

interface MessageCardProps {
  messages: {
    pre?: Message;
    this: Message;
    next?: Message;
  };
}

const MessageCard: React.FC<MessageCardProps> = ({ messages }) => {
  // Color map per member
  // FIXME implement a color map for each member
  const { currentRoom } = useContext(RoomsContext);

  const memberColorMap = useMemo(() => {
    if (!currentRoom?.members) return {};

    const members = currentRoom.members.map(m => m.id);
    const colors = members.reduce((acc, member) => {
      acc[member] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      return acc;
    }, {} as Record<User['id'], string>);

    return colors;
  }, []);

  const {
    pre: previousMessage,
    this: currentMessage,
    next: nextMessage,
  } = messages;

  const { user } = useContext(AuthContext);

  const itsMe = useRef(user?.id === currentMessage.author.id);
  const isFirst = useRef(
    !previousMessage || previousMessage.author.id !== currentMessage.author.id
  );
  const isLast = useRef(
    !nextMessage || nextMessage.author.id !== currentMessage.author.id
  );

  return (
    <div
      className={`message-card 
        ${itsMe.current ? ' its-me' : ''} 
        ${isFirst.current ? 'first' : ''}
        ${isLast.current ? 'last' : ''}`}
    >
      {isFirst.current && (
        <>
          <div className='image-container'>
            <TheAvatar user={messages.this.author} />
          </div>

          <h5>{currentMessage.author.name}</h5>
        </>
      )}
      <p>{currentMessage.content || ''}</p>
    </div>
  );
};

export default MessageCard;
