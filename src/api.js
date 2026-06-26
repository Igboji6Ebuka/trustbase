/**
 * TrustBase API Client
 * Centralized fetch wrapper that automatically attaches the JWT
 * from localStorage to every request.
 */

const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('tb_token');
}

async function request(method, path, body = null, isFormData = false) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  // ── Auth ───────────────────────────────────────────────────────────────
  signup: (name, phone, password) =>
    request('POST', '/auth/signup', { name, phone, password }),

  login: (phone, password) =>
    request('POST', '/auth/login', { phone, password }),

  me: () =>
    request('GET', '/auth/me'),

  // ── Reports ────────────────────────────────────────────────────────────
  getReports: (page = 1, limit = 20) =>
    request('GET', `/reports?page=${page}&limit=${limit}`),

  getMyReports: () =>
    request('GET', '/reports/my'),

  getReport: (id) =>
    request('GET', `/reports/${id}`),

  submitReport: (formData) =>
    request('POST', '/reports', formData, true),

  // ── Search ────────────────────────────────────────────────────────────
  search: (q) =>
    request('GET', `/search?q=${encodeURIComponent(q)}`),

  // ── Verifications ──────────────────────────────────────────────────────
  getVerificationStatus: () =>
    request('GET', '/verifications/status'),

  applyForVerification: (formData) =>
    request('POST', '/verifications/apply', formData, true),

  // ── Notifications ──────────────────────────────────────────────────────
  getNotifications: () =>
    request('GET', '/notifications'),

  markNotificationRead: (id) =>
    request('PATCH', `/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    request('PATCH', '/notifications/read-all'),

  // ── Admin ──────────────────────────────────────────────────────────────
  adminStats: () =>
    request('GET', '/admin/stats'),

  adminGetReports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/admin/reports?${qs}`);
  },

  adminUpdateReport: (id, status) =>
    request('PATCH', `/admin/reports/${id}`, { status }),

  adminGetVerifications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/admin/verifications?${qs}`);
  },

  adminUpdateVerification: (id, status) =>
    request('PATCH', `/admin/verifications/${id}`, { status }),

  adminGetUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/admin/users?${qs}`);
  },

  adminGetFlagged: () =>
    request('GET', '/admin/flagged'),
};

// ── Session helpers ────────────────────────────────────────────────────────

export function saveSession(token, user) {
  localStorage.setItem('tb_token', token);
  localStorage.setItem('tb_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('tb_token');
  localStorage.removeItem('tb_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('tb_user') || 'null');
  } catch {
    return null;
  }
}

export default api;
