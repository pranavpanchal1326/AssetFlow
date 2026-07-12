// Thin fetch wrapper + typed resource helpers for the AssetFlow API.
// Base URL: VITE_API_URL env var, else "/api" (works with the Vite dev proxy).
const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "af_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, headers, isForm } = {}) {
  const token = getToken();
  const finalHeaders = { ...(headers || {}) };
  if (!isForm) finalHeaders["Content-Type"] = "application/json";
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body == null ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the AssetFlow server. Is the backend running on port 4000?");
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // No/invalid JSON body (e.g. CSV export) — handled by caller.
  }

  if (!res.ok) {
    const message = (json && json.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json ? json.data : null;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: "POST", body });
const put = (path, body) => request(path, { method: "PUT", body });

function qs(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

export const authApi = {
  login: (email, password) => post("/auth/login", { email, password }),
  signup: (name, email, password) => post("/auth/signup", { name, email, password }),
  me: () => get("/auth/me"),
  forgot: (email) => post("/auth/forgot", { email }),
  reset: (token, password) => post("/auth/reset", { token, password }),
};

export const assetsApi = {
  list: (params) => get(`/assets${qs(params)}`),
  get: (id) => get(`/assets/${id}`),
  create: (data) => post("/assets", data),
  update: (id, data) => put(`/assets/${id}`, data),
  qr: (id) => get(`/assets/${id}/qr`),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append("photo", file);
    return request(`/assets/${id}/photo`, { method: "POST", body: form, isForm: true });
  },
};

export const departmentsApi = {
  list: () => get("/departments"),
  create: (data) => post("/departments", data),
  update: (id, data) => put(`/departments/${id}`, data),
};

export const categoriesApi = {
  list: () => get("/categories"),
  create: (data) => post("/categories", data),
  update: (id, data) => put(`/categories/${id}`, data),
};

export const usersApi = {
  list: () => get("/users"),
  update: (id, data) => put(`/users/${id}`, data),
};

export const allocationsApi = {
  list: (params) => get(`/allocations${qs(params)}`),
  create: (data) => post("/allocations", data),
  return: (id, conditionNotes) => post(`/allocations/${id}/return`, { conditionNotes }),
};

export const transfersApi = {
  list: (params) => get(`/transfers${qs(params)}`),
  create: (data) => post("/transfers", data),
  decide: (id, action) => put(`/transfers/${id}`, { action }),
};

export const bookingsApi = {
  list: (params) => get(`/bookings${qs(params)}`),
  create: (data) => post("/bookings", data),
  update: (id, data) => put(`/bookings/${id}`, data),
};

export const maintenanceApi = {
  list: (params) => get(`/maintenance${qs(params)}`),
  create: (data, photoFile) => {
    if (!photoFile) return post("/maintenance", data);
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v != null) form.append(k, v); });
    form.append("photo", photoFile);
    return request("/maintenance", { method: "POST", body: form, isForm: true });
  },
  update: (id, data) => put(`/maintenance/${id}`, data),
};

export const auditsApi = {
  list: () => get("/audits"),
  get: (id) => get(`/audits/${id}`),
  create: (data) => post("/audits", data),
  updateItem: (cycleId, itemId, data) => put(`/audits/${cycleId}/items/${itemId}`, data),
  close: (id) => put(`/audits/${id}`, { action: "close" }),
};

export const dashboardApi = {
  kpis: () => get("/dashboard/kpis"),
};

export const notificationsApi = {
  list: (params) => get(`/notifications${qs(params)}`),
  markRead: (id) => put(`/notifications/${id}/read`),
  markAllRead: () => put("/notifications/read-all"),
};

export const activityLogsApi = {
  list: (params) => get(`/activity-logs${qs(params)}`),
};

export const reportsApi = {
  utilization: () => get("/reports/utilization"),
  maintenanceFrequency: () => get("/reports/maintenance-frequency"),
  departmentSummary: () => get("/reports/department-summary"),
  bookingHeatmap: () => get("/reports/booking-heatmap"),
  exportUrl: (name) => `${BASE_URL}/reports/${name}/export`,
  // Authenticated CSV download — the export route needs a Bearer token, so a
  // plain <a href> can't be used; fetch as a blob and trigger a save instead.
  downloadCsv: async (name) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/reports/${name}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(`Could not export ${name} (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
