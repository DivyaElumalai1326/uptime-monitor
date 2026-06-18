import { useState } from "react";

export default function AddUrlForm({ onSubmit, isSubmitting }) {
  const [url, setUrl] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!url.trim()) {
      return;
    }

    await onSubmit(url.trim());
    setUrl("");
  }

  return (
    <form className="add-url-form" onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com"
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add URL"}
      </button>
    </form>
  );
}
