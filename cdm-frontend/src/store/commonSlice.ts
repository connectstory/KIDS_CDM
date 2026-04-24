// store/researchSlice.ts
import { type PayloadAction, createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";
import type { ApiError, AppData } from "@/interfaces/commonInterface.ts";

const initialState: AppData = {
  loadingCount: 0,
  isSidebarExtend: true,
  lastError: null,
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    loadCommonData: (state) => {
      const data = localStorage.getItem("appData");
      if (data) {
        state.isSidebarExtend = JSON.parse(data);
      }
    },

    setSidebarExtend: (state, action: PayloadAction<boolean>) => {
      state.isSidebarExtend = action.payload;
    },

    clearError(state) {
      state.lastError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 모든 thunk pending
      .addMatcher(isPending, (state) => {
        state.loadingCount += 1;
      })

      // 모든 thunk fulfilled
      .addMatcher(isFulfilled, (state) => {
        state.loadingCount = Math.max(0, state.loadingCount - 1);
      })

      // 모든 thunk rejected
      .addMatcher(isRejected, (state, action) => {
        state.loadingCount = Math.max(0, state.loadingCount - 1);

        // payload는 rejectWithValue일 때만 들어옴
        const payload = action.payload as ApiError | undefined;

        state.lastError =
          payload ??
          ({
            message: action.error?.message ?? "요청에 실패했습니다.",
          } as ApiError);
      });
  },
});

export const { loadCommonData, setSidebarExtend } = commonSlice.actions;

export default commonSlice.reducer;
