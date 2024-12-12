import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://dev-ai-restapi.aim-football.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  },
  responseType: 'text',
  timeout: 0,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 