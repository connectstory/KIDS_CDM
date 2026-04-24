/**
 * constants/tooltip.ts 툴팁이 적용된 곳에서 공통 사용하는 툴팁 컴포넌트.
 * - 툴팁 문구 클릭 시 닫힘
 * - 자식(버튼 등) 클릭 시에도 닫힘
 */
import { Tooltip, type TooltipProps } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import type { TooltipId } from "@/constants/tooltip";
import type { RootState } from "@/store";
import { selectTooltipState, setTooltipVisible } from "@/store/tooltipSlice";

export interface ClickableStateTooltipProps extends Omit<TooltipProps, "title" | "open"> {
  /** 툴팁 ID (상태 조회 및 닫을 때 사용) */
  tooltipId: TooltipId;
  /** 클릭 시 닫을 ID 목록 (복수 툴팁 조합 시 사용, 미지정 시 tooltipId만 닫음) */
  tooltipIdsToCloseOnClick?: TooltipId[];
  /** open 오버라이드 (복수 ID 조합 시 상위에서 visible 전달) */
  open?: boolean;
  /** title 오버라이드 (복수 ID 조합 시 상위에서 content 전달) */
  title?: React.ReactNode;
}

export default function ClickableStateTooltip({
  tooltipId,
  tooltipIdsToCloseOnClick,
  open: openOverride,
  title: titleOverride,
  children,
  ...tooltipProps
}: ClickableStateTooltipProps) {
  const dispatch = useDispatch();
  const state = useSelector((s: RootState) => selectTooltipState(tooltipId)(s));
  const open = openOverride ?? state.visible;
  const content = titleOverride ?? state.content;

  const handleClose = () => {
    const idsToClose = tooltipIdsToCloseOnClick ?? [tooltipId];
    idsToClose.forEach((id) => dispatch(setTooltipVisible({ id, visible: false })));
  };

  const titleNode = (
    <span
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={handleClose}
      onKeyDown={(e) => e.key === "Enter" && handleClose()}
    >
      {content}
    </span>
  );

  return (
    <Tooltip
      title={titleNode}
      open={open}
      disableHoverListener={open}
      disableFocusListener={open}
      {...tooltipProps}
    >
      <span onClick={handleClose}>{children}</span>
    </Tooltip>
  );
}
