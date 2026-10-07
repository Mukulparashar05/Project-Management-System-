import { cleanParams, request } from './apiClient';

export const taskService = {
  async list(filters = {}) {
    const data = await request({ method: 'GET', url: '/tasks', params: cleanParams(filters) });
    return data.tasks;
  },
  async create(payload) {
    const data = await request({ method: 'POST', url: '/tasks', data: payload });
    return data.task;
  },
  async update(id, changes) {
    const data = await request({ method: 'PUT', url: `/tasks/${id}`, data: changes });
    return data.task;
  },
  async remove(id) {
    const data = await request({ method: 'DELETE', url: `/tasks/${id}` });
    return data.task;
  },
};
