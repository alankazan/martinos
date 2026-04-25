export const API_URL = "/api";

export async function fetchJson(path: string, options?: RequestInit) {
  const r = await fetch(`${API_URL}${path}`, options);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function getIconUrl(name: string) {
  return `${API_URL}/icon?name=${encodeURIComponent(name)}`;
}

export async function getSysInfo() {
  return fetchJson("/sysinfo");
}
