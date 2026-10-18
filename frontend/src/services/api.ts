import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = error.response?.data?.error || {
      message: error.message || 'An unexpected network error occurred',
      code: 'NETWORK_ERROR',
    };
    return Promise.reject(customError);
  }
);

export default api;
