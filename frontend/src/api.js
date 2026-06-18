import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
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

export async function deleteUrl(urlId) {
  const response = await api.delete(`/urls/${urlId}`);
  return response.data;
}

export async function toggleUrlActive(urlId) {
  const response = await api.patch(`/urls/${urlId}/toggle`);
  return response.data;
}

export async function checkIndividualUrl(urlId) {
  const response = await api.post(`/checks/${urlId}`);
  return response.data;
}
