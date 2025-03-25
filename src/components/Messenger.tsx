import './Messenger.css';
import { Room } from '../types/room';
import { Message } from '../types/message';

import {
  KeyboardEvent,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import MessageCard from './MessageCard';

import { SocketContext } from '../contexts/SocketWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

type Props = {
  room: Room | null;
};

const Messenger = (props: Props) => {
  // States and Refs
  const { socket } = useContext(SocketContext);
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const { currentRoom, updateRoomByMessage } = useContext(RoomsContext);

  /**************************
   * Messenger display
   **************************/
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Create a ref for the bottom of the messages

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  /**************************
   * Send messages
   **************************/
  const form = useForm({
    mode: 'controlled',
    initialValues: { text: '' },
  });

  // Load messages for the current room
  useEffect(() => {
    setRoomMessages(currentRoom?.messages || []);
  }, [currentRoom]);

  function sendText(values: typeof form.values) {
    // TESTING Clear the form after submission
    // form.reset();

    if (socket) {
      console.log('Sending the message:', currentRoom?.id, values.text);
      socket.emit('send-message', currentRoom?.id, values.text);
    }
  }

  /** Trigger form submission instead of a line break */
  function submitFormOnEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.onSubmit(sendText)();
    }
  }

  /**************************
   * Receive messages
   **************************/
  useEffect(() => {
    socket?.on('receive-message', handleReceiveMessage);

    return () => {
      socket?.off('receive-message', handleReceiveMessage);
    };
  }, [Boolean(socket), currentRoom]);

  function handleReceiveMessage(message: Message) {
    // Update the messages state
    if (message.roomId === currentRoom?.id)
      setRoomMessages((prevMessages: Message[]) => {
        return [...prevMessages, message];
      });

    // Update the rooms state
    updateRoomByMessage(message);
  }

  return (
    <div className='messenger-container'>
      <div className='messages-display'>
        {/* FIXME Add Messenger Header with chatroom details */}
        <p>Here are the messages.</p>
        {props.room ? <>{props.room.name}</> : 'Choose a room!'}
        <ol>
          {roomMessages.length
            ? roomMessages.map(message => (
                <li key={message.id}>
                  <MessageCard message={message} />
                </li>
              ))
            : ''}
          <div ref={messagesEndRef} />
        </ol>
      </div>

      <div className='input-container'>
        <form onSubmit={form.onSubmit(sendText)}>
          <Textarea
            radius='md'
            placeholder='Enter your message here.'
            key={form.key('text')}
            {...form.getInputProps('text')}
            className='textarea-custom'
            onKeyDown={e => submitFormOnEnter(e)}
          />
          <Button type='submit'>Send</Button>
        </form>
      </div>
    </div>
  );
};

export default memo(Messenger);
