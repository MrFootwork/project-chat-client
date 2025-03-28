import './Messenger.css';
import { Message } from '../types/message';

import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import MessageCard from './MessageCard';

import { RoomsContext } from '../contexts/RoomsWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

type Props = { userHasSelectedRoom: boolean };

const Messenger = ({ userHasSelectedRoom }: Props) => {
  // States and Refs
  const { socket } = useContext(SocketContext);
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const { currentRoom, updateRoomMessages } = useContext(RoomsContext);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  /**************************
   * Messenger display
   **************************/
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const firstPageLoad = useRef<boolean>(true);

  // BUG
  // CHROME: scrolls smoothly but last line stays out of view
  // FIREFOX: always jumps, at least to the very bottom
  // BOTH: doesn't jump on first page load

  // Jump scroll when:
  // 1. User enters a room
  // 2. On page load

  // JUMP to the bottom of the messages when the user enters a room
  // It needs to depend on roomMessages to race against the smooth scroll

  useEffect(() => {
    const userHasEnteredRoom = userHasSelectedRoom;
    const receivedMessageOutOfCurrentRoom =
      !userHasEnteredRoom || !firstPageLoad.current;

    console.log(`🎉 SCROLL JUMP userHasEnteredRoom`, userHasEnteredRoom);
    console.log(`🎉 SCROLL JUMP firstPageLoad`, firstPageLoad.current);
    console.log(
      `🎉 SCROLL JUMP receivedMessageOutOfCurrentRoom`,
      receivedMessageOutOfCurrentRoom
    );

    if (userHasEnteredRoom) return;
    if (!firstPageLoad.current) return;

    console.log(`🎉 SCROLL JUMP Start Scrolling`);
    firstPageLoad.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    userHasSelectedRoom = false;
    firstPageLoad.current = false;
    console.log(`🎉 SCROLL JUMP Finished Scrolling`);
  }, [
    userHasSelectedRoom,
    roomMessages,
    firstPageLoad.current,
    messagesEndRef.current,
  ]);

  // SCROLL SMOOTHLY to the bottom when a new message is received
  useEffect(() => {
    console.log(
      `❌ SCROLL SMOOTH roomMessages`,
      !roomMessages.length,
      'OR firstPageLoad',
      firstPageLoad.current,
      '=> Skip?',
      !roomMessages.length || firstPageLoad.current
    );

    if (!roomMessages.length || firstPageLoad.current) return;

    console.log(`❌ SCROLL SMOOTH Start Scrolling`);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log(`❌ SCROLL SMOOTH Finished Scrolling`);
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
    if (!socket) return;

    console.log('Sending the message:', currentRoom?.id, values.text);
    socket.emit('send-message', currentRoom?.id, values.text);
    form.reset();
    textAreaRef.current?.focus();
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

    console.log(
      `Scrolling set to smooth ~ enteringRoom: ${firstPageLoad.current}`
    );

    console.log(`💌 SCROLL SMOOTH Start Scrolling`);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log(`💌 SCROLL SMOOTH Start Scrolling`);

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
            ref={textAreaRef}
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
