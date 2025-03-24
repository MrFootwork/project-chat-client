import './Messenger.css';
import {
  KeyboardEvent,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Button, Textarea } from '@mantine/core';
import { SocketContext } from '../contexts/SocketWrapper';

import { useForm } from '@mantine/form';
import MessageCard from './MessageCard';

import { Room } from '../types/room';

type Props = {
  room: Room | null;
};

const Messenger = (props: Props) => {
  const { socket } = useContext(SocketContext);

  // Messages
  const [messages, setMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Create a ref for the bottom of the messages

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Input handling
  const form = useForm({
    mode: 'controlled',
    initialValues: { text: '' },
  });

  function sendText(values: typeof form.values) {
    form.reset();

    setMessages((prevMessages: string[]) => {
      return [...prevMessages, values.text];
    });

    if (socket) {
      console.log('Sending the message:', values.text);
      socket.emit('send-message', values.text);
    }
  }

  /** Trigger form submission instead of a line break */
  function submitFormOnEnter(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.onSubmit(sendText)();
    }
  }

  // Socket listeners
  useEffect(() => {
    const handleReceiveMessage = (sender: string, message: string) => {
      console.log(sender, message);
      setMessages((prevMessages: string[]) => {
        return [...prevMessages, message];
      });
    };

    socket?.on('receive-message', handleReceiveMessage);

    return () => {
      socket?.off('receive-message', handleReceiveMessage);
    };
  }, [Boolean(socket)]);

  return (
    <div className='messenger-container'>
      <div className='messages-display'>
        <p>Here are the messages.</p>
        {props.room ? <>{props.room.name}</> : 'Choose a room!'}
        <ol>
          {messages.length
            ? messages.map(message => (
                <li>
                  <MessageCard message={message} />
                </li>
              ))
            : ''}
          <div ref={messagesEndRef} />
        </ol>
      </div>

      <div className='input-container'>
        <form onSubmit={form.onSubmit(sendText)}>
          {/* BUG Invalid value for prop `value` on <textarea> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior  Error Component Stack */}
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
