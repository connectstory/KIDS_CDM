import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ===============================
   타입
================================ */
type InstitutionStat = {
  instName: string;
  uldNocs: number;
};

type Props = {
  data: InstitutionStat[];
};

/* ===============================
   병원명 축약 유틸
================================ */
function shortenHospitalName(name: string) {
  if (!name) return "";

  return name
    .replace("가톨릭대학교 ", "")
    .replace("대학교병원", "")
    .replace("대학교 ", "")
    .replace("병원", "")
    .replace("의료원", "")
    .trim();
}

/* ===============================
   컴포넌트
================================ */
export default function InstitutionVolumeChart({ data }: Readonly<Props>) {
  // Recharts용 데이터 가공
  const chartData = data.map((r) => ({
    fullName: r.instName,                 // Tooltip에 표시할 전체명
    shortName: shortenHospitalName(r.instName), // X축에 표시할 짧은 이름
    value: r.uldNocs,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
        >
          <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />

          <XAxis
            dataKey="shortName"
            interval="preserveStartEnd"
            tick={{ fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            height={60}
          />

          <YAxis
            domain={[0, (max: number) => Math.ceil((max * 1.2) / 10000) * 10000]}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => v.toLocaleString()}
          />

          <Tooltip
            formatter={(value, name, props: any) => [
              `${Number(value).toLocaleString()} 건`,
              props.payload.fullName,
            ]}
          />

          <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#5c6bc0" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
