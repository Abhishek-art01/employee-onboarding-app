/**
 * services/api.js — Axios instance with auth interceptors.
 * All API calls flow through here: auto-attaches JWT, handles 401 refresh.
 */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL        : BASE_URL,
  timeout        : 15000,
  withCredentials: false,
  headers        : { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach JWT ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ─── Response Interceptor: handle 401 refresh ────────────────────
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
