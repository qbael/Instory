import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type ModalType =
  | 'createPost'
  | 'editProfile'
  | 'storyViewer'
  | 'postDetail'
  | 'friends'
  | 'confirmDelete'
  | 'createStory'
  | 'createHighlight'
  | null;

interface UiState {
  activeModal: ModalType;
  modalData: unknown;
  isSidebarOpen: boolean;
  globalLoading: boolean;
}

const initialState: UiState = {
  activeModal: null,
  modalData: null,
  isSidebarOpen: false,
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openModal(
      state,
      action: PayloadAction<{ modal: ModalType; data?: unknown }>,
    ) {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data ?? null;
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalData = null;
    },
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.isSidebarOpen = action.payload;
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
  },
});

export const {
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
  setGlobalLoading,
} = uiSlice.actions;
export default uiSlice.reducer;
