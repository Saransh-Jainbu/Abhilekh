import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sessionId');
  if (token) {
    config.headers['X-Session-ID'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionId');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

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
  // Fetch the original file (PDF/image) as a blob object URL. Custom auth header
  // means we can't use a plain <img src>/<embed> URL, so we fetch + objectURL.
  getFileObjectUrl: async (id) => {
    const res = await api.get(`/documents/${id}/file`, { responseType: 'blob' });
    return URL.createObjectURL(res.data);
  },
};

export const chat = {
  sendMessage: (documentId, content) => api.post(`/chat/${documentId}/message`, { content }),
  getHistory: (documentId) => api.get(`/chat/${documentId}/history`),
};

export default api;
