const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getToken() {
  return storageAvailable() ? window.localStorage.getItem('quizlet_token') : null;
}

export function getUser() {
  if (!storageAvailable()) return null;
  const raw = window.localStorage.getItem('quizlet_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setSession(token, user) {
  if (!storageAvailable()) return;
  if (token) {
    window.localStorage.setItem('quizlet_token', token);
  }
  if (user) {
    window.localStorage.setItem('quizlet_user', JSON.stringify(user));
  }
}

export function logout() {
  if (!storageAvailable()) return;
  window.localStorage.removeItem('quizlet_token');
  window.localStorage.removeItem('quizlet_user');
}

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData || options.body == null ? options.body : JSON.stringify(options.body)
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }

  return payload;
}

export const getQuizzes = (search = '') => request(`/api/quizzes${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const getMyQuizzes = () => request('/api/quizzes?owner=me');

export const getQuiz = (id) => request(`/api/quizzes/${id}`);

export const createQuiz = (data) => request('/api/quizzes', { method: 'POST', body: data });

export const updateQuiz = (id, data) => request(`/api/quizzes/${id}`, { method: 'PUT', body: data });

export const deleteQuiz = (id) => request(`/api/quizzes/${id}`, { method: 'DELETE' });

export const seedData = () => request('/api/seed', { method: 'POST' });

export const register = async (data) => {
  const result = await request('/api/auth/register', { method: 'POST', body: data });
  setSession(result.token, result.user);
  return result;
};

export const login = async (data) => {
  const result = await request('/api/auth/login', { method: 'POST', body: data });
  setSession(result.token, result.user);
  return result;
};

export const getCurrentUser = () => request('/api/auth/me');