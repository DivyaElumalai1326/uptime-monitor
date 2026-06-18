import { useEffect, useState } from "react";

import { addUrl, fetchHistory, fetchUrls, runChecksNow } from "./api";
import AddUrlForm from "./components/AddUrlForm";
import ResponseChart from "./components/ResponseChart";
import StatusBadge from "./components/StatusBadge";
import UrlTable from "./components/UrlTable";

export default function App() {
  const [urls, setUrls] = useState([]);
  const [selectedUrlId, setSelectedUrlId] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadUrls(preserveSelection = true) {
    const data = await fetchUrls();
    setUrls(data);

    if (!preserveSelection && data.length > 0) {
      setSelectedUrlId(data[0].id);
      return;
    }

    if (selectedUrlId && !data.some((item) => item.id === selectedUrlId)) {
      setSelectedUrlId(data[0]?.id ?? null);
    }
  }

  async function loadHistory(urlId) {
    if (!urlId) {
      setHistory([]);
      return;
    }

    const data = await fetchHistory(urlId);
    setHistory(data.slice(0, 20).reverse());
  }

  useEffect(() => {
    loadUrls(false).catch(() => setError("Could not load URLs from the backend."));
  }, []);

  useEffect(() => {
    loadHistory(selectedUrlId).catch(() => setError("Could not load URL history."));
  }, [selectedUrlId]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadUrls().catch(() => setError("Could not refresh URL data."));
      if (selectedUrlId) {
        loadHistory(selectedUrlId).catch(() => setError("Could not refresh history."));
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [selectedUrlId]);

  async function handleAddUrl(url) {
    setIsSubmitting(true);
    setError("");

    try {
      const created = await addUrl(url);
      await runChecksNow();
      await loadUrls();
      setSelectedUrlId(created.id);
      await loadHistory(created.id);
    } catch (requestError) {
      setError(requestError.response?.data?.detail ?? "Failed to add URL.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    setError("");

    try {
      await runChecksNow();
      await loadUrls();
      await loadHistory(selectedUrlId);
    } catch {
      setError("Refresh failed.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const selectedUrl = urls.find((item) => item.id === selectedUrlId) ?? null;

  return (
    <div className="page-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <main className="app-card">
        <section className="hero">
          <div>
            <p className="eyebrow">Epifi AI Assignment</p>
            <h1>Uptime Monitor Dashboard</h1>
            <p className="hero-copy">
              Track URL health, response time, and recent uptime history from a single live dashboard.
            </p>
          </div>

          <button className="refresh-button" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Run Checks Now"}
          </button>
        </section>

        <AddUrlForm onSubmit={handleAddUrl} isSubmitting={isSubmitting} />

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Tracked URLs</span>
            <strong>{urls.length}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Currently Up</span>
            <strong>{urls.filter((item) => item.status === "UP").length}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Selected Status</span>
            <strong>{selectedUrl ? <StatusBadge status={selectedUrl.status} /> : "--"}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Selected Uptime</span>
            <strong>{selectedUrl ? `${selectedUrl.uptime_percentage}%` : "--"}</strong>
          </article>
        </section>

        <UrlTable urls={urls} selectedUrlId={selectedUrlId} onSelect={setSelectedUrlId} />

        <section className="details-panel">
          <div className="details-header">
            <div>
              <p className="eyebrow">Response Trend</p>
              <h2>{selectedUrl ? selectedUrl.url : "Select a URL"}</h2>
            </div>
            {selectedUrl ? <StatusBadge status={selectedUrl.status} /> : null}
          </div>

          <ResponseChart history={history} />
        </section>
      </main>
    </div>
  );
}
