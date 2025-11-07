// frontend/src/api.js
export const API_BASE = "http://localhost:8888"; // MAMP backend

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok || (data && data.error)) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}
