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
    const errorData = error.response?.data?.error || {};
    const message =
      errorData.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    const code = errorData.code || 'NETWORK_ERROR';

    const customError: any = new Error(message);
    customError.code = code;
    customError.status = error.response?.status;
    customError.response = error.response;
    customError.data = error.response?.data;

    return Promise.reject(customError);
  }
);

export default api;
