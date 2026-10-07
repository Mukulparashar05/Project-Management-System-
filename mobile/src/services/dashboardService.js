import { request } from './apiClient';

export const dashboardService = {
  get: () => request({ method: 'GET', url: '/dashboard' }),
};
