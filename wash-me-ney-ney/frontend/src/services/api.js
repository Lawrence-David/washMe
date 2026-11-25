const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Called when the server says the login is gone (expired, logged out elsewhere, account turned off)
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, { method = 'GET', body, query } = {}) {
  const qs = query
    ? new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
    : '';
  const url = BASE + path + (qs ? `?${qs}` : '');

  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include', // send the httpOnly login cookie
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/auth/')) onUnauthorized(data.error);
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export const api = {
  // Login
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', { method: 'PUT', body: { currentPassword, newPassword } }),

  // Data
  list: (resource, query) => request(`/${resource}`, { query }),
  get: (resource, id) => request(`/${resource}/${id}`),
  create: (resource, body) => request(`/${resource}`, { method: 'POST', body }),
  update: (resource, id, body) => request(`/${resource}/${id}`, { method: 'PUT', body }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  orderStats: () => request('/orders/stats'),
};
