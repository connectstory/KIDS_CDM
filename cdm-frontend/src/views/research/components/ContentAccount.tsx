import { useCallback, useMemo } from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import { AllCommunityModule, type ColDef, type ICellRendererParams, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { CONTENT_GAP } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { AsmtAccountResponse } from "@/interfaces/researchInterface";
import { StatusMap } from "@/utils/common";
import { useDeleteAsmtAccount } from "@/hooks/research/useResearchMutations";
import { useSearchAsmtAccounts } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";

ModuleRegistry.registerModules([AllCommunityModule]);

type AccountRow = {
  sqAsmtAccountSn: number;
  asmtId: string | null;
  vdiName: string;
  vdiIp: string | null;
  vdiPort: string | null;
  vdiUse: string | null;
};

/** API vdiType: "vdi" | "db" (백엔드 user_se_cd 01/02 매핑 결과) */
function isDbType(vdiType: string): boolean {
  return vdiType === "02" || vdiType === "db";
}

function buildRowData(accounts: AsmtAccountResponse[]): {
  vdiRows: AccountRow[];
  dbRows: AccountRow[];
} {
  const vdiRows: AccountRow[] = [];
  const dbRows: AccountRow[] = [];

  accounts.forEach((a) => {
    const row: AccountRow = {
      sqAsmtAccountSn: a.sqAsmtAccountSn,
      asmtId: a.asmtId ?? null,
      vdiName: a.vdiName,
      vdiIp: a.vdiIp ?? null,
      vdiPort: a.vdiPort ?? null,
      vdiUse: a.vdiUse ?? null,
    };
    if (isDbType(a.vdiType)) {
      dbRows.push(row);
    } else {
      vdiRows.push(row);
    }
  });

  return { vdiRows, dbRows };
}

function buildAccountColDefs(
  type: "vdi" | "db",
  onEdit: (row: AccountRow) => void,
  onDelete: (row: AccountRow) => void
): ColDef<AccountRow>[] {
  const cols: ColDef<AccountRow>[] = [
    {
      headerName: "사용중인 연구과제",
      field: "asmtId",
      width: 200,
      cellStyle: {
        display: "flex",
        alignItems: "center" as const,
        textAlign: "center" as const,
      },
      cellRenderer: (p: ICellRendererParams<AccountRow>) => {
        const value = p.data?.asmtId;
        if (!value) {
          return <Chip size="small" label="미사용" sx={StatusMap.notRegistered.chipStyle} variant="outlined" />;
        }
        return value;
      },
    },
    {
      headerName: "계정명",
      field: "vdiName",
      flex: 1,
      minWidth: 200,
    },
  ];

  if (type === "vdi") {
    cols.push(
      {
        headerName: "IP",
        field: "vdiIp",
        width: 300,
      },
      {
        headerName: "Port",
        field: "vdiPort",
        width: 200,
      }
    );
  }

  cols.push({
    width: 200,
    sortable: false,
    cellStyle: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center" as const,
      textAlign: "center" as const,
    },
    cellRenderer: (p: ICellRendererParams<AccountRow>) => {
      const row = p.data;
      if (!row) return null;
      const hasAsmtSn = !!row.asmtId;
      return (
        <Box className="flex gap-0.5">
          <Button size="small" variant="outlined" onClick={() => onEdit(row)} disabled={hasAsmtSn}>
            수정
          </Button>
          <Button size="small" variant="containedGray" color="error" onClick={() => onDelete(row)} disabled={hasAsmtSn}>
            삭제
          </Button>
        </Box>
      );
    },
  });

  return cols;
}

export default function ContentAccount() {
  const asmtAccountModal = useModal(ModalNames.AsmtAccount);

  const { data: accounts = [], isLoading, isError } = useSearchAsmtAccounts();

  const deleteMutation = useDeleteAsmtAccount();

  const { vdiRows, dbRows } = useMemo(() => buildRowData(accounts), [accounts]);

  const handleAddClick = useCallback(
    (type: "vdi" | "db") => {
      asmtAccountModal.open({
        title: `${type === "vdi" ? "VDI" : "DB"} 계정 등록`,
        data: { vdiType: type, editingAccount: null },
      });
    },
    [asmtAccountModal]
  );

  const handleEditClick = useCallback(
    (row: AccountRow, type: "vdi" | "db") => {
      asmtAccountModal.open({
        title: `${type === "vdi" ? "VDI" : "DB"} 계정 수정`,
        data: { vdiType: type, editingAccount: row },
      });
    },
    [asmtAccountModal]
  );

  const handleDeleteClick = useCallback(
    (row: AccountRow) => {
      if (!window.confirm(`"${row.vdiName}" 계정을 삭제하시겠습니까?`)) return;
      deleteMutation.mutate({ sqAsmtAccountSn: row.sqAsmtAccountSn });
    },
    [deleteMutation]
  );

  const vdiColDefs = useMemo(
    () => buildAccountColDefs("vdi", (row) => handleEditClick(row, "vdi"), handleDeleteClick),
    [handleEditClick, handleDeleteClick]
  );
  const dbColDefs = useMemo(
    () => buildAccountColDefs("db", (row) => handleEditClick(row, "db"), handleDeleteClick),
    [handleEditClick, handleDeleteClick]
  );

  if (isLoading) {
    return (
      <Box sx={{ position: "relative", minHeight: 400 }}>
        <Loader isLoading />
      </Box>
    );
  }

  if (isError) {
    return <div>계정 정보를 조회할 수 없습니다.</div>;
  }

  return (
    <div>
      <Box className="">
        <Box className="flex items-center justify-between">
          <Box className="sub_path">
            <Typography className="tit" variant="h5">
              VDI 계정
            </Typography>
          </Box>
          <Box className="">
            <Button variant="contained" onClick={() => handleAddClick("vdi")}>
              VDI 계정 추가
            </Button>
          </Box>
        </Box>
        <SpaceBox gap={CONTENT_GAP.XSMALL} />
        <Box className="ag-theme-cdm w-full">
          <AgGridReact<AccountRow>
            rowData={vdiRows}
            columnDefs={vdiColDefs}
            domLayout="autoHeight"
            overlayNoRowsTemplate={'<span style="padding:8px;">등록된 VDI 계정이 없습니다.</span>'}
          />
        </Box>
      </Box>

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      <Box className="">
        <Box className="flex items-center justify-between">
          <Box className="sub_path">
            <Typography className="tit" variant="h5">
              DB 계정
            </Typography>
          </Box>
          <Box className="">
            <Button variant="contained" onClick={() => handleAddClick("db")}>
              DB 계정 추가
            </Button>
          </Box>
        </Box>
        <SpaceBox gap={CONTENT_GAP.XSMALL} />
        <Box className="ag-theme-cdm w-full">
          <AgGridReact<AccountRow>
            rowData={dbRows}
            columnDefs={dbColDefs}
            domLayout="autoHeight"
            overlayNoRowsTemplate={'<span style="padding:8px;">등록된 DB 계정이 없습니다.</span>'}
          />
        </Box>
      </Box>
    </div>
  );
}
