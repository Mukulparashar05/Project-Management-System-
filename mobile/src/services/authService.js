import { request } from './apiClient';

export const authService = {
  register: (details) => request({ method: 'POST', url: '/auth/register', data: details }),
  login: (credentials) => request({ method: 'POST', url: '/auth/login', data: credentials }),
  logout: () => request({ method: 'POST', url: '/auth/logout' }),
  async getCurrentUser() {
    const data = await request({ method: 'GET', url: '/auth/me' });
    return data.user;
  },
};
