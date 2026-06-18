import { useEffect, useState } from "react";
import {
  addUrl,
  fetchHistory,
  fetchUrls,
  runChecksNow,
  deleteUrl,
  toggleUrlActive,
  checkIndividualUrl,
} from "./api";
import AddUrlForm from "./components/AddUrlForm";
import ResponseChart from "./components/ResponseChart";
import StatusBadge from "./components/StatusBadge";
import UrlTable from "./components/UrlTable";
import { formatIstDate, formatIstTime } from "./time";

export default function App() {
  const [urls, setUrls] = useState([]);
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkingUrls, setCheckingUrls] = useState({});

  async function loadUrls(preserveSelection = true) {
    try {
      const data = await fetchUrls();
      setUrls(data);

      if (data.length > 0) {
        if (!preserveSelection || !selectedUrlId || !data.some((item) => item.id === selectedUrlId)) {
          setSelectedUrlId(data[0].id);
        }
      } else {
        setSelectedUrlId(null);
      }
    } catch (err) {
      setError("Failed to fetch monitored URLs from database.");
    }
  }

  async function loadHistory(urlId) {
    if (!urlId) {
      setHistory([]);
      return;
    }
    try {
      const data = await fetchHistory(urlId);
      setHistory(data);
    } catch (err) {
      setError("Failed to fetch latency history for the selected endpoint.");
    }
  }

  useEffect(() => {
    loadUrls(false);
  }, []);

  useEffect(() => {
    loadHistory(selectedUrlId);
  }, [selectedUrlId]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadUrls(true);
      if (selectedUrlId) {
        loadHistory(selectedUrlId);
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [selectedUrlId]);

  async function handleAddUrl(url) {
    setIsSubmitting(true);
    setError("");
    try {
      const created = await addUrl(url);
      setCheckingUrls((prev) => ({ ...prev, [created.id]: true }));
      try {
        await checkIndividualUrl(created.id);
      } catch (err) {
        // Safe to ignore individual check failures here since UI handles DOWN state
      }
      setCheckingUrls((prev) => ({ ...prev, [created.id]: false }));
      
      await loadUrls(true);
      setSelectedUrlId(created.id);
      await loadHistory(created.id);
    } catch (err) {
      setError(err.response?.data?.detail ?? "Invalid URL endpoint format or duplicate entry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setError("");
    try {
      await runChecksNow();
      await loadUrls(true);
      if (selectedUrlId) {
        await loadHistory(selectedUrlId);
      }
    } catch (err) {
      setError("Failed to trigger global diagnostic check cycle.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleToggleActive(urlId) {
    setError("");
    try {
      await toggleUrlActive(urlId);
      await loadUrls(true);
      if (selectedUrlId === urlId) {
        await loadHistory(urlId);
      }
    } catch (err) {
      setError("Failed to change monitoring status.");
    }
  }

  async function handleCheckSingle(urlId) {
    setCheckingUrls((prev) => ({ ...prev, [urlId]: true }));
    setError("");
    try {
      await checkIndividualUrl(urlId);
      await loadUrls(true);
      if (selectedUrlId === urlId) {
        await loadHistory(urlId);
      }
    } catch (err) {
      setError("Manual diagnosis check failed.");
    } finally {
      setCheckingUrls((prev) => ({ ...prev, [urlId]: false }));
    }
  }

  async function handleDeleteUrl(urlId) {
    if (!confirm("Are you sure you want to delete this endpoint and all health check history?")) {
      return;
    }
    setError("");
    try {
      await deleteUrl(urlId);
      const remainingUrls = urls.filter((item) => item.id !== urlId);
      setUrls(remainingUrls);
      if (selectedUrlId === urlId) {
        const nextId = remainingUrls[0]?.id ?? null;
        setSelectedUrlId(nextId);
        if (nextId) {
          await loadHistory(nextId);
        } else {
          setHistory([]);
        }
      }
    } catch (err) {
      setError("Failed to delete the endpoint.");
    }
  }

  const selectedUrl = urls.find((item) => item.id === selectedUrlId) ?? null;

  const totalUrls = urls.length;
  const activeUrls = urls.filter((item) => item.status === "UP").length;
  const downUrls = urls.filter((item) => item.status === "DOWN").length;
  const pausedUrls = urls.filter((item) => item.status === "PAUSED").length;

  const activeMonitorCount = urls.filter((item) => item.is_active).length;

  const systemUptime = totalUrls > 0 
    ? (urls.reduce((sum, item) => sum + item.uptime_percentage, 0) / totalUrls).toFixed(1)
    : "0.0";

  const activeLatencies = urls.filter((item) => item.status === "UP" && item.response_time_ms);
  const avgLatency = activeLatencies.length > 0
    ? (activeLatencies.reduce((sum, item) => sum + item.response_time_ms, 0) / activeLatencies.length).toFixed(0)
    : "0";

  return (
    <div className="page-shell">
      <main className="app-card">
        {/* Hero Banner */}
        <section className="hero">
          <div className="hero-info">
            <p className="eyebrow">TETRIZ.AI • ENGINEERING INTELLIGENCE</p>
            <h1>Endpoint Uptime Console</h1>
            <p className="hero-copy">
              Continuous diagnostics and latency mapping for engineering API layers.
            </p>
          </div>
          <div className="action-buttons">
            <button className="refresh-button" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <svg style={{ animation: "spin 1s linear infinite" }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running diagnostics...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Diagnostic Cycle
                </>
              )}
            </button>
          </div>
        </section>

        {/* Global Error Banner */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button className="error-close" onClick={() => setError("")}>&times;</button>
          </div>
        )}

        {/* Register input */}
        <AddUrlForm onSubmit={handleAddUrl} isSubmitting={isSubmitting} />

        {/* Stats Grid */}
        <section className="stats-grid">
          <article className="stat-card active-card">
            <span className="stat-label">Total Endpoints</span>
            <strong className="stat-value">{totalUrls}</strong>
            <span className="stat-trend">{activeMonitorCount} active • {pausedUrls} paused</span>
          </article>
          <article className="stat-card">
            <span className="stat-label">Diagnostic Status</span>
            <strong className="stat-value" style={{ color: downUrls > 0 ? "var(--color-down)" : "var(--color-up)" }}>
              {downUrls > 0 ? `${downUrls} Offline` : "All Healthy"}
            </strong>
            <span className="stat-trend">{activeUrls} UP • {downUrls} DOWN</span>
          </article>
          <article className="stat-card">
            <span className="stat-label">Avg Active Latency</span>
            <strong className="stat-value">{avgLatency} ms</strong>
            <span className="stat-trend">Across UP endpoints</span>
          </article>
          <article className="stat-card">
            <span className="stat-label">Average Uptime</span>
            <strong className="stat-value">{systemUptime}%</strong>
            <span className="stat-trend">Lifetime uptime percentage</span>
          </article>
        </section>

        {/* Main Split Panels */}
        <section className="dashboard-body">
          {/* Table list */}
          <UrlTable
            urls={urls}
            selectedUrlId={selectedUrlId}
            onSelect={setSelectedUrlId}
            onToggleActive={handleToggleActive}
            onCheckSingle={handleCheckSingle}
            onDelete={handleDeleteUrl}
            checkingUrls={checkingUrls}
          />

          {/* Details & Logs */}
          <section className="details-panel">
            {selectedUrl ? (
              <>
                <div className="details-header">
                  <div className="details-title">
                    <h2>{selectedUrl.url}</h2>
                    <p>Endpoint configuration & detailed logs</p>
                  </div>
                  <StatusBadge status={selectedUrl.status} />
                </div>

                <div className="chart-title-container">
                  <h3>Latency Mapping</h3>
                  <span className="eyebrow">UPTIME: {selectedUrl.uptime_percentage}%</span>
                </div>
                <ResponseChart history={history} />

                <div className="logs-section">
                  <div className="logs-heading">
                    <h3>Recent Diagnostic Cycles</h3>
                    <span>{history.length} stored checks · Times shown in IST</span>
                  </div>
                  <div className="logs-list">
                    {history.length === 0 ? (
                      <div className="empty-row" style={{ padding: "20px 0" }}>No check cycles run yet.</div>
                    ) : (
                      history.slice(0, 50).map((log) => (
                        <div key={log.id} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div className="log-item">
                            <div className="log-meta">
                              <span className="log-time">{formatIstTime(log.timestamp)} IST</span>
                              <span className="log-type">{formatIstDate(log.timestamp)}</span>
                            </div>
                            <div className="log-metrics">
                              <span className="log-latency">
                                HTTP {log.status_code ?? "--"} · {log.response_time_ms?.toFixed(0) ?? "--"} ms
                              </span>
                              <StatusBadge status={log.is_up ? "UP" : "DOWN"} />
                            </div>
                          </div>
                          {!log.is_up && log.error_message && (
                            <div className="log-error">
                              Error: {log.error_message}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-details">
                <svg width="40" height="40" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"></path>
                </svg>
                <p style={{ marginTop: "12px" }}>Select an endpoint from the table to view real-time logs and chart mapping details.</p>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
