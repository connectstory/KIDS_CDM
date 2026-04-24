// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import commonReducer from "./commonSlice";
import modalReducer from "./modalSlice";
import sessionReducer from "./sessionSlice";
import tooltipReducer from "./tooltipSlice";

enableMapSet();

export const store = configureStore({
  reducer: {
    common: commonReducer,
    modal: modalReducer,
    session: sessionReducer,
    tooltip: tooltipReducer,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      // serializableCheck: {
      //   ignoredActionPaths: ["payload.file"],
      //   ignoredPaths: [
      //     "fileUpload.files",
      //     "fileUpload.files.*.inputFile",
      //   ],
      // },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
