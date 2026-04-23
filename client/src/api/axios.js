import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (baseURL && !baseURL.endsWith('/api')) {
  // Strip trailing slash if present before appending /api
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}

const API = axios.create({
  baseURL,
  withCredentials: true,
});

// REQUEST INTERCEPTOR
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// RESPONSE INTERCEPTOR
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;