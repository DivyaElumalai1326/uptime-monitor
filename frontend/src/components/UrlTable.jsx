import StatusBadge from "./StatusBadge";

function formatTime(timestamp) {
  if (!timestamp) {
    return "--";
  }

  return new Date(timestamp).toLocaleTimeString();
}

export default function UrlTable({ urls, selectedUrlId, onSelect }) {
  return (
    <section className="table-card">
      <div className="table-header">
        <p className="eyebrow">Monitored URLs</p>
        <h2>Live status</h2>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              <th>HTTP</th>
              <th>Response Time</th>
              <th>Last Checked</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {urls.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No URLs added yet.
                </td>
              </tr>
            ) : (
              urls.map((item) => (
                <tr
                  key={item.id}
                  className={item.id === selectedUrlId ? "selected-row" : ""}
                  onClick={() => onSelect(item.id)}
                >
                  <td>{item.url}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{item.status_code ?? "--"}</td>
                  <td>{item.response_time_ms ? `${item.response_time_ms} ms` : "--"}</td>
                  <td>{formatTime(item.last_checked_at)}</td>
                  <td>{item.uptime_percentage}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
