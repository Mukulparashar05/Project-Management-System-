import { cleanParams, request } from './apiClient.js';

export const taskService = {
  async list(filters = {}, { signal } = {}) {
    const data = await request({ method: 'GET', url: '/tasks', params: cleanParams(filters), signal });
    return data.tasks;
  },
  async get(id, { signal } = {}) {
    const data = await request({ method: 'GET', url: `/tasks/${id}`, signal });
    return data.task;
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
