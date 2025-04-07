import './MessageCard.css';

import { useContext, useRef } from 'react';

import TheAvatar from './TheAvatar';
import { AuthContext } from '../contexts/AuthWrapper';
import type { Message } from '../types/message';

interface MessageCardProps {
  messages: {
    pre?: Message;
    this: Message;
    next?: Message;
  };
}

const MessageCard: React.FC<MessageCardProps> = ({ messages }) => {
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
