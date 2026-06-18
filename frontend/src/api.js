import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export async function fetchUrls() {
  const response = await api.get("/urls");
  return response.data;
}

export async function addUrl(url) {
  const response = await api.post("/urls", { url });
  return response.data;
}

export async function fetchHistory(urlId) {
  const response = await api.get(`/history/${urlId}`);
  return response.data;
}

export async function runChecksNow() {
  const response = await api.post("/checks/run");
  return response.data;
}
