import './MessageCard.css';
import type { Message } from '../types/message';

import { useContext, useRef } from 'react';
import TheAvatar from './TheAvatar';

import { AuthContext } from '../contexts/AuthWrapper';

interface MessageCardProps {
  messages: {
    pre?: Message;
    this: Message;
    next?: Message;
  };
  baseColor: React.CSSProperties['backgroundColor'];
  authorLabelColor: React.CSSProperties['color'];
}

const MessageCard: React.FC<MessageCardProps> = ({
  messages,
  baseColor,
  authorLabelColor,
}) => {
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
      style={{ backgroundColor: baseColor }}
    >
      {isFirst.current && (
        <>
          <div className='image-container'>
            <TheAvatar user={messages.this.author} />
          </div>

          <h5 style={{ color: authorLabelColor }}>
            {currentMessage.author.name}
          </h5>
        </>
      )}
      <p>{currentMessage.content || ''}</p>
    </div>
  );
};

export default MessageCard;
