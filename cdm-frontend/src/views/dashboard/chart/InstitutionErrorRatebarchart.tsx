import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/* ===============================
   타입
================================ */
type ErrStat = {
  instName: string;
  errRt: number; // 0.1254 같은 비율값(0~1)일 수도 있음
};

type Props = {
  data: ErrStat[];
  onSelectInstitution?: (institutionName: string) => void;
};

/* ===============================
   병원명 축약
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
export default function InstitutionErrorRateBarChart({ data, onSelectInstitution }: Readonly<Props>) {
  // 🔥 서버 errRt가 0~1 비율이면 %로 변환, 이미 0~100이면 그대로 사용
  const chartData = data.map((r) => {
    const raw = Number(r.errRt ?? 0);
    const percent = raw <= 1 ? raw * 100 : raw; // 핵심: 스케일 자동 대응

    return {
      fullName: r.instName,
      shortName: shortenHospitalName(r.instName),
      errorRate: Math.round(percent * 100) / 100, // 소수 2자리
    };
  });

  // 🔥 데이터 개수에 맞춰 높이 자동 확장 (라벨 안 잘리게)
  const rowH = 28; // 한 줄 높이
  const chartHeight = Math.max(320, chartData.length * rowH + 60);

  return (
    <div className="w-full bg-white border-y border-slate-300 p-4">
      <div className="font-semibold text-gray-800 mb-2 mt-2">기관별 오류율</div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }} barCategoryGap={6}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />

          <YAxis type="category" dataKey="shortName" width={110} tick={{ fontSize: 11 }} interval={0} minTickGap={0} />

          <Tooltip formatter={(value, name, props: any) => [`${Number(value).toFixed(2)}%`, props.payload.fullName]} />

          <Bar
            dataKey="errorRate"
            radius={[6, 6, 6, 6]}
            fill="#2b8cff"
            isAnimationActive={false}
            onClick={(data, index) => {
              // data here is the value of each bar, use chartData[index] for full object if needed
              if (onSelectInstitution && chartData[index]?.fullName) {
                onSelectInstitution(chartData[index].fullName);
              }
            }}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
