import { useCallback, useMemo, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { CONTENT_GAP } from "@/constants/types";
import type { AsmtPersonResponse } from "@/interfaces/researchInterface";
import { useCreateAsmtPerson, useDeleteAsmtPerson } from "@/hooks/research/useResearchMutations";
import { useAsmtPersonEmpOptions, useAsmtPersonList } from "@/hooks/research/useResearchQueries";
import Loader from "@/components/Loader";
import { SpaceBox } from "@/components/SpaceBox";
import { AppChip } from "@/components/ui";

const DEPT_PHARM = "0000004";
const DEPT_INFO = "0000080";

function PersonSection({
  title,
  deptNo,
  persons,
  empOptions,
  assignedEmpNos,
  onCreate,
  onDelete,
  isLoadingOptions,
}: {
  title: string;
  deptNo: string;
  persons: AsmtPersonResponse[];
  empOptions: { empNo: string; empNm: string | null; deptNo: string | null }[];
  assignedEmpNos: Set<string>;
  onCreate: (personEmpNo: string) => void;
  onDelete: (personSn: number) => void;
  isLoadingOptions: boolean;
}) {
  const [selected, setSelected] = useState<string>("");

  const options = useMemo(
    () => empOptions.filter((o) => o.deptNo === deptNo && !assignedEmpNos.has(o.empNo)),
    [empOptions, deptNo, assignedEmpNos]
  );
  const chips = useMemo(() => persons.filter((p) => p.deptNo === deptNo), [persons]);

  const handleChange = useCallback(
    (value: string) => {
      if (!value) return;
      onCreate(value);
      setSelected("");
    },
    [onCreate]
  );

  return (
    <Box>
      <Box className="flex items-center justify-between flex-wrap gap-2">
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            {title}
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }} disabled={isLoadingOptions}>
          <InputLabel id={`asmt-person-select-${deptNo}`}>담당자 선택</InputLabel>
          <Select
            labelId={`asmt-person-select-${deptNo}`}
            value={selected}
            label="담당자 선택"
            onChange={(e) => handleChange(e.target.value)}
            onClose={() => setSelected("")}
          >
            <MenuItem value="">
              <em>선택하세요</em>
            </MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.empNo} value={opt.empNo}>
                {opt.empNm ? `${opt.empNm} (${opt.empNo})` : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <SpaceBox gap={CONTENT_GAP.XSMALL} />
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          minHeight: 52,
          p: 2,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "grey.100",
        }}
      >
        {chips.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            담당자를 추가해주세요, 설정한 담당자에게 알림이 전송됩니다.
          </Typography>
        ) : (
          chips.map((p) => (
            <AppChip
              key={p.personSn}
              label={`${p.empNm ? ` ${p.empNm}` : ""} (${p.empNo})`}
              onDelete={() => onDelete(p.personSn)}
              size="medium"
              variant="outlined"
            />
          ))
        )}
      </Box>
    </Box>
  );
}

export default function ContentEmailSetting() {
  const { data: persons = [], isLoading: isLoadingList, isError: isErrorList } = useAsmtPersonList();
  const { data: empOptionsPharm = [], isLoading: isLoadingPharm } = useAsmtPersonEmpOptions([DEPT_PHARM]);
  const { data: empOptionsInfo = [], isLoading: isLoadingInfo } = useAsmtPersonEmpOptions([DEPT_INFO]);
  const createMutation = useCreateAsmtPerson();
  const deleteMutation = useDeleteAsmtPerson();

  const assignedEmpNos = useMemo(() => new Set(persons.map((p) => p.empNo)), [persons]);
  const allEmpOptions = useMemo(() => [...empOptionsPharm, ...empOptionsInfo], [empOptionsPharm, empOptionsInfo]);

  const handleCreate = useCallback(
    (personEmpNo: string) => {
      createMutation.mutate({ personEmpNo });
    },
    [createMutation]
  );

  const handleDelete = useCallback(
    (personSn: number) => {
      deleteMutation.mutate({ personSn });
    },
    [deleteMutation]
  );

  if (isLoadingList) {
    return (
      <Box sx={{ position: "relative", minHeight: 400 }}>
        <Loader isLoading />
      </Box>
    );
  }

  if (isErrorList) {
    return <Box>담당자 정보를 조회할 수 없습니다.</Box>;
  }

  return (
    <Box>
      <PersonSection
        title="약물역학빅데이터 담당자 설정"
        deptNo={DEPT_INFO}
        persons={persons}
        empOptions={allEmpOptions}
        assignedEmpNos={assignedEmpNos}
        onCreate={handleCreate}
        onDelete={handleDelete}
        isLoadingOptions={isLoadingPharm}
      />

      <SpaceBox gap={CONTENT_GAP.LARGE} />

      <PersonSection
        title="정보화팀 담당자 설정"
        deptNo={DEPT_PHARM}
        persons={persons}
        empOptions={allEmpOptions}
        assignedEmpNos={assignedEmpNos}
        onCreate={handleCreate}
        onDelete={handleDelete}
        isLoadingOptions={isLoadingInfo}
      />
    </Box>
  );
}
