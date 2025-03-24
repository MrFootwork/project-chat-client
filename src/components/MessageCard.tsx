import './MessageCard.css';
import type { Message } from '../types/message';

type Props = {
  message: Message;
};

const MessageCard = (props: Props) => {
  return <div>{props.message}</div>;
};

export default MessageCard;
