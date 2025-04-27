import { Room } from '../types/room';

import React, { useContext, useRef, useState } from 'react';
import { Button, Group, Modal } from '@mantine/core';
import { SearchableMultiSelect } from './SearchableMultiSelect';

import { AuthContext } from '../contexts/AuthWrapper';
import { RoomsContext } from '../contexts/RoomsWrapper';
import { SocketContext } from '../contexts/SocketWrapper';

type ModalProfileEditProps = {
  onClose: () => void;
  fullscreen: boolean;
};

const ModalRoomMemberAdd: React.FC<ModalProfileEditProps> = props => {
  const { selectRoom, currentRoom } = useContext(RoomsContext);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  // Add member modal
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
    props.onClose();
  }

  return (
    <Modal
      opened={true}
      onClose={props.onClose}
      title={`Add members to room ${currentRoom?.name}`}
      yOffset='10rem'
      className='modal-add-member'
      fullScreen={props.fullscreen}
    >
      <div className='button-container'>
        <Group justify='flex-end'>
          <Button onClick={props.onClose} variant='outline'>
            Cancel
          </Button>
          <Button onClick={handleMemberInvitations} variant='filled'>
            Add
          </Button>
        </Group>
      </div>

      <SearchableMultiSelect
        selectionList={[...selectedFriends]}
        setSelectionList={setSelectedFriends}
        optionsList={user?.friends || []}
        optionTarget='friend'
      />
    </Modal>
  );
};

export default ModalRoomMemberAdd;
