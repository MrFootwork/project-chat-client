import './MessageCard.css';
import type { Message } from '../types/message';

const MessageCard = ({ message }: { message: Message }) => {
  return (
    <div>
      {message.user.name}: {message.content}
    </div>
  );
};

export default MessageCard;
