// src/services/api.ts
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de REQUEST: injeta o Bearer token ──────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@AutoSlot:token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE: trata 401 ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Só redireciona se não estiver já na página de login.
      // Sem essa guarda, o ParkingContext (montado globalmente) faz chamadas
      // sem token → 401 → redirect → remonta → 401 → loop infinito.
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('@AutoSlot:token');
        localStorage.removeItem('@AutoSlot:user');
        window.location.replace('/login');
      }
    }

    // 403 (Forbidden) NÃO redireciona automaticamente.
    // Cada componente trata o erro via try/catch e exibe a mensagem adequada.

    return Promise.reject(error);
  }
);

export default api;