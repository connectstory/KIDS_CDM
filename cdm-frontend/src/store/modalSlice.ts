import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { type ModalNames } from "@/interfaces/modalInterface.ts";

interface ModalData {
  title?: string;
  showHeaderCloseButton?: boolean;
  width?: string;
  fullWidth?: boolean;
  data?: unknown;
  message?: string | string[] | readonly string[];
}

interface ModalState {
  title?: string;
  showHeaderCloseButton?: boolean;
  width?: string;
  fullWidth?: boolean;
  data?: unknown;
  message?: string | string[];
  open: boolean;
}

interface OpenModalPayload extends ModalData {
  key: ModalNames;
}

interface ModalSliceState {
  modals: Partial<Record<ModalNames, ModalState>>;
  stack: ModalNames[];
}

const initialState: ModalSliceState = {
  modals: {},
  stack: [],
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    // 모달 열기 (스택 최상단에 push)
    openModal: (state, action: PayloadAction<OpenModalPayload>) => {
      const { key, message, ...rest } = action.payload;

      state.modals[key] = {
        open: true,
        ...rest,
        // readonly 배열을 mutable 배열로 변환
        message: Array.isArray(message)
          ? ([...message] as string[])
          : (message as string | undefined),
      };

      // 중복 방지
      state.stack = state.stack.filter((k) => k !== key);

      // 최상단으로
      state.stack.push(key);
    },

    // 특정 모달 닫기
    closeModal: (state, action: PayloadAction<ModalNames>) => {
      const key = action.payload;

      if (state.modals[key]) {
        state.modals[key].open = false;
      }

      state.stack = state.stack.filter((k) => k !== key);
    },

    // 최상단 모달 닫기 (ESC / backdrop)
    closeTopModal: (state) => {
      const topKey = state.stack[state.stack.length - 1];
      if (!topKey) return;

      if (state.modals[topKey]) {
        state.modals[topKey].open = false;
      }

      state.stack.pop();
    },

    /** 모든 모달 닫기 */
    closeAllModals: (state) => {
      Object.values(state.modals).forEach((modal) => {
        modal.open = false;
      });
      state.stack = [];
    },
  },
});

export const { openModal, closeModal, closeTopModal, closeAllModals } =
  modalSlice.actions;

export default modalSlice.reducer;
