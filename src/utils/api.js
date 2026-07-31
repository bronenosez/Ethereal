// Thin client for the Ethereal admin backend (FastAPI).
// Base URL is configurable via VITE_API_URL; defaults to the local dev server.

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOKEN_KEY = 'ethereal_admin_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — token lives only in memory for this tab */
  }
};

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error(`Cannot reach the server at ${BASE}. Is the backend running?`);
  }

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.detail) detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const apiLogin = (username, password) =>
  request('/auth/login', { method: 'POST', body: { username, password } });

export const apiMe = () => request('/auth/me', { auth: true });

export const apiParse = (url, pages) =>
  request('/parse', { method: 'POST', auth: true, body: { url, pages } });

/* ----- products (reads public, writes require admin auth) ----- */
export const apiListProducts = () => request('/products');

export const apiCreateProduct = (draft) =>
  request('/products', { method: 'POST', auth: true, body: draft });

export const apiCreateProducts = (drafts) =>
  request('/products/bulk', { method: 'POST', auth: true, body: { products: drafts } });

export const apiUpdateProduct = (id, patch) =>
  request(`/products/${id}`, { method: 'PUT', auth: true, body: patch });

export const apiDeleteProduct = (id) =>
  request(`/products/${id}`, { method: 'DELETE', auth: true });

export const apiBulkDeleteProducts = (ids) =>
  request('/products/bulk-delete', { method: 'POST', auth: true, body: { ids: ids.map(Number) } });

export const apiDeleteAllProducts = () =>
  request('/products/bulk-delete', { method: 'POST', auth: true, body: { all: true } });
