import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatIstDateTime, formatIstTime } from "../time";

function formatChartData(history) {
  return history.slice(0, 60).reverse().map((item, index) => {
    return {
      sequence: index + 1,
      name: formatIstTime(item.timestamp),
      fullTime: formatIstDateTime(item.timestamp),
      responseTime: item.response_time_ms ?? 0,
      status: item.is_up ? "UP" : "DOWN",
      statusCode: item.status_code,
      error: item.error_message,
    };
  });
}

function StatusDot({ cx, cy, payload }) {
  if (cx == null || cy == null) {
    return null;
  }
  const color = payload.status === "UP" ? "#059669" : "#dc2626";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#ffffff" strokeWidth={1.5} />;
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-time">{data.fullTime}</p>
        <p className="tooltip-latency">
          Status: <span style={{ color: data.status === "UP" ? "#10b981" : "#f43f5e", fontWeight: 700 }}>{data.status}</span>
        </p>
        <p className="tooltip-latency">HTTP: <strong>{data.statusCode ?? "No response"}</strong></p>
        <p className="tooltip-latency">Response time: <strong>{Number(payload[0].value).toFixed(2)} ms</strong></p>
        {data.error && <p className="tooltip-error">{data.error}</p>}
      </div>
    );
  }
  return null;
};

export default function ResponseChart({ history }) {
  const data = formatChartData(history);
  const responseTimes = data.map((item) => item.responseTime);
  const upChecks = data.filter((item) => item.status === "UP").length;
  const average = responseTimes.length
    ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
    : 0;

  if (data.length === 0) {
    return <div className="empty-chart">No ping metrics recorded yet. Trigger a check to display latency trends.</div>;
  }

  return (
    <div className="chart-shell">
      <div className="chart-summary">
        <span><strong>{data.length}</strong> checks shown</span>
        <span><strong>{upChecks}</strong> up / <strong>{data.length - upChecks}</strong> down</span>
        <span>Avg <strong>{average.toFixed(0)} ms</strong></span>
        <span>Max <strong>{Math.max(...responseTimes).toFixed(0)} ms</strong></span>
      </div>
      <ResponsiveContainer width="100%" height={330}>
        <AreaChart data={data} margin={{ top: 16, right: 18, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(100, 116, 139, 0.28)" />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={28} dy={8} />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 10 }}
            width={58}
            unit=" ms"
            domain={[0, "auto"]}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `avg ${average.toFixed(0)} ms`, position: "insideTopRight", fill: "#92400e", fontSize: 11 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="#4f46e5"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorLatency)"
            dot={<StatusDot />}
            activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2, fill: "#4f46e5" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
