import { useState } from "../../hooks/useState";
import { useEffect } from "../../hooks/useEffect";

type ModalType = 'search' | 'notification' | null;

// Global state to manage which modal is open
let globalModalState: {
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
} = {
  activeModal: null,
  setActiveModal: () => {}
};

export const useModalManager = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  
  // Update global state
  globalModalState.activeModal = activeModal;
  globalModalState.setActiveModal = setActiveModal;
  
  const openModal = (modal: Exclude<ModalType, null>) => {
    // Close any other modal first
    if (activeModal && activeModal !== modal) {
      setActiveModal(null);
      // Small delay to ensure proper cleanup
      setTimeout(() => setActiveModal(modal), 10);
    } else {
      setActiveModal(modal);
    }
  };
  
  const closeModal = () => {
    setActiveModal(null);
  };
  
  const isModalOpen = (modal: Exclude<ModalType, null>) => {
    return activeModal === modal;
  };
  
  // Global escape key handler
  useEffect(() => {
    if (!activeModal) return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [activeModal]);
  
  return {
    activeModal,
    openModal,
    closeModal,
    isModalOpen
  };
};

// Export global state for direct access if needed
export const getGlobalModalState = () => globalModalState;