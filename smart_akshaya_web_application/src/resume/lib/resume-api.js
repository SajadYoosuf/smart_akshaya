const STORAGE_KEY = "resume-api-base-url";
export const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function getApiBase() {
  if (typeof window === "undefined") return DEFAULT_API_BASE;
  return window.localStorage.getItem(STORAGE_KEY)?.replace(/\/$/, "") || DEFAULT_API_BASE;
}

export function setApiBase(url) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
}

async function failMessage(res) {
  try {
    const body = await res.json();
    return body?.error || body?.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function createResume(data) {
  const res = await fetch(`${getApiBase()}/api/resumes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await failMessage(res));
  return res.json();
}

export async function getResume(id) {
  const res = await fetch(`${getApiBase()}/api/resumes/${id}`);
  if (!res.ok) throw new Error(await failMessage(res));
  return res.json();
}

export async function updateResume(id, data) {
  const res = await fetch(`${getApiBase()}/api/resumes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await failMessage(res));
  return res.json();
}

export async function deleteResume(id) {
  const res = await fetch(`${getApiBase()}/api/resumes/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error(await failMessage(res));
  return res.json();
}

export async function exportPdf(data) {
  const res = await fetch(`${getApiBase()}/api/resumes/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(await failMessage(res));
  return res.blob();
}
