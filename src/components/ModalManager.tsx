import ModalUserEdit from './ModalUserEdit';
import ModalRoomCreate from './ModalRoomCreate';
import ModalUserCreate from './ModalUserCreate';

import { useModal } from '../contexts/ModalContext';

const ModalManager = () => {
  const { activeModal, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'signup' && <ModalUserCreate onClose={closeModal} />}
      {activeModal === 'editProfile' && <ModalUserEdit onClose={closeModal} />}
      {activeModal === 'createRoom' && <ModalRoomCreate onClose={closeModal} />}
      {/* TODO Add other modals */}
    </>
  );
};

export default ModalManager;
