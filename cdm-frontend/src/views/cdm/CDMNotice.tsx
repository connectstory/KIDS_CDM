import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";

type CatalogRow = {
  id: number;
  columnName: string;
  dataType: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey: boolean;
  note: string;
  selected: boolean;
};

const DATA_TYPES = ["INTEGER", "BIGINT", "NUMERIC", "FLOAT", "BOOLEAN", "VARCHAR", "TEXT", "DATE", "TIMESTAMP"];

export default function CDMUploadNotice() {
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([
    {
      id: 1,
      columnName: "",
      dataType: "",
      nullable: false,
      primaryKey: false,
      foreignKey: false,
      note: "",
      selected: false,
    },
    {
      id: 2,
      columnName: "",
      dataType: "",
      nullable: false,
      primaryKey: false,
      foreignKey: false,
      note: "",
      selected: false,
    },
  ]);

  const nextId = useMemo(() => Math.max(0, ...catalogRows.map((r) => r.id)) + 1, [catalogRows]);

  const addRow = () => {
    setCatalogRows((rows) => [
      ...rows,
      {
        id: nextId,
        columnName: "",
        dataType: "",
        nullable: false,
        primaryKey: false,
        foreignKey: false,
        note: "",
        selected: false,
      },
    ]);
  };

  const removeSelected = () => {
    setCatalogRows((rows) => rows.filter((r) => !r.selected));
  };

  const updateRow = <K extends keyof CatalogRow>(id: number, key: K, value: CatalogRow[K]) => {
    setCatalogRows((rows) => rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3">
      <div className="w-[120px] text-gray-600">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="text-lg font-semibold mt-8 mb-3 text-black">{title}</div>
  );

  const GroupTitle = ({ title }: { title: string }) => <div className="font-semibold text-gray-800 mt-4 mb-2">{title}</div>;

  const BorderCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-white border border-gray-200 rounded-md p-4">{children}</div>
  );

  return (
    <div>
      <div className="text-2xl font-bold">CDM 업로드 공시</div>
      <div className="text-gray-600 mt-1">협력기관에서 업로드한 CDM 데이터 규격 및 관련정보입니다.</div>

      {/* CDM 현황정보 */}
      <SectionTitle title="CDM 현황정보" />
      <BorderCard>
        <div className="grid grid-cols-2 gap-6">
          <Field label="CDM 버전">
            <input className="w-full border border-gray-300 rounded px-2 py-1" />
          </Field>
          <Field label="최종 업데이트">
            <input type="date" className="w-full border border-gray-300 rounded px-2 py-1" />
          </Field>
          <Field label="업데이트 주기">
            <input className="w-full border border-gray-300 rounded px-2 py-1" />
          </Field>
        </div>
      </BorderCard>

      {/* CDM 테이블별 기간&규모 */}
      <SectionTitle title="CDM 테이블별 기간&규모" />
      <BorderCard>
        <GroupTitle title="Sentinel" />
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <RowBlock title="Demographic" left />
            <RowBlock title="Enrollment" left />
            <RowBlock title="Dispensing" left />
            <RowBlock title="Encounter" left />
          </div>
          <div className="space-y-3">
            <RowBlock title="최초 방문일" />
            <RowBlock title="최종 방문일" />
            <RowBlock title="최초 약물처방일" />
            <RowBlock title="방문 종료일" />
          </div>
        </div>

        <GroupTitle title="OMOP" />
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <RowBlock title="person" left />
            <RowBlock title="observation_period" left />
            <RowBlock title="drug_exposure" left />
            <RowBlock title="visit_occurrence" left />
          </div>
          <div className="space-y-3">
            <RowBlock title="최초 방문일" />
            <RowBlock title="관찰 종료일자" />
            <RowBlock title="약물 종료일" />
            <RowBlock title="방문 종료일" />
          </div>
        </div>
      </BorderCard>

      {/* CDM 카탈로그 */}
      <SectionTitle title="CDM 카탈로그" />
      <BorderCard>
        <div className="flex justify-between mb-2">
          <div className="text-sm text-gray-600 self-center">테이블 컬럼 정의를 입력하세요.</div>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white" onClick={addRow}>
              행추가
            </button>
            <button className="bg-gray-100 border border-gray-300" onClick={removeSelected}>
              선택 삭제
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="[&>th]:border [&>th]:border-gray-200 [&>th]:bg-gray-50 [&>th]:px-2 [&>th]:py-2 text-left">
                <th style={{ width: 60 }}>번호</th>
                <th>컬럼명</th>
                <th style={{ width: 160 }}>데이터 타입</th>
                <th style={{ width: 90 }}>Null 여부</th>
                <th style={{ width: 90 }}>PK 여부</th>
                <th style={{ width: 90 }}>FK 여부</th>
                <th>비고</th>
                <th style={{ width: 70 }}>선택</th>
              </tr>
            </thead>
            <tbody>
              {catalogRows.map((row, idx) => (
                <tr key={row.id} className="[&>td]:border [&>td]:border-gray-200 [&>td]:px-2 [&>td]:py-2 bg-white">
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      value={row.columnName}
                      onChange={(e) => updateRow(row.id, "columnName", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      placeholder="컬럼명"
                    />
                  </td>
                  <td>
                    <select
                      value={row.dataType}
                      onChange={(e) => updateRow(row.id, "dataType", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">선택</option>
                      {DATA_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.nullable}
                      onChange={(e) => updateRow(row.id, "nullable", e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.primaryKey}
                      onChange={(e) => updateRow(row.id, "primaryKey", e.target.checked)}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.foreignKey}
                      onChange={(e) => updateRow(row.id, "foreignKey", e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      value={row.note}
                      onChange={(e) => updateRow(row.id, "note", e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1"
                      placeholder="비고"
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={(e) => updateRow(row.id, "selected", e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="bg-gray-100 border border-gray-300">목록</button>
          <button className="bg-orange-500 text-white">저장</button>
        </div>
      </BorderCard>
    </div>
  );
}

function RowBlock({ title, left = false }: { title: string; left?: boolean }) {
  return (
    <div className="grid grid-cols-[160px_1fr_36px_1fr] items-center gap-2">
      <Helmet>
        <title>CDM - CDM 업로드 공시</title>
      </Helmet>
      <div className={`text-sm ${left ? "font-medium text-gray-800" : "text-gray-600"}`}>{title}</div>
      <input className="border border-gray-300 rounded px-2 py-1" placeholder={left ? "총 건수" : "날짜"} />
      <div className="text-center text-gray-400">~</div>
      <input className="border border-gray-300 rounded px-2 py-1" placeholder={left ? "추가 정보" : "날짜"} />
    </div>
  );
}
