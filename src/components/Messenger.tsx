import './Messenger.css';
import { Room } from '../types/room';
import { Message } from '../types/message';

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
  Modal,
  Textarea,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { IconTrashX, IconUsersPlus } from '@tabler/icons-react';
import MessageCard from './MessageCard';
import IndicatorUnread from './IndicatorUnread';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import TheAvatar from './TheAvatar';

import { SocketContext } from '../contexts/SocketWrapper';
import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';
import { User } from '../types/user';

const Messenger = () => {
  /**************************
   * States and Refs
   **************************/
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const {
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
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [movedUpView, setMovedUpView] = useState<boolean>(false);
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);
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
  }, [computedScheme]);

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
  }, [computedScheme, memberCardColorMap]);

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

  // Disable admin buttons if not admin
  const isAdmin = useMemo(() => {
    if (!currentRoom?.members) return false;
    const admin = currentRoom.members.find(m => m.id === user?.id);
    return admin?.isAdmin || false;
  }, [currentRoom?.members.length, user?.id]);

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
  ]);
  // BUG Try movedUpView as useMemo. Currently listener toggling is to much!

  /** Handles how received messages are managed. */
  async function handleReceiveMessage(message: Message) {
    pushMessage(message);

    if (currentRoom?.id === message.roomId && !movedUpView)
      setMessageAsRead(message);
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

  /**************************
   * Modal Delete Room
   **************************/
  // Delete room modal
  const [
    wantToDelete,
    { open: openModalDeleteRoom, close: closeModalDeleteRoom },
  ] = useDisclosure(false);

  // Delete room handler
  function handleRoomDeletion() {
    deleteRoom(currentRoom?.id || '');
    closeModalDeleteRoom();
  }

  // FIXME Restrict deletion and adding members to admins

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

    // Update room members
    const updatedRoom = await selectRoom(currentRoom.id);
    const currentMembers = getSelectedFriends(updatedRoom);

    // Clean up
    closeModalAddMember();
    setSelectedFriends(currentMembers);
  }

  // Update member count for current room
  useEffect(() => {
    if (!currentRoom?.members) return;

    if (currentRoom?.members.length === 1) membersCountRef.current = '1 Member';
    else membersCountRef.current = `${currentRoom?.members.length} Members`;

    console.log('Member count updated: ', membersCountRef.current);
  }, [currentRoom?.members.length]);

  return (
    <div className='messenger-container'>
      <header>
        <div>
          <h3>{currentRoom?.name}</h3>
          <p>{membersCountRef.current || ''}</p>
        </div>

        <AvatarGroup spacing='1.5rem'>
          {currentRoom?.members.map(member => {
            return <TheAvatar key={member.id} user={member} size='3rem' />;
          })}
        </AvatarGroup>

        <div className='button-container'>
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
            disabled={!isAdmin}
          >
            <IconUsersPlus />
          </button>
          <button
            className='button-delete-room icon-button'
            onClick={() => {
              setTimeout(() => {
                openModalDeleteRoom();
              }, 200);
            }}
            title={
              isAdmin ? 'Delete this room' : 'Only admins can delete this room'
            }
            disabled={!isAdmin}
          >
            <IconTrashX />
          </button>
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
              <IndicatorUnread
                visible={hasUnreadMessages}
                position={{ top: '-0.3rem', left: '-0.3rem' }}
              />
            </button>
          ) : (
            ''
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
              list={[...selectedFriends]}
              setList={setSelectedFriends}
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
