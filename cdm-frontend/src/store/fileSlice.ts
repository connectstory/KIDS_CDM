// // store/modalSlice.ts
// import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
// import { slotKeys } from "../interfaces/modal-interface";

// // export type FileItem = {
// //   inputFile: File | null;
// //   progressStatus: string;
// //   tableName: string;
// //   fileName: string;
// //   fileSize: number;
// //   storedName?: string | null;
// // };

// // type FileState = {
// //   fileList: FileItem[];
// // };

// const initialState: FileState = { fileList: [] };

// const fileSlice = createSlice({
//   name: "fileUpload",
//   initialState,
//   reducers: {
//     addInputFile: (state, action: PayloadAction<{ file: File }>) => {
//       if (
//         state.fileList.find(
//           (file) => file.fileName === action.payload.file.name
//         )
//       ) {
//         console.log("file already exists");
//         return;
//       }

//       const filename = action.payload.file.name.toLowerCase();
//       const matchedCDMTable =
//         slotKeys.find((key) => filename.includes(key.toLowerCase())) ?? null;

//       if (!matchedCDMTable) {
//         console.log("file name is not matched with any slot");
//         return;
//       }

//       state.fileList.push({
//         inputFile: action.payload.file,
//         progressStatus: "idle",
//         tableName: matchedCDMTable,
//         fileName: action.payload.file.name,
//         fileSize: action.payload.file.size,
//       });
//     },
//     updateFile: (
//       state,
//       action: PayloadAction<{
//         index: number;
//         fileStoredName?: string;
//         progressStatus?: string;
//       }>
//     ) => {
//       const { index, progressStatus, fileStoredName } = action.payload;
//       if (state.fileList[index]) {
//         if (progressStatus !== undefined) {
//           state.fileList[index].progressStatus = progressStatus;
//         }
//         if (fileStoredName !== undefined) {
//           state.fileList[index].storedName = fileStoredName;
//         }
//       }
//     },
//     removeFile: (state, action: PayloadAction<{ index: number }>) => {
//       state.fileList.splice(action.payload.index, 1);
//     },
//   },
// });

// export const { addInputFile, updateFile, removeFile } = fileSlice.actions;
// export default fileSlice.reducer;
