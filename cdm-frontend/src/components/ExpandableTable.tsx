import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
    Box,
    Collapse,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import * as React from "react";

export type ExpandableColumn<T> = {
  /** 헤더 라벨 */
  header: React.ReactNode;
  /** 셀 렌더 */
  render: (row: T) => React.ReactNode;
  /** 정렬/폭/스타일 */
  align?: "left" | "center" | "right";
  width?: number | string;
  sx?: any;
};

type ExpandableTableProps<T> = {
  rows: T[];
  /** row 고유키 */
  getRowId: (row: T) => string | number;

  columns: ExpandableColumn<T>[];

  /** 확장 영역 렌더 (row 아래에 나타날 UI) */
  renderExpanded: (row: T) => React.ReactNode;

  /** true면 한 번에 하나만 확장 */
  singleExpand?: boolean;

  /** 아이콘 컬럼 숨기고 row 전체 클릭만으로 토글할지 */
  hideToggleIcon?: boolean;

  /** 확장된 상태 제어형으로 쓰고 싶을 때 */
  expandedIds?: Array<string | number>;
  onExpandedIdsChange?: (ids: Array<string | number>) => void;

  /** row 클릭 시 토글 활성/비활성 */
  enableRowClickToggle?: boolean;

  /** 테이블 상단 제목 등 */
  title?: React.ReactNode;
  size?: "small" | "medium";
};

export function ExpandableTable<T>({
  rows,
  getRowId,
  columns,
  renderExpanded,
  singleExpand = true,
  hideToggleIcon = false,
  expandedIds,
  onExpandedIdsChange,
  enableRowClickToggle = true,
  title,
  size = "small",
}: ExpandableTableProps<T>) {
  const isControlled = expandedIds !== undefined && onExpandedIdsChange !== undefined;

  const [internalExpanded, setInternalExpanded] = React.useState<Array<string | number>>(
    []
  );

  const currentExpanded = isControlled ? expandedIds! : internalExpanded;

  const setExpanded = React.useCallback(
    (next: Array<string | number>) => {
      if (isControlled) onExpandedIdsChange!(next);
      else setInternalExpanded(next);
    },
    [isControlled, onExpandedIdsChange]
  );

  const toggle = React.useCallback(
    (id: string | number) => {
      const opened = currentExpanded.includes(id);

      if (opened) {
        setExpanded(currentExpanded.filter((x) => x !== id));
      } else {
        setExpanded(singleExpand ? [id] : [...currentExpanded, id]);
      }
    },
    [currentExpanded, setExpanded, singleExpand]
  );

  const colSpan = columns.length + (hideToggleIcon ? 0 : 1);

  return (
    <Box sx={{ border: "1px solid", borderColor: "divider" }}>
      {title ? (
        <Box px={2} py={1.5} borderBottom="1px solid" borderColor="divider">
          {typeof title === "string" ? (
            <Typography fontWeight={700}>{title}</Typography>
          ) : (
            title
          )}
        </Box>
      ) : null}

      <TableContainer>
        <Table size={size}>
          <TableHead>
            <TableRow>
              {!hideToggleIcon && <TableCell width={48} />}
              {columns.map((c, idx) => (
                <TableCell
                  key={idx}
                  align={c.align}
                  sx={c.sx}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const id = getRowId(row);
              const open = currentExpanded.includes(id);

              return (
                <React.Fragment key={String(id)}>
                  {/* 메인 row */}
                  <TableRow
                    hover
                    sx={{ cursor: enableRowClickToggle ? "pointer" : "default" }}
                    onClick={() => {
                      if (enableRowClickToggle) toggle(id);
                    }}
                  >
                    {!hideToggleIcon && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          
                          onClick={() => toggle(id)}
                          aria-label="expand row"
                        >
                          {open ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
                        </IconButton>
                      </TableCell>
                    )}

                    {columns.map((c, idx) => (
                      <TableCell key={idx} align={c.align} sx={c.sx}>
                        {c.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* 확장 row (바로 아래) */}
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={colSpan}
                    >
                      <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box px={2} py={2}>
                          {renderExpanded(row)}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
