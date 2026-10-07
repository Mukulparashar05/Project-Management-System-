import { request } from './apiClient.js';

export const dashboardService = {
  get: ({ signal } = {}) => request({ method: 'GET', url: '/dashboard', signal }),
};
