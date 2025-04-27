import { useContext } from 'react';

import ModalUserCreate from './ModalUserCreate';
import ModalUserEdit from './ModalUserEdit';
import ModalRoomCreate from './ModalRoomCreate';
import ModalRoomMemberAdd from './ModalRoomMemberAdd';

import { useModal } from '../contexts/ModalContext';
import { ThemeContext } from '../contexts/ThemeWrapper';

const ModalManager = () => {
  const { activeModal, closeModal } = useModal();
  const { isMobile } = useContext(ThemeContext);

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'signup' && (
        <ModalUserCreate onClose={closeModal} fullscreen={isMobile} />
      )}

      {activeModal === 'editProfile' && (
        <ModalUserEdit onClose={closeModal} fullscreen={isMobile} />
      )}

      {activeModal === 'createRoom' && (
        <ModalRoomCreate onClose={closeModal} fullscreen={isMobile} />
      )}

      {activeModal === 'addRoomMembers' && (
        <ModalRoomMemberAdd onClose={closeModal} fullscreen={isMobile} />
      )}
      {/* TODO Add other modals */}
    </>
  );
};

export default ModalManager;
