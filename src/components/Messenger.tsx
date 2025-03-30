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
  // User
  const { user } = useContext(AuthContext);

  // Messages
  const { socket } = useContext(SocketContext);
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [receivingMessage, setReceivingMessage] = useState(false);

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
  const initiallyScrolled = useRef<boolean>(false);

  // BUG states seem to lag one step behind
  // 1. receive message in other room
  // => when coming back, scroll down only to previous state
  // 2. receive message in current room out of view
  // => unread indicator shows up on second message
  // 3. send message out of view
  // => scroll down happens on second message

  // Jump to the bottom on mount
  useEffect(() => {
    if (initiallyScrolled.current) return;
    if (!currentRoom || !roomMessages) return;

    // Without timeout the scroll executes before re-render of roomMessages
    const timeoutID = setTimeout(() => {
      console.log('SCROLL JUMP TO BOTTOM on mount');
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      setMovedUpView(false);
      initiallyScrolled.current = true;
    }, 10);

    return () => {
      if (!initiallyScrolled.current) return;
      console.log('SCROLL JUMP TO BOTTOM clear timeout');
      clearTimeout(timeoutID);
    };
  }, [currentRoom, roomMessages, initiallyScrolled]);

  // Jump to the bottom when room has changed
  useEffect(() => {
    console.log('ROOM CHANGE', userChangesRoom, roomMessages.length);
    if (!userChangesRoom || !roomMessages.length) return;

    console.log('ROOM CHANGE scrolling', userChangesRoom, roomMessages.length);
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    setMovedUpView(false);
    setUserChangesRoom(false);
  }, [userChangesRoom]);

  // Scroll to the bottom when sent message while out of view
  useEffect(() => {
    // FIXME scroll to bottom if moved up view
    if (!roomMessages.length) return;
    if (!currentRoom) return;

    const sentByMyself = user?.id === roomMessages.at(-1)?.author.id;

    // console.log({ movedUpView, sentByMyself, sendingMessage });

    if (sentByMyself && sendingMessage) {
      // Wait for rendering to finish
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setMovedUpView(false);
      }, 150);

      setHasUnreadMessages(false);
    }

    setSendingMessage(false);
  }, [roomMessages, sendingMessage]);

  // alwas scroll to the bottom when receiving message while in view
  useEffect(() => {
    if (!roomMessages.length) return;
    if (!receivingMessage) return;

    if (receivingMessage && !movedUpView) {
      // Wait for rendering to finish
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setMovedUpView(false);
      }, 150);

      setHasUnreadMessages(false);
    }

    setReceivingMessage(false);
  }, [roomMessages, receivingMessage]);

  // FIXME add indicator on message receive

  // Click Handler to scroll down smoothly
  function onClickScroll() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setMovedUpView(false);

    let timeoutID: number;

    timeoutID = setTimeout(() => {
      setHasUnreadMessages(false);
      clearTimeout(timeoutID);
    }, 500);
  }

  // Listen and store scroll position on scroll event
  function updatePosition() {
    const { scrollTop, scrollHeight, clientHeight } = messagesDisplay.current!;
    const currentPosition = scrollTop / (scrollHeight - clientHeight);
    // pos = 0: at the top
    // pos = 1: at the bottom

    setScrollPosition(currentPosition);

    if (currentPosition < 0.99) setMovedUpView(true);
    if (currentPosition >= 0.99) {
      setMovedUpView(false);
      setHasUnreadMessages(false);
    }
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

    setSendingMessage(true);

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
    // console.groupCollapsed('handleReceiveMessage');
    // console.log(
    //   `received message from DB by ${message.author.name}: "${message.content}"`
    // );
    // console.log('currentRoom before:', currentRoom?.messages);

    // console.log(
    //   `Scrolling set to smooth ~ enteringRoom: ${firstPageLoad.current}`
    // );

    // Push new message to corresponding room messages
    updateRoomMessages(message);

    // Set receivingMessage flag
    setReceivingMessage(true);

    // Activate Unread Messages indicator
    const isInCurrentRoom = currentRoom?.id === message.roomId;
    const sentByMyself = user?.id === message.author.id;

    // console.log({ isInCurrentRoom, movedUpView, sentByMyself });

    if (isInCurrentRoom && movedUpView && !sentByMyself)
      setHasUnreadMessages(true);

    // FIXME Count and store unread messages for each room
    // console.log('currentRoom after:', currentRoom?.messages);
    // console.groupEnd();
  }

  return (
    <div className='messenger-container'>
      <div
        ref={messagesDisplay}
        className='messages-display'
        onScroll={updatePosition}
      >
        {/* TODO Add Messenger Header with chatroom details */}
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
