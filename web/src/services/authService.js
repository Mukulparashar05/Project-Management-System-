import { request } from './apiClient.js';

export const authService = {
  register: (payload) => request({ method: 'POST', url: '/auth/register', data: payload }),
  login: (credentials) => request({ method: 'POST', url: '/auth/login', data: credentials }),
  logout: () => request({ method: 'POST', url: '/auth/logout' }),
  async getCurrentUser({ signal } = {}) {
    const data = await request({ method: 'GET', url: '/auth/me', signal });
    return data.user;
  },
};
