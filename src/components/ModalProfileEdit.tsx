import { Button, Group, Modal } from '@mantine/core';
import React from 'react';

type ModalProfileEditProps = {
  onClose: () => void;
};

const ModalProfileEdit: React.FC<ModalProfileEditProps> = ({ onClose }) => {
  function handleSave() {
    console.log('SAVING....');
    onClose();
  }

  return (
    <Modal
      opened={true}
      onClose={onClose}
      title={'Edit Profile'}
      yOffset='10rem'
      className='modal-add-member'
    >
      <div className='button-container'>
        <Group justify='flex-end'>
          <Button onClick={onClose} variant='outline'>
            Cancel
          </Button>
          <Button onClick={handleSave} variant='filled'>
            Save
          </Button>
        </Group>
      </div>
    </Modal>
  );
};

export default ModalProfileEdit;
