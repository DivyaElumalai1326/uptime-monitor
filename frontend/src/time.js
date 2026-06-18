const IST_TIME_ZONE = "Asia/Kolkata";

export function parseUtcTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  // SQLite stores UTC as a timezone-naive value. Appending Z tells the
  // browser to interpret that value as UTC before converting it to IST.
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp);
  return new Date(hasTimezone ? timestamp : `${timestamp}Z`);
}

export function formatIstTime(timestamp) {
  const date = parseUtcTimestamp(timestamp);
  if (!date || Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatIstDate(timestamp) {
  const date = parseUtcTimestamp(timestamp);
  if (!date || Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatIstDateTime(timestamp) {
  return `${formatIstDate(timestamp)}, ${formatIstTime(timestamp)} IST`;
}
