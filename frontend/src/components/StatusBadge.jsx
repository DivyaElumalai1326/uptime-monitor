export default function StatusBadge({ status }) {
  return <span className={`status-badge ${status === "UP" ? "status-up" : "status-down"}`}>{status}</span>;
}
