import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type ErrStat = {
  instName: string;
  errRt: number;
  errNocs: number;
  uldNocs: number;
};

type Props = {
  data: ErrStat[];
  selectedInstitution?: string | null;
};

const COLORS = ["#6ab04c", "#e24a3b"];

function calcErrorRate(data: ErrStat[], selectedInstitution?: string | null): number {
  if (selectedInstitution) {
    const selected = data.find((r) => r.instName === selectedInstitution);
    if (!selected) return 0;
    return Math.round(Number(selected.errRt ?? 0));
  }
  if (data.length === 0) return 0;
  const totalUld = data.reduce((sum, r) => sum + Number(r.uldNocs), 0);
  const totalErr = data.reduce((sum, r) => sum + Number(r.errNocs), 0);
  if (totalUld === 0) return 0;
  return Math.round((totalErr * 100) / totalUld);
}

export default function InstitutionErrorRateDonutChart({
  data,
  selectedInstitution,
}: Readonly<Props>) {
  const displayErrorRate = calcErrorRate(data, selectedInstitution);

  const chartData = [
    { name: "정상", value: Math.max(0, 100 - displayErrorRate), fill: COLORS[0] },
    { name: "Critical", value: displayErrorRate, fill: COLORS[1] },
  ];

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
          />


          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toFixed(1)}%`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 중앙 텍스트 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-red-500">
            {displayErrorRate}%
          </span>
          <span className="text-sm text-gray-600 mt-1">Critical</span>
        </div>
      </div>
    </div>
  );
}