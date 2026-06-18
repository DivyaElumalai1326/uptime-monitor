import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatChartData(history) {
  return history.map((item) => ({
    name: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    responseTime: item.response_time_ms ?? 0,
    status: item.is_up ? "UP" : "DOWN",
  }));
}

export default function ResponseChart({ history }) {
  const data = formatChartData(history);

  if (data.length === 0) {
    return <div className="empty-chart">Run a check to see response-time history.</div>;
  }

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="#d8d2c6" />
          <XAxis dataKey="name" stroke="#60574a" />
          <YAxis stroke="#60574a" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#d46a4c"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
