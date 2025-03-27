import './MessageCard.css';
import type { Message } from '../types/message';
import { useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';

const MessageCard = ({ message }: { message: Message }) => {
  const { user } = useContext(AuthContext);
  const itsMe = useRef(user?.id === message.author.id);

  return (
    <div className={'message-card' + (itsMe.current ? ' its-me' : '')}>
      <div className='image-container'>
        <img src={message.author.avatarUrl} alt='' />
      </div>
      <label htmlFor={`text-${message.id}`}>{message.author.name}</label>
      <p id={`text-${message.id}`}>{message.content || ''}</p>
    </div>
  );
};

export default MessageCard;
