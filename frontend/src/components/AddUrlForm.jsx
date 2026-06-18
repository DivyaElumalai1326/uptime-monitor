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
    <section className="add-url-section">
      <h3>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path>
        </svg>
        Register New Endpoint
      </h3>
      <form className="add-url-form" onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          required
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Register URL"}
        </button>
      </form>
    </section>
  );
}
