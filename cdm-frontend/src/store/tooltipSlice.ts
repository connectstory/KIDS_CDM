import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import type { TooltipId } from "@/constants/tooltip";
import { TOOLTIP_CONTENT, TOOLTIP_IDS } from "@/constants/tooltip";

interface TooltipSliceState {
  visibility: Record<TooltipId, boolean>;
}

export const initialTooltipState: TooltipSliceState = {
  visibility: (Object.values(TOOLTIP_IDS) as TooltipId[]).reduce(
    (acc, id) => {
      acc[id] = false;
      return acc;
    },
    {} as Record<TooltipId, boolean>
  ),
};

const tooltipSlice = createSlice({
  name: "tooltip",
  initialState: initialTooltipState,
  reducers: {
    setTooltipVisible: (state, action: PayloadAction<{ id: TooltipId; visible: boolean }>) => {
      const { id, visible } = action.payload;
      state.visibility[id] = visible;
    },
    resetTooltips: () => initialTooltipState,
  },
});

export const { setTooltipVisible, resetTooltips } = tooltipSlice.actions;

export default tooltipSlice.reducer;

/** 툴팁 visible 여부 (id별) */
export const selectTooltipVisible = (id: TooltipId) => (state: { tooltip: TooltipSliceState }) =>
  state.tooltip.visibility[id] ?? false;

/** 툴팁 표시용 { visible, content } (content는 상수에서 조회) */
export const selectTooltipState = (id: TooltipId) => (state: { tooltip: TooltipSliceState }) => ({
  visible: state.tooltip.visibility[id] ?? false,
  content: TOOLTIP_CONTENT[id] ?? "",
});
