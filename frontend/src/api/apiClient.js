import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
});

// Attaches the JWT automatically so components/hooks never touch tokens.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('katha_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
