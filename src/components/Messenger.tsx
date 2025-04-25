import './Messenger.css';
import { Room } from '../types/room';
import { Message } from '../types/message';
import { User } from '../types/user';
import config from '../../config';

import axios from 'axios';
import {
  KeyboardEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AvatarGroup,
  Button,
  Group,
  Indicator,
  Modal,
  Textarea,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import {
  IconDoorExit,
  IconRobot,
  IconRobotOff,
  IconSettingsFilled,
  IconTrashX,
  IconUsersPlus,
} from '@tabler/icons-react';
import MessageCard from './MessageCard';
import IndicatorUnread from './IndicatorUnread';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import TheAvatar from './TheAvatar';

import { SocketContext } from '../contexts/SocketWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';

const { API_URL } = config;

const Messenger = () => {
  /**************************
   * States and Refs
   **************************/
  const { user } = useContext(AuthContext);
  const { socket, botModel, online } = useContext(SocketContext);
  const {
    rooms,
    currentRoom,
    selectRoom,
    createRoom,
    deleteRoom,
    pushMessage,
    setMessageAsRead,
  } = useContext(RoomsContext);

  // Input
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Scrolling
  const [movedUpView, setMovedUpView] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesDisplay = useRef<HTMLDivElement | null>(null);

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
  const membersCountRef = useRef<string | null>(null);

  // Jump to the bottom on mount & when room has changed
  useEffect(() => {
    if (!messagesDisplay.current) return;

    // console.log('SCROLLING DOWN', selectedRoomID);
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

    // pos = 0: at the top
    // pos = 1: at the bottom

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
  const form = useForm({
    mode: 'controlled',
    initialValues: { text: '' },
  });

  async function sendText(values: typeof form.values) {
    if (!socket?.connected) {
      console.warn('No active socket connection to send messages!');
      return;
    }

    console.log(
      `Sending the message: ${currentRoom?.id} | ${currentRoom?.name} | ${values.text}`
    );

    socket.emit('send-message', currentRoom?.id, values.text, { botModel });

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

  // Scroll down while receiving AI stream
  useEffect(() => {
    if (!movedUpView) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentRoom?.messages.at(-1)?.content]);

  /**************************
   * Receive messages
   **************************/
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
    pushMessage(message);

    if (currentRoom?.id === message.roomId && !movedUpView)
      setMessageAsRead(message);
  }

  // Receiving messages in currentRoom while scroll position is at the bottom
  // => scroll down
  useEffect(() => {
    if (movedUpView || !messagesEndRef.current) return;

    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });

    if (unreadMessagesCount >= 1)
      setMessageAsRead(currentRoom!.messages.at(-1) as Message);
  }, [currentRoom?.messages.length]);

  /**************************
   * Leave Room
   **************************/
  const kickedOut = useMemo(() => {
    if (!currentRoom?.members.find(m => m.id === user?.id)) return true;
    return currentRoom?.members.find(m => m.id === user?.id)?.userLeft;
  }, [currentRoom?.members.find(m => m.id === user?.id)]);

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
  // Add member modal
  const [
    wantToAddMember,
    { open: openModalAddMember, close: closeModalAddMember },
  ] = useDisclosure(false);

  function getSelectedFriends(room: Room | undefined | null) {
    return room?.members.map(m => m.id).filter(id => id !== user?.id) || [];
  }
  const defaultRoomMembers = useRef(() => getSelectedFriends(currentRoom));

  const [selectedFriends, setSelectedFriends] = useState<string[]>(
    defaultRoomMembers.current
  );

  // Add member handler
  async function handleMemberInvitations() {
    console.log('Adding member to room...', selectedFriends);

    if (!socket || socket?.disconnected || !currentRoom?.id) {
      console.error('Socket not connected!');
      return;
    }

    // Emit invitations
    socket.emit('invite-to-room', currentRoom.id, selectedFriends);

    try {
      // Update room members
      const updatedRoom = (await selectRoom(currentRoom.id)) || ({} as Room);
      const currentMembers = getSelectedFriends(updatedRoom);

      setSelectedFriends(currentMembers);
    } catch (error) {
      console.error('Error during invitation:', error);
    }

    // Clean up
    closeModalAddMember();
  }

  // Update member count for current room
  useEffect(() => {
    if (!currentRoom?.members) return;

    const activeMembers = currentRoom.members.filter(m => !m.userLeft);

    if (activeMembers.length === 1) membersCountRef.current = '1 Member';
    else membersCountRef.current = `${activeMembers.length} Members`;
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
    setAIIsActive(ai => {
      if (!aiAsRoomMember) return false;
      return !aiAsRoomMember.userLeft;
    });
  }, [aiAsRoomMember]);

  return (
    <div className='messenger-container'>
      <header>
        <div>
          <h3>{currentRoom?.name}</h3>
          <p>{membersCountRef.current || ''}</p>
        </div>

        {/* FIXME hover animation  */}
        <AvatarGroup
          key={currentRoom?.members.map(m => `${m.id}-${m.userLeft}`).join(',')}
          spacing='1.5rem'
        >
          {currentRoom?.members
            .filter(m => !m.userLeft)
            .map(member => {
              return (
                <TheAvatar key={member.id} user={member} size='3rem'>
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
            onClick={() => {
              setTimeout(() => {
                openModalAddMember();
              }, 200);
            }}
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
                <li key={`${message.id}-${currentRoom.messages.length}`}>
                  <MessageCard
                    messages={messagesProp}
                    baseColor={memberCardColorMap[message.author.id]}
                    authorLabelColor={authorLabelColorMap[message.author.id]}
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

      <div className='input-container'>
        <form onSubmit={form.onSubmit(sendText)}>
          <Textarea
            ref={textAreaRef}
            radius='md'
            placeholder={
              kickedOut
                ? 'You are no longer a member of this room.'
                : 'Enter your message here.'
            }
            key={form.key('text')}
            {...form.getInputProps('text')}
            className='textarea-custom'
            onKeyDown={e => submitFormOnEnter(e)}
            autosize
            minRows={2}
            maxRows={6}
            disabled={kickedOut}
          />

          <Button type='submit' disabled={kickedOut}>
            Send
          </Button>
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

      {/* Add member Modal */}
      {wantToAddMember ? (
        <Modal
          opened={wantToAddMember}
          onClose={closeModalAddMember}
          title={`Add members to room ${currentRoom?.name}`}
          yOffset='10rem'
          className='modal-add-member'
        >
          <div className='button-container'>
            <SearchableMultiSelect
              selectionList={[...selectedFriends]}
              setSelectionList={setSelectedFriends}
              optionsList={user?.friends || []}
              optionTarget='friend'
            />

            <Group justify='flex-end'>
              <Button onClick={closeModalAddMember} variant='outline'>
                Cancel
              </Button>
              <Button onClick={handleMemberInvitations} variant='filled'>
                Add
              </Button>
            </Group>
          </div>
        </Modal>
      ) : (
        ''
      )}

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
