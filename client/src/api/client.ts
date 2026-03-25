import axios from 'axios';

export const API_URL =
  import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});
