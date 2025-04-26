import ModalProfileEdit from './ModalProfileEdit';
import { useModal } from '../contexts/ModalContext';

const ModalManager = () => {
  const { activeModal, closeModal } = useModal();

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'profileEdit' && (
        <ModalProfileEdit onClose={closeModal} />
      )}
      {/* TODO Add other modals */}
    </>
  );
};

export default ModalManager;
