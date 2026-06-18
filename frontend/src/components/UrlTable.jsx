import StatusBadge from "./StatusBadge";

export default function UrlTable({
  urls,
  selectedUrlId,
  onSelect,
  onToggleActive,
  onCheckSingle,
  onDelete,
  checkingUrls = {},
}) {
  return (
    <section className="table-card">
      <div className="table-header">
        <div className="table-title-group">
          <h2>Live Endpoints</h2>
          <p>Monitor real-time latency and service status</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              <th>HTTP</th>
              <th>Latency</th>
              <th>Uptime</th>
              <th style={{ textAlign: "right", paddingRight: "24px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {urls.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  No endpoints registered yet. Register a URL above to start monitoring.
                </td>
              </tr>
            ) : (
              urls.map((item) => {
                const isChecking = checkingUrls[item.id];
                return (
                  <tr
                    key={item.id}
                    className={item.id === selectedUrlId ? "selected-row" : ""}
                    onClick={() => onSelect(item.id)}
                  >
                    <td className="url-cell" title={item.url}>
                      {item.url}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <span className="latency-cell">{item.status_code ?? "--"}</span>
                    </td>
                    <td className="latency-cell">
                      {item.response_time_ms ? `${item.response_time_ms} ms` : "--"}
                    </td>
                    <td className="latency-cell">{item.uptime_percentage}%</td>
                    <td>
                      <div className="icon-btn-group" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="icon-btn check-single"
                          title="Run individual check"
                          disabled={!item.is_active || isChecking}
                          onClick={() => onCheckSingle(item.id)}
                        >
                          {isChecking ? (
                            <svg style={{ animation: "spin 1s linear infinite" }} width="14" height="14" fill="none" viewBox="0 0 24 24">
                              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                          )}
                        </button>
                        <button
                          className={`icon-btn ${item.is_active ? "pause" : "resume"}`}
                          title={item.is_active ? "Pause monitoring" : "Resume monitoring"}
                          onClick={() => onToggleActive(item.id)}
                        >
                          {item.is_active ? (
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                          )}
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          title="Delete endpoint"
                          onClick={() => onDelete(item.id)}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
