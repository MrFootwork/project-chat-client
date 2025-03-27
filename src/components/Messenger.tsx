import './Messenger.css';
import { Message } from '../types/message';

import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import MessageCard from './MessageCard';

import { RoomsContext } from '../contexts/RoomsWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

const Messenger = () => {
  // States and Refs
  const { socket } = useContext(SocketContext);
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const { currentRoom, updateRoomMessages } = useContext(RoomsContext);

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
    const currentRoomExists = currentRoom && currentRoom?.messages;
    if (!currentRoomExists) return;

    console.groupCollapsed('Messenger updates roomMessages in useEffect');
    console.log('BEFORE ~ currentRoom messages:', currentRoom.messages);
    console.log('BEFORE ~ roomMessages:', roomMessages);

    setRoomMessages(currentRoom.messages || []);

    console.log('AFTER ~ currentRoom messages:', currentRoom.messages);
    console.log('AFTER ~ roomMessages:', roomMessages);
    console.groupEnd();
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
  }, [currentRoom]);

  /** Handles how received messages are managed. */
  function handleReceiveMessage(message: Message) {
    console.groupCollapsed('handleReceiveMessage');
    console.log(
      `received message from DB by ${message.author.name}: "${message.content}"`
    );
    console.log('currentRoom before:', currentRoom?.messages);

    updateRoomMessages(message);
    // FIXME Count and store unread messages for each room

    console.log('currentRoom after:', currentRoom?.messages);
    console.groupEnd();
  }

  return (
    <div className='messenger-container'>
      <div className='messages-display'>
        {/* FIXME Add Messenger Header with chatroom details */}
        <p>Here are the messages.</p>
        {currentRoom ? <>{currentRoom.name}</> : 'Choose a room!'}
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

export default Messenger;
