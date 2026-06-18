export default function StatusBadge({ status }) {
  const statusClass = {
    UP: "status-up",
    DOWN: "status-down",
    PAUSED: "status-paused",
    PENDING: "status-pending",
  }[status] || "status-pending";

  return <span className={`status-badge ${statusClass}`}>{status}</span>;
}
