import { useCallback, useMemo, useState } from "react";
import { DisclosureAPI } from "@/api";
import { Helmet } from "react-helmet";

/* ─── 타입 ─── */
interface PlotRow {
  label: string;
  cnt: number;
}

type PlotType = "pie" | "bar" | "line" | "number";

interface RuleDef {
  id: number;
  description: string;
  plotType: PlotType;
  domain: string;
  needsConceptId: boolean;
}

interface ApiPlotRow {
  label?: string | number | null;
  cnt?: string | number | null;
}

/* ─── 도메인 정의 ─── */
const OMOP_DOMAINS = [
  { value: "person", label: "환자정보 (person)" },
  { value: "visit_occurrence", label: "방문정보 (visit_occurrence)" },
  { value: "condition_occurrence", label: "진단정보 (condition_occurrence)" },
  { value: "drug_exposure", label: "약물정보 (drug_exposure)" },
  { value: "procedure_occurrence", label: "처치/수술 (procedure_occurrence)" },
  { value: "measurement", label: "검사정보 (measurement)" },
  { value: "observation", label: "관찰정보 (observation)" },
  { value: "death", label: "사망정보 (death)" },
  { value: "observation_period", label: "관찰기간 (observation_period)" },
];

/* ─── 32개 규칙 정의 (엑셀 Plot list 시트 기반) ─── */
const RULES: RuleDef[] = [
  { id: 1, description: "전체 환자 수", plotType: "number", domain: "person", needsConceptId: false },
  { id: 2, description: "성별 분포", plotType: "pie", domain: "person", needsConceptId: false },
  { id: 3, description: "연령 분포", plotType: "bar", domain: "person", needsConceptId: false },
  { id: 4, description: "시계열 방문 환자 분포", plotType: "line", domain: "visit_occurrence", needsConceptId: false },
  { id: 5, description: "방문 유형별 환자 수", plotType: "pie", domain: "visit_occurrence", needsConceptId: false },
  { id: 6, description: "특정 진단 환자의 성별 분포", plotType: "pie", domain: "condition_occurrence", needsConceptId: true },
  { id: 7, description: "특정 진단 환자의 연령 분포", plotType: "bar", domain: "condition_occurrence", needsConceptId: true },
  { id: 8, description: "특정 진단 환자의 시계열 방문 환자 분포", plotType: "line", domain: "condition_occurrence", needsConceptId: true },
  { id: 9, description: "특정 진단 환자의 방문 유형별 환자 수", plotType: "pie", domain: "condition_occurrence", needsConceptId: true },
  { id: 10, description: "특정 약물 환자의 성별 분포", plotType: "pie", domain: "drug_exposure", needsConceptId: true },
  { id: 11, description: "특정 약물 환자의 연령 분포", plotType: "bar", domain: "drug_exposure", needsConceptId: true },
  { id: 12, description: "특정 약물 환자의 시계열 방문 환자 분포", plotType: "line", domain: "drug_exposure", needsConceptId: true },
  { id: 13, description: "특정 약물 환자의 방문 유형별 환자 수", plotType: "pie", domain: "drug_exposure", needsConceptId: true },
  { id: 14, description: "특정 처치/수술 환자의 성별 분포", plotType: "pie", domain: "procedure_occurrence", needsConceptId: true },
  { id: 15, description: "특정 처치/수술 환자의 연령 분포", plotType: "bar", domain: "procedure_occurrence", needsConceptId: true },
  { id: 16, description: "특정 처치/수술 환자의 시계열 방문 분포", plotType: "line", domain: "procedure_occurrence", needsConceptId: true },
  { id: 17, description: "특정 처치/수술 환자의 방문 유형별 환자 수", plotType: "pie", domain: "procedure_occurrence", needsConceptId: true },
  { id: 18, description: "특정 검사 환자의 성별 분포", plotType: "pie", domain: "measurement", needsConceptId: true },
  { id: 19, description: "특정 검사 환자의 연령 분포", plotType: "bar", domain: "measurement", needsConceptId: true },
  { id: 20, description: "특정 검사 환자의 시계열 방문 환자 분포", plotType: "line", domain: "measurement", needsConceptId: true },
  { id: 21, description: "특정 검사 환자의 방문 유형별 환자 수", plotType: "pie", domain: "measurement", needsConceptId: true },
  { id: 22, description: "특정 관찰 환자의 성별 분포", plotType: "pie", domain: "observation", needsConceptId: true },
  { id: 23, description: "특정 관찰 환자의 연령 분포", plotType: "bar", domain: "observation", needsConceptId: true },
  { id: 24, description: "특정 관찰 환자의 시계열 방문 환자 분포", plotType: "line", domain: "observation", needsConceptId: true },
  { id: 25, description: "특정 관찰 환자의 방문 유형별 환자 수", plotType: "pie", domain: "observation", needsConceptId: true },
  { id: 26, description: "사망 환자 수", plotType: "number", domain: "death", needsConceptId: false },
  { id: 27, description: "사망 환자 성별 분포", plotType: "pie", domain: "death", needsConceptId: false },
  { id: 28, description: "사망 환자 연령 분포", plotType: "bar", domain: "death", needsConceptId: false },
  { id: 29, description: "사망 연도별 환자 수", plotType: "bar", domain: "death", needsConceptId: false },
  { id: 30, description: "관찰기간 등록 환자 수", plotType: "number", domain: "observation_period", needsConceptId: false },
  { id: 31, description: "관찰기간 연도별 분포", plotType: "bar", domain: "observation_period", needsConceptId: false },
  { id: 32, description: "평균 관찰기간 (연도별)", plotType: "bar", domain: "observation_period", needsConceptId: false },
];

/* ─── 색상 팔레트 ─── */
const COLORS = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2",
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7",
  "#9c755f", "#bab0ac", "#6f97dc", "#6ec1e4",
];

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

/* ─────────── SVG Pie ─────────── */
function SvgPie({ data }: Readonly<{ data: PlotRow[] }>) {
  const total = data.reduce((s, d) => s + d.cnt, 0) || 1;
  const cx = 160, cy = 160, r = 120;
  const circ = 2 * Math.PI * r;

  // offset을 누적하기 위해 reduce 사용 (map 안에서 외부 변수 mutation 방지)
  const slices = data.reduce<{ item: PlotRow; dash: number; offset: number; index: number }[]>((acc, item, index) => {
    const last = acc.at(-1);
    const prevOffset = last ? last.offset + last.dash : 0;
    acc.push({ item, dash: (item.cnt / total) * circ, offset: prevOffset, index });
    return acc;
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={320} height={320} viewBox="0 0 320 320">
        {slices.map(({ item, dash, offset, index }) => (
          <circle
            key={`pie-${item.label}`}
            r={r}
            cx={cx}
            cy={cy}
            fill="none"
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={80}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8 }}>
        {data.map((d, index) => (
          <span key={`legend-${d.label}`} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: COLORS[index % COLORS.length],
                display: "inline-block",
              }}
            />
            {d.label} {((d.cnt / total) * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────── SVG Bar ─────────── */
function SvgBar({ data }: Readonly<{ data: PlotRow[] }>) {
  const maxVal = Math.max(...data.map((d) => d.cnt), 1);
  const W = 600, H = 300, L = 60, R = 580, T = 20, B = 260;
  const chartH = B - T;
  const barW = Math.min(40, (R - L - 10) / (data.length || 1) - 6);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <line x1={L} y1={B} x2={R} y2={B} stroke="#ccc" />
      <line x1={L} y1={T} x2={L} y2={B} stroke="#ccc" />
      {data.map((d, index) => {
        const x = L + 10 + index * ((R - L - 10) / data.length);
        const h = (d.cnt / maxVal) * chartH;
        return (
          <g key={`bar-${d.label}`}>
            <rect x={x} y={B - h} width={barW} height={Math.max(h, 0)} fill={COLORS[index % COLORS.length]} rx={2} />
            {d.cnt > 0 && (
              <text x={x + barW / 2} y={B - h - 5} textAnchor="middle" fontSize={10} fill="#333">
                {fmt(d.cnt)}
              </text>
            )}
            <text x={x + barW / 2} y={B + 16} textAnchor="middle" fontSize={9} fill="#555">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────── SVG Line ─────────── */
function SvgLine({ data }: Readonly<{ data: PlotRow[] }>) {
  if (data.length === 0) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>데이터 없음</div>;
  const maxVal = Math.max(...data.map((d) => d.cnt), 1);
  const W = 600, H = 300, L = 60, R = 580, T = 30, B = 250;
  const chartH = B - T;
  const step = (R - L) / Math.max(data.length - 1, 1);
  const labelStep = Math.max(1, Math.ceil(data.length / 12));

  const points = data.map((d, index) => ({
    x: L + index * step,
    y: B - (d.cnt / maxVal) * chartH,
    label: d.label,
    index,
  }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" height={H + 30} viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: "visible" }}>
      <line x1={L} y1={B} x2={R} y2={B} stroke="#ccc" />
      <line x1={L} y1={T} x2={L} y2={B} stroke="#ccc" />
      <polyline fill="none" stroke="#4e79a7" strokeWidth={2} points={polyline} />
      {points.map((p) => (
        <g key={`line-${p.label}`}>
          <circle cx={p.x} cy={p.y} r={3} fill="#4e79a7" />
          {p.index % labelStep === 0 && (
            <text x={p.x} y={B + 16} textAnchor="middle" fontSize={9} fill="#555" transform={`rotate(30 ${p.x} ${B + 16})`}>
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ─────────── 결과 영역 ─────────── */
function PlotResult({
  plotType,
  plotData,
  totalCount,
  loading,
  currentRule,
  grandTotal,
}: Readonly<{
  plotType: PlotType | null;
  plotData: PlotRow[];
  totalCount: number | null;
  loading: boolean;
  currentRule: RuleDef | undefined;
  grandTotal: number;
}>) {
  if (plotType === "number" && totalCount !== null) {
    return (
      <div className="content" style={{ gridTemplateColumns: "1fr" }}>
        <div className="number-display">
          {fmt(totalCount)} <span>명</span>
          <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>{currentRule?.description}</div>
        </div>
      </div>
    );
  }

  if (plotData.length > 0) {
    return (
      <div className="content">
        <div className="chart-area">
          {plotType === "pie" && <SvgPie data={plotData} />}
          {plotType === "bar" && <SvgBar data={plotData} />}
          {plotType === "line" && <SvgLine data={plotData} />}
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>{plotType === "bar" || plotType === "line" ? "구간" : "항목"}</th>
                <th>건수</th>
                <th>비율</th>
              </tr>
            </thead>
            <tbody>
              {plotData.map((d, index) => (
                <tr key={`row-${d.label}`}>
                  <td>{index + 1}</td>
                  <td style={{ textAlign: "left", paddingLeft: 8 }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        background: COLORS[index % COLORS.length],
                        borderRadius: 2,
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                    {d.label}
                  </td>
                  <td>{fmt(d.cnt)}</td>
                  <td>{grandTotal > 0 ? ((d.cnt / grandTotal) * 100).toFixed(1) : "0.0"}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>총계</td>
                <td>{fmt(grandTotal)}</td>
                <td>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="content" style={{ gridTemplateColumns: "1fr" }}>
      <div className="empty">{loading ? "데이터를 불러오는 중..." : "검색 버튼을 클릭하면 결과가 표시됩니다."}</div>
    </div>
  );
}

/* ────────────── 메인 컴포넌트 ────────────── */
export default function UploadSummaryReportPie() {
  const [cdmType, setCdmType] = useState<"OMOP" | "Sentinel">("OMOP");
  const [selectedDomain, setSelectedDomain] = useState<string>("person");
  const [selectedRuleId, setSelectedRuleId] = useState<number>(1);
  const [conceptIdInput, setConceptIdInput] = useState<string>("");
  const [minLevels] = useState<string>("");
  const [includeDescendant, setIncludeDescendant] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [plotType, setPlotType] = useState<PlotType | null>(null);
  const [plotData, setPlotData] = useState<PlotRow[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const domainRules = useMemo(() => RULES.filter((r) => r.domain === selectedDomain), [selectedDomain]);
  const currentRule = useMemo(() => RULES.find((r) => r.id === selectedRuleId), [selectedRuleId]);

  const handleDomainChange = useCallback((domain: string) => {
    setSelectedDomain(domain);
    const first = RULES.find((r) => r.domain === domain);
    if (first) setSelectedRuleId(first.id);
    setPlotData([]);
    setPlotType(null);
    setTotalCount(null);
    setErrorMsg("");
  }, []);

  const handleSearch = useCallback(async () => {
    if (!currentRule) return;
    if (currentRule.needsConceptId && !conceptIdInput.trim()) {
      setErrorMsg("ConceptId를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setPlotData([]);
    setTotalCount(null);

    try {
      const conceptId = currentRule.needsConceptId ? Number(conceptIdInput) : null;
      const minLevelsNum = minLevels.trim() ? Number(minLevels) : null;
      const res = await DisclosureAPI.getPlotData(selectedRuleId, null, conceptId, includeDescendant, minLevelsNum);
      const body = res?.data?.data;

      if (!body) {
        setErrorMsg("응답 데이터가 없습니다.");
        return;
      }

      setPlotType(body.plotType as PlotType);

      if (body.plotType === "number") {
        setTotalCount(body.totalCount ?? 0);
        setPlotData([]);
      } else {
        const rows: PlotRow[] = (body.data || []).map((r: ApiPlotRow) => ({
          label: String(r.label ?? ""),
          cnt: Number(r.cnt ?? 0),
        }));
        setPlotData(rows);
        setTotalCount(null);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(err?.response?.data?.message ?? err?.message ?? "조회 실패");
    } finally {
      setLoading(false);
    }
  }, [selectedRuleId, conceptIdInput, includeDescendant, minLevels, currentRule]);

  const grandTotal = useMemo(() => plotData.reduce((s, d) => s + d.cnt, 0), [plotData]);

  return (
    <>
      <Helmet>
        <title>CDM - CDM 통계</title>
      </Helmet>
      <style>{`
.plot-report { font-family: 'Pretendard', Arial, sans-serif; color: #333; }
.plot-report h2 { margin: 0 0 4px; font-size: 20px; }
.plot-report .desc { font-size: 13px; color: #777; margin-bottom: 16px; }
.plot-report .filter-form { width: 100%; border: 1px solid #ddd; margin-bottom: 20px; font-size: 13px; }
.plot-report .filter-row { display: flex; border-bottom: 1px solid #eee; }
.plot-report .filter-row:last-child { border-bottom: none; }
.plot-report .filter-cell { padding: 8px 12px; border-right: 1px solid #eee; }
.plot-report .filter-cell:last-child { border-right: none; }
.plot-report .filter-label { background: #f2f2f2; font-weight: 600; width: 140px; min-width: 140px; white-space: nowrap; display: flex; align-items: center; }
.plot-report .filter-value { flex: 1; display: flex; align-items: center; }
.plot-report .filter-form select { padding: 5px 8px; border: 1px solid #bbb; border-radius: 4px; font-size: 13px; min-width: 200px; }
.plot-report .filter-form input[type="text"] { padding: 5px 8px; border: 1px solid #bbb; border-radius: 4px; font-size: 13px; width: 200px; }
.plot-report .radio-group { display: flex; gap: 12px; align-items: center; font-size: 13px; }
.plot-report .search-btn { padding: 6px 18px; border: none; background: #555; color: #fff; border-radius: 4px; cursor: pointer; font-size: 13px; }
.plot-report .search-btn:hover { background: #333; }
.plot-report .search-btn:disabled { background: #aaa; cursor: not-allowed; }
.plot-report .content { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; border: 1px solid #ddd; border-radius: 6px; padding: 20px; background: #fff; }
.plot-report .chart-area { min-height: 300px; display: flex; align-items: center; justify-content: center; }
.plot-report .data-table { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
.plot-report .data-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
.plot-report .data-table th, .plot-report .data-table td { border: 1px solid #eee; padding: 7px 10px; text-align: center; }
.plot-report .data-table th { background: #f5f6f8; font-weight: 600; }
.plot-report .data-table tfoot td { font-weight: 700; background: #f9f9fb; }
.plot-report .number-display { font-size: 48px; font-weight: 700; color: #4e79a7; text-align: center; padding: 40px 0; }
.plot-report .number-display span { font-size: 16px; color: #888; font-weight: 400; }
.plot-report .empty { display: flex; align-items: center; justify-content: center; height: 200px; color: #999; font-size: 14px; }
.plot-report .error { color: #e15759; font-size: 13px; margin: 8px 0; }
      `}</style>

      <div className="plot-report">
        <h2>CDM 통계정보</h2>
        <p className="desc">각 통계정보에 맞는 통계 분포 정보입니다.</p>

        {/* ── 검색 필터 ── */}
        <div className="filter-form">
          <div className="filter-row">
            <span className="filter-cell filter-label">CDM</span>
            <span className="filter-cell filter-value">
              <select value={cdmType} onChange={(e) => setCdmType(e.target.value as "OMOP" | "Sentinel")}>
                <option value="OMOP">OMOP</option>
                <option value="Sentinel">Sentinel</option>
              </select>
            </span>
            <span className="filter-cell filter-label">통계 구분</span>
            <span className="filter-cell filter-value">
              <select value={selectedDomain} onChange={(e) => handleDomainChange(e.target.value)}>
                {OMOP_DOMAINS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </span>
          </div>
          <div className="filter-row">
            <span className="filter-cell filter-label">Description</span>
            <span className="filter-cell filter-value">
              <select
                value={selectedRuleId}
                onChange={(e) => {
                  setSelectedRuleId(Number(e.target.value));
                  setPlotData([]);
                  setPlotType(null);
                  setTotalCount(null);
                  setErrorMsg("");
                }}
              >
                {domainRules.map((r) => (
                  <option key={r.id} value={r.id}>{r.description}</option>
                ))}
              </select>
            </span>
            <span className="filter-cell filter-label">ConceptId / code</span>
            <span className="filter-cell filter-value">
              <input
                type="text"
                value={conceptIdInput}
                onChange={(e) => setConceptIdInput(e.target.value)}
                placeholder={currentRule?.needsConceptId ? "ConceptId 입력" : "해당 없음"}
                disabled={!currentRule?.needsConceptId}
                style={{ opacity: currentRule?.needsConceptId ? 1 : 0.5 }}
              />
            </span>
          </div>
          <div className="filter-row">
            <span className="filter-cell filter-label">Descendant 포함</span>
            <span className="filter-cell filter-value" style={{ flex: 3 }}>
              <div className="radio-group">
                <label>
                  <input type="radio" name="desc" checked={includeDescendant} onChange={() => setIncludeDescendant(true)} /> 예
                </label>
                <label>
                  <input type="radio" name="desc" checked={!includeDescendant} onChange={() => setIncludeDescendant(false)} /> 아니요
                </label>
              </div>
            </span>
          </div>
          <div className="filter-row">
            <span className="filter-cell filter-value" style={{ flex: 1, justifyContent: "flex-end" }}>
              <button className="search-btn" onClick={handleSearch} disabled={loading}>
                {loading ? "조회중..." : "검색"}
              </button>
            </span>
          </div>
        </div>

        {errorMsg && <div className="error">{errorMsg}</div>}

        <PlotResult
          plotType={plotType}
          plotData={plotData}
          totalCount={totalCount}
          loading={loading}
          currentRule={currentRule}
          grandTotal={grandTotal}
        />
      </div>
    </>
  );
}
