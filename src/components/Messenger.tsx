import './Messenger.css';
import { Message } from '../types/message';

import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import MessageCard from './MessageCard';

import { SocketContext } from '../contexts/SocketWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

const Messenger = () => {
  /**************************
   * States and Refs
   **************************/
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { currentRoom, selectedRoomID, pushMessage } = useContext(RoomsContext);

  // Input
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Scrolling
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [movedUpView, setMovedUpView] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesDisplay = useRef<HTMLDivElement | null>(null);

  /**************************
   * Messenger display
   **************************/
  // Jump to the bottom on mount & when room has changed
  useEffect(() => {
    if (!messagesDisplay.current) return;

    // console.log('SCROLLING DOWN', selectedRoomID);
    messagesDisplay.current.scrollTop = messagesDisplay.current.scrollHeight;
  }, [currentRoom?.id]);

  // Click Handler to scroll down smoothly
  function onClickScroll() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMovedUpView(false);
  }

  // Listen and store scroll position on scroll event
  function updatePosition() {
    const { scrollTop, scrollHeight, clientHeight } = messagesDisplay.current!;
    const currentPosition = scrollTop / (scrollHeight - clientHeight);
    // pos = 0: at the top
    // pos = 1: at the bottom

    setScrollPosition(currentPosition);

    if (currentPosition < 0.99) setMovedUpView(true);
    if (currentPosition >= 0.99) setMovedUpView(false);
  }

  // Remove indicator when at bottom
  useEffect(() => {
    if (!movedUpView) setHasUnreadMessages(false);
  }, [movedUpView]);

  /**************************
   * Send messages
   **************************/
  const form = useForm({
    mode: 'controlled',
    initialValues: { text: '' },
  });

  function sendText(values: typeof form.values) {
    if (!socket) return;

    console.log(
      `Sending the message: ${currentRoom?.id} | ${currentRoom?.name} | ${values.text}`
    );
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

  // Sending messages, while out of view
  // => scroll down
  useEffect(() => {
    const sentByMyself = currentRoom?.messages.at(-1)?.author.id === user?.id;

    if (movedUpView && sentByMyself) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentRoom?.messages.length]);

  /**************************
   * Receive messages
   **************************/
  // Setup socket listener for incoming messages
  useEffect(() => {
    // console.log('MESSAGE LISTENER ON', socket?.id);
    socket?.on('receive-message', handleReceiveMessage);
    // console.log('SOCKET LISTENER', currentRoom?.messages);

    return () => {
      // console.log('MESSAGE LISTENER OFF');
      socket?.off('receive-message', handleReceiveMessage);
    };
    //
  }, [socket?.connected, currentRoom?.messages.length]);

  /** Handles how received messages are managed. */
  function handleReceiveMessage(message: Message) {
    console.log('RECEIVE MESSAGE', message.author.name, message.content);
    pushMessage(message);
  }

  // Receiving messages while moved up
  // => show indicator
  useEffect(() => {
    const sentByMyself = currentRoom?.messages.at(-1)?.author.id === user?.id;

    if (movedUpView && !sentByMyself) setHasUnreadMessages(true);
  }, [currentRoom?.messages.length]);

  // Receiving messages in currentRoom while scroll position is at the bottom
  // => scroll down
  useEffect(() => {
    if (movedUpView || !messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [currentRoom?.messages.length]);

  return (
    <div className='messenger-container'>
      <div
        ref={messagesDisplay}
        className='messages-display'
        onScroll={updatePosition}
      >
        {/* TODO Add Messenger Header with chatroom details */}
        <p>Here are the messages.</p>
        {selectedRoomID ? <>{currentRoom?.name}</> : 'Choose a room!'}
        <ol>
          {currentRoom?.messages.length
            ? currentRoom?.messages.map(message => (
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
          {(scrollPosition || 0) < 0.99 ? (
            <button
              type='button'
              className='scroll-down'
              onClick={onClickScroll}
            >
              ↓
              {hasUnreadMessages ? (
                <div className='indicator-received-message-current-room' />
              ) : (
                ''
              )}
            </button>
          ) : (
            ''
          )}
        </form>
      </div>
    </div>
  );
};

export default Messenger;
