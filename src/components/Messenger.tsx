import './Messenger.css';
import { Message } from '../types/message';

import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { Button, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import MessageCard from './MessageCard';

import { RoomsContext } from '../contexts/RoomsWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

const Messenger = () => {
  /**************************
   * States and Refs
   **************************/
  // Messages
  const { socket } = useContext(SocketContext);

  // Rooms
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const {
    currentRoom,
    updateRoomMessages,
    userChangesRoom,
    setUserChangesRoom,
  } = useContext(RoomsContext);

  // Input
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Scrolling
  const [movedUpView, setMovedUpView] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesDisplay = useRef<HTMLDivElement | null>(null);

  /**************************
   * Messenger display
   **************************/
  const firstPageLoad = useRef<boolean>(true);
  const initiallyScrolled = useRef<boolean>(false);

  // Jump to the bottom on mount
  useEffect(() => {
    if (initiallyScrolled.current) return;
    if (!currentRoom || !roomMessages) return;

    console.log('ROOM CHANGE JUMP TO BOTTOM on mount');
    initiallyScrolled.current = true;

    // Without timeout the scroll executes before re-render of roomMessages
    const timeoutID = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      initiallyScrolled.current = true;
    }, 1);

    return () => {
      if (!initiallyScrolled.current) return;
      clearTimeout(timeoutID);
    };
  }, [currentRoom, roomMessages, initiallyScrolled]);

  // Jump to the bottom when room has changed
  useEffect(() => {
    console.log('ROOM CHANGE', userChangesRoom, roomMessages.length);
    if (!userChangesRoom || !roomMessages.length) return;

    console.log('ROOM CHANGE scrolling', userChangesRoom, roomMessages.length);
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    setUserChangesRoom(false);
  }, [userChangesRoom]);

  // FIXME add indicator on message receive

  // Click Handler to scroll down smoothly
  function onClickScroll() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMovedUpView(false);
  }

  // Listen and store scroll position on scroll event
  function onScrollGetPosition(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const currentPosition = scrollTop / (scrollHeight - clientHeight);
    // pos = 0: at the top
    // pos = 1: at the bottom

    setScrollPosition(currentPosition);
    setMovedUpView(true);
  }

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

    // console.groupCollapsed('Messenger updates roomMessages in useEffect');
    // console.log('BEFORE ~ currentRoom messages:', currentRoom.messages);
    // console.log('BEFORE ~ roomMessages:', roomMessages);

    setRoomMessages(currentRoom.messages || []);
    // console.log('ROOM CHANGE TRIGGER');

    // console.log('AFTER ~ currentRoom messages:', currentRoom.messages);
    // console.log('AFTER ~ roomMessages:', roomMessages);
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
    // TODO shouldn't that have no dependencies?
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

    // Push new message to corresponding room messages
    updateRoomMessages(message);

    // FIXME Show icon on scroll down button if in current room and bottom out of view

    // FIXME Count and store unread messages for each room
    console.log('currentRoom after:', currentRoom?.messages);
    console.groupEnd();
  }

  return (
    <div className='messenger-container'>
      <div
        ref={messagesDisplay}
        className='messages-display'
        onScroll={onScrollGetPosition}
      >
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
          {(scrollPosition || 0) < 0.99 ? (
            <button
              type='button'
              className='scroll-down'
              onClick={onClickScroll}
            >
              ↓
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
