export {};

declare module "@mui/material/styles" {
  interface Palette {
    research: {
      voteApprove: string;
      votePending: string;
      voteNeutral: string;
      voteReject: string;
      voteDanger: string;
      /** 상태 칩 배경·보조색 (`utils/common` CHIP_COLORS와 동기) */
      chipApproveBg: string;
      chipRejectBg: string;
      chipNeutralBg: string;
      chipPendingBg: string;
      chipModifyBg: string;
      chipModifyText: string;
      chipProgressBg: string;
      chipProgressText: string;
      chipRegisteredBg: string;
      chipRegisteredText: string;
    };
  }
  interface PaletteOptions {
    research?: Partial<Palette["research"]>;
  }
}
