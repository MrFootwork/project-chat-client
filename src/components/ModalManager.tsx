import ModalProfileEdit from './ModalProfileEdit';
import { useModal } from '../contexts/ModalContext';
import ModalRoomCreate from './ModalRoomCreate';

const ModalManager = () => {
  const { activeModal, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'editProfile' && (
        <ModalProfileEdit onClose={closeModal} />
      )}
      {activeModal === 'createRoom' && <ModalRoomCreate onClose={closeModal} />}
      {/* TODO Add other modals */}
    </>
  );
};

export default ModalManager;
