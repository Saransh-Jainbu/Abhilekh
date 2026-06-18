import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let sessionId = localStorage.getItem('sessionId') || null;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const newSessionId = response.headers['x-session-id'];
  if (newSessionId && newSessionId !== 'new') {
    sessionId = newSessionId;
    localStorage.setItem('sessionId', sessionId);
  }
  return response;
});

export const auth = {
  googleCallback: (data) => api.post('/auth/google', data),
  logout: () => api.post('/auth/logout'),
};

export const documents = {
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list: () => api.get('/documents'),
  get: (id) => api.get(`/documents/${id}`),
  process: (id) => api.post(`/documents/${id}/process`),
  getStatus: (id) => api.get(`/documents/${id}/status`),
  getInsights: (id) => api.get(`/documents/${id}/insights`),
  translate: (id, language) => api.post(`/documents/${id}/translate`, { language }),
  getTranslations: (id) => api.get(`/documents/${id}/translations`),
  delete: (id) => api.delete(`/documents/${id}`),
};

export const chat = {
  sendMessage: (documentId, content) => api.post(`/chat/${documentId}/message`, { content }),
  getHistory: (documentId) => api.get(`/chat/${documentId}/history`),
};

export default api;
