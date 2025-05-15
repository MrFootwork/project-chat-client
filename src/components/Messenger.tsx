import './Messenger.css';
import { Room } from '../types/room';
import { Message } from '../types/message';
import { User } from '../types/user';
import config from '../../config';

import axios from 'axios';
import {
  KeyboardEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AvatarGroup,
  Button,
  Indicator,
  Modal,
  Skeleton,
  Textarea,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDoorExit,
  IconRobot,
  IconRobotOff,
  IconSettingsFilled,
  IconTrashX,
  IconUsersPlus,
} from '@tabler/icons-react';
import MessageCard from './MessageCard';
import TheAvatar from './TheAvatar';

import { SocketContext } from '../contexts/SocketWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';
import { useModal } from '../contexts/ModalContext';

const { API_URL } = config;

const Messenger = () => {
  /**************************
   * States and Refs
   **************************/
  const { user } = useContext(AuthContext);
  const { socket, botModel, online } = useContext(SocketContext);
  const {
    rooms,
    isLoading,
    fetchNextPage,
    hasMore,
    currentRoom,
    createRoom,
    deleteRoom,
    pushMessage,
    setMessageAsRead,
  } = useContext(RoomsContext);

  // Input
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [editModeOn, setEditModeOn] = useState(false);

  // Scrolling
  const [movedUpView, setMovedUpView] = useState<boolean>(false);
  const [reachedTop, setReachedTop] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesDisplay = useRef<HTMLDivElement | null>(null);

  // Room
  const { openModal } = useModal();

  const kickedOut = useMemo(() => {
    if (!currentRoom?.members.find(m => m.id === user?.id)) return true;
    return currentRoom?.members.find(m => m.id === user?.id)?.userLeft;
  }, [currentRoom?.members.find(m => m.id === user?.id)]);

  /**************************
   * Messenger display
   **************************/
  // Card color map per member
  const computedScheme = useComputedColorScheme();

  const memberCardColorMap = useMemo(() => {
    if (!currentRoom?.members) return {};

    const members = currentRoom.members.map(m => m.id);
    const totalMembers = members.length;
    const baseColor = Math.floor(Math.random() * 360);

    const colors = members.reduce((acc, member, index) => {
      const hue = Math.floor(baseColor + (index / totalMembers) * 360); // Random hue (0-360)
      const saturation = computedScheme === 'dark' ? 20 : 30; // Fixed saturation (e.g., 70%)
      const lightness = computedScheme === 'dark' ? 30 : 75; // Fixed lightness (e.g., 50%)
      acc[member] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      return acc;
    }, {} as Record<User['id'], React.CSSProperties['backgroundColor']>);

    return colors;
  }, [computedScheme, currentRoom?.members]);

  // Author label color map per user
  const authorLabelColorMap = useMemo(() => {
    if (!currentRoom?.members) return {};

    const members = currentRoom.members.map(m => m.id);

    const colors = members.reduce((acc, member) => {
      const color = memberCardColorMap[member];
      const hue = color!.match(/hsl\((\d+),/)?.[1] || 0;
      const saturation = computedScheme === 'dark' ? 40 : 100;
      const lightness = computedScheme === 'dark' ? 80 : 15;
      acc[member] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

      return acc;
    }, {} as Record<User['id'], React.CSSProperties['color']>);

    return colors;
  }, [memberCardColorMap]);

  // Members count and display message
  const [memberCountText, setMemberCountText] = useState<string | null>(null);

  // States for Inifinite Scrolling
  const [page, setPage] = useState(1);
  const [nextPageLoaded, setNextPageLoaded] = useState(false);
  const previousScrollHeightRef = useRef(0);
  const previousScrollTopRef = useRef(0);

  // Inifinite Scrolling
  useEffect(() => {
    const messagesContainer = messagesDisplay.current;

    // BUG is not triggered anymore?
    const timeout = setTimeout(() => {
      if (
        messagesContainer &&
        reachedTop &&
        !isLoading &&
        currentRoom?.messages.length &&
        !nextPageLoaded
      ) {
        const loadMoreMessages = async () => {
          const nextPage = page + 1;

          await fetchNextPage(nextPage, {
            scrollHeight: previousScrollHeightRef,
            scrollTop: previousScrollTopRef,
            display: messagesDisplay,
          });

          setPage(nextPage);
          setNextPageLoaded(true);
        };

        if (hasMore) loadMoreMessages();
      }
    }, 10);

    return () => clearTimeout(timeout);
  }, [reachedTop, isLoading, currentRoom?.id, page, nextPageLoaded]);

  // Scroll effect after next page is loaded
  useEffect(() => {
    if (nextPageLoaded) {
      // scroll back to previous position before next page load
      if (messagesDisplay.current) {
        messagesDisplay.current.scrollTop =
          messagesDisplay.current.scrollHeight -
          previousScrollHeightRef.current +
          previousScrollTopRef.current;
      }

      setNextPageLoaded(false);
    }
  }, [nextPageLoaded, messagesDisplay.current]);

  // Jump to the bottom on mount & when room has changed
  useEffect(() => {
    if (!messagesDisplay.current) return;
    messagesDisplay.current.scrollTop = messagesDisplay.current.scrollHeight;
  }, [currentRoom?.id]);

  // Click Handler to scroll down smoothly
  function onClickScroll() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    currentRoom?.messages.forEach(async m => {
      await setMessageAsRead(m);
    });
  }

  // Listen and store scroll position on scroll event
  function updatePosition() {
    const { scrollTop, scrollHeight } = messagesDisplay.current!;
    // scrollHeight: possible scroll height, e.g. 30_000
    // scrollTop: current scroll position,
    //    top:    0
    //    bottom: 29_700

    if (scrollTop <= 150) setReachedTop(true);
    if (scrollTop > 150) setReachedTop(false);

    if (scrollHeight - scrollTop > 1000) setMovedUpView(true);
    if (scrollHeight - scrollTop <= 1000) setMovedUpView(false);
  }

  // Disable admin buttons if not admin
  const isAdmin = useMemo(() => {
    if (!currentRoom?.members) return false;
    const admin = currentRoom.members.find(m => m.id === user?.id);
    return admin?.isAdmin || false;
  }, [currentRoom?.members.length, user?.id]);

  // Count of unread messages
  const unreadMessagesCount = useMemo(() => {
    return (
      currentRoom?.messages.reduce((sum, m) => {
        return sum + +!m.readers.some(r => r.id === user?.id);
      }, 0) || 0
    );
  }, [currentRoom?.messages]);

  /**************************
   * Send messages
   **************************/
  const [sendTextEffects, setSendTextEffects] = useState(false);

  async function sendText() {
    if (!socket?.connected) {
      console.warn('No active socket connection to send messages!');
      return;
    }

    const text = textAreaRef.current?.value.trim();
    if (!text) return;

    console.log(
      `Sending the message: ${currentRoom?.id} | ${currentRoom?.name} | ${text}`
    );

    socket.emit('send-message', currentRoom?.id, text, { botModel });

    setSendTextEffects(true);

    // Clear the input after sending
    if (textAreaRef.current) {
      textAreaRef.current.value = '';
    }
    textAreaRef.current?.focus();
  }

  const placeholderText = kickedOut
    ? 'You are no longer a member of this room.'
    : 'Enter your message here.';

  /** Trigger form submission instead of a line break */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const enterWithoutShift = event.key === 'Enter' && !event.shiftKey;
      const escape = event.key === 'Escape';

      // Cancel editing when pressed Escape
      if (escape && editModeOn) {
        event.preventDefault();
        cancelEditMode();
        return;
      }

      // Save Edit when pressed Enter
      if (enterWithoutShift && editModeOn) {
        event.preventDefault();
        saveEdit();
        return;
      }

      // Send message when pressed Enter
      if (enterWithoutShift && !editModeOn) {
        event.preventDefault();
        sendText();
      }
    },
    [editModeOn, sendText, cancelEditMode, saveEdit]
  );

  // Sending messages
  // => scroll down
  useEffect(() => {
    const sentByMyself = currentRoom?.messages.at(-1)?.author.id === user?.id;

    if (sendTextEffects && sentByMyself) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setSendTextEffects(false);
    }
  }, [currentRoom?.messages.length, sendTextEffects]);

  // Edit message
  const editingMessageID = useRef<string | null>(null);

  function activateEditMode(message: Message) {
    // Temporarily store messageID being edited
    editingMessageID.current = message.id;
    // Transfer message content to input
    if (textAreaRef.current) textAreaRef.current.value = message.content;
    textAreaRef.current?.focus();
    setEditModeOn(true);
  }

  function cancelEditMode() {
    setEditModeOn(false);
    editingMessageID.current = null;
    if (textAreaRef.current) textAreaRef.current.value = '';
    textAreaRef.current?.focus();
  }

  function saveEdit() {
    if (!socket?.connected) {
      console.warn('No active socket connection to edit messages!');
      return;
    }

    const text = textAreaRef.current?.value.trim();
    if (!text) return;

    socket.emit('edit-message', editingMessageID.current, text);

    setEditModeOn(false);
    editingMessageID.current = null;

    // Clear the input after saving
    if (textAreaRef.current) textAreaRef.current.value = '';
    textAreaRef.current?.focus();
  }

  /**************************
   * Receive messages
   **************************/
  const [receiveMessageEffects, setReceiveMessageEffects] = useState(false);

  // TODO Move this listner to the socket context
  // Setup socket listener for incoming messages
  useEffect(() => {
    // console.log('MESSAGE LISTENER ON', socket?.id);
    socket?.on('receive-message', handleReceiveMessage);

    return () => {
      // console.log('MESSAGE LISTENER OFF');
      socket?.off('receive-message', handleReceiveMessage);
    };
  }, [
    socket?.connected,
    currentRoom?.messages.length,
    createRoom,
    movedUpView,
    rooms,
  ]);

  /** Handles how received messages are managed. */
  async function handleReceiveMessage(message: Message) {
    setReceiveMessageEffects(true);
    pushMessage(message);

    if (currentRoom?.id === message.roomId && !movedUpView)
      setMessageAsRead(message);
  }

  // Receiving messages in currentRoom while scroll position is at the bottom
  // => scroll down
  useEffect(() => {
    if (movedUpView || !messagesEndRef.current || !receiveMessageEffects)
      return;

    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

    setReceiveMessageEffects(false);

    if (unreadMessagesCount >= 1)
      setMessageAsRead(currentRoom!.messages.at(-1) as Message);
  }, [currentRoom?.messages.length, movedUpView, receiveMessageEffects]);

  /**************************
   * Leave Room
   **************************/
  function handleLeaveRoom() {
    if (!user || !currentRoom || !socket) return;

    socket.emit(`remove-from-room`, currentRoom.id, [user.id]);
  }

  const ButtonLeaveRoom = () => {
    return (
      <button
        className='button-delete-room icon-button'
        onClick={handleLeaveRoom}
        title='Leave this room'
        disabled={kickedOut}
      >
        <IconDoorExit />
      </button>
    );
  };

  /**************************
   * Modal Delete Room
   **************************/
  // Delete room modal
  const [
    wantToDelete,
    { open: openModalDeleteRoom, close: closeModalDeleteRoom },
  ] = useDisclosure(false);

  // Delete room handler
  async function handleRoomDeletion() {
    const roomID = currentRoom?.id;

    try {
      // Delete room physically
      await axios.delete<Room>(`${API_URL}/api/rooms/${roomID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
        },
      });

      // Notify others about deletion
      socket?.emit('delete-room', roomID);

      // Delete room in context store
      deleteRoom(roomID);
    } catch (error) {
      console.error({ roomID }, error);
    } finally {
      closeModalDeleteRoom();
    }
  }

  /**************************
   * Modal Add Member
   **************************/
  // Update member count for current room
  useEffect(() => {
    if (!currentRoom?.members) return;

    const activeMembers = currentRoom.members.filter(m => !m.userLeft);

    if (activeMembers.length === 1) setMemberCountText('1 Member');
    else setMemberCountText(`${activeMembers.length} Members`);
  }, [currentRoom?.members]);

  /**************************
   * AI Toggler
   **************************/
  const [AIIsActive, setAIIsActive] = useState(false);

  async function toggleAI() {
    if (!socket || !currentRoom) return;

    if (AIIsActive) {
      console.log('remove bot');
      socket.emit(`remove-from-room`, currentRoom.id, ['chat-bot']);
    } else {
      console.log('add bot');
      socket.emit(`invite-to-room`, currentRoom.id, ['chat-bot']);
    }
  }

  const aiAsRoomMember = useMemo(() => {
    return currentRoom?.members.find(m => m.id === 'chat-bot');
  }, [currentRoom?.members]);

  useEffect(() => {
    setAIIsActive(() => {
      if (!aiAsRoomMember) return false;
      return !aiAsRoomMember.userLeft;
    });
  }, [aiAsRoomMember]);

  return (
    <div className='messenger-container'>
      {/*******************
       * ROOM HEADER
       *******************/}
      <header>
        <div>
          {isLoading ? (
            <>
              <Skeleton height={20} width='70%' radius='xl' />
              <Skeleton height={16} mt={10} width='40%' radius='xl' />
            </>
          ) : (
            <>
              <h3>{currentRoom?.name}</h3>
              <p>{memberCountText || ''}</p>
            </>
          )}
        </div>

        {isLoading ? (
          <div className='skeleton-wrapper'>
            <Skeleton height={50} circle />
            <Skeleton height={50} ml={-30} circle />
          </div>
        ) : (
          <AvatarGroup
            key={currentRoom?.members
              .map(m => `${m.id}-${m.userLeft}`)
              .join(',')}
            spacing='1.5rem'
          >
            {currentRoom?.members
              .filter(m => !m.userLeft)
              .map(member => {
                return (
                  <TheAvatar
                    key={member.id}
                    user={member}
                    size='3rem'
                    enableHoverEffect={true}
                  >
                    <IconSettingsFilled
                      className='admin'
                      display={member.isAdmin ? 'block' : 'none'}
                      size='1rem'
                    />
                    <Indicator
                      className='online'
                      color={
                        online[member.id] || member.id === 'chat-bot'
                          ? 'green'
                          : 'grey'
                      }
                      withBorder
                      size={14}
                    />
                  </TheAvatar>
                );
              })}
          </AvatarGroup>
        )}

        <div className='button-container'>
          <button
            className='button-toggle-ai icon-button'
            onClick={toggleAI}
            title={`Switch ${AIIsActive ? 'off' : 'on'} AI Chat Assistant`}
            id='button-toggle-ai'
            disabled={kickedOut}
          >
            {AIIsActive ? <IconRobot /> : <IconRobotOff />}
            {AIIsActive ? <label htmlFor='button-toggle-ai'>🌟</label> : ''}
          </button>
          <button
            className='button-add-member icon-button'
            onClick={() => openModal('addRoomMembers')}
            title={
              isAdmin
                ? 'Add members to this room'
                : 'Only admins can add members'
            }
            disabled={!isAdmin || kickedOut}
          >
            <IconUsersPlus />
          </button>
          {isAdmin ? (
            <button
              className='button-delete-room icon-button'
              onClick={() => {
                setTimeout(() => {
                  openModalDeleteRoom();
                }, 200);
              }}
              title={
                isAdmin
                  ? 'Delete this room'
                  : 'Only admins can delete this room'
              }
              disabled={!isAdmin || kickedOut}
            >
              <IconTrashX />
            </button>
          ) : (
            ButtonLeaveRoom()
          )}
        </div>
      </header>

      {/*******************
       * MESSAGES DISPLAY
       *******************/}
      <div
        ref={messagesDisplay}
        className='messages-display'
        onScroll={updatePosition}
      >
        <ol>
          {currentRoom?.messages.length ? (
            currentRoom?.messages.map((message, i) => {
              // Explicit reclalculating messagesProp to force re-render
              const messagesProp = {
                pre: currentRoom?.messages[i - 1] || null,
                this: { ...message },
                next: currentRoom?.messages[i + 1] || null,
              };

              return (
                // Pure IDs can create duplicates during pagination
                <li key={`${message.id}`}>
                  <MessageCard
                    messages={messagesProp}
                    baseColor={memberCardColorMap[message.author.id]}
                    authorLabelColor={authorLabelColorMap[message.author.id]}
                    onEdit={activateEditMode}
                  />
                </li>
              );
            })
          ) : (
            <p style={{ marginTop: '2rem' }}>
              Start chatting by entering your first message.
            </p>
          )}
          <div ref={messagesEndRef} />
        </ol>
      </div>

      {/**************
       * INPUT
       **************/}
      <div className='input-container'>
        <form
          onSubmit={e => {
            e.preventDefault();
            editModeOn ? saveEdit() : sendText();
          }}
        >
          <Textarea
            ref={textAreaRef}
            radius='md'
            placeholder={placeholderText}
            className='textarea-custom'
            onKeyDown={e => handleKeyPress(e)}
            autosize
            minRows={2}
            maxRows={6}
            disabled={kickedOut}
          />

          {editModeOn ? (
            <div className='edit-buttons'>
              <Button onClick={cancelEditMode}>❌</Button>
              <Button type='submit'>✅</Button>
            </div>
          ) : (
            <Button type='submit' disabled={kickedOut}>
              Send
            </Button>
          )}

          {movedUpView && (
            <Indicator
              className='indicator-scroll-down'
              position='top-start'
              offset={2}
              size={15}
              label={unreadMessagesCount}
              disabled={!unreadMessagesCount}
              processing
            >
              <button
                type='button'
                className='scroll-down'
                onClick={onClickScroll}
              >
                ↓
              </button>
            </Indicator>
          )}
        </form>
      </div>

      {/* Delete Modal */}
      {wantToDelete ? (
        <Modal
          opened={wantToDelete}
          onClose={closeModalDeleteRoom}
          title={`Delete Room ${currentRoom?.name}?`}
          yOffset='10rem'
          className='modal-delete-room'
        >
          <p>
            Are you sure you want to delete this room? The room and all its
            messages will be deleted. This is irreversible.
          </p>

          <div className='button-container'>
            <Button onClick={closeModalDeleteRoom} variant='outline'>
              Cancel
            </Button>
            <Button onClick={handleRoomDeletion} variant='filled' color='red'>
              Delete
            </Button>
          </div>
        </Modal>
      ) : (
        ''
      )}
    </div>
  );
};

export default Messenger;
