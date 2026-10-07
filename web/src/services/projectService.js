import { cleanParams, request } from './apiClient.js';

export const projectService = {
  async list(filters = {}, { signal } = {}) {
    const data = await request({ method: 'GET', url: '/projects', params: cleanParams(filters), signal });
    return data.projects;
  },
  async get(id, { signal } = {}) {
    const data = await request({ method: 'GET', url: `/projects/${id}`, signal });
    return data.project;
  },
  async create(payload) {
    const data = await request({ method: 'POST', url: '/projects', data: payload });
    return data.project;
  },
  async update(id, changes) {
    const data = await request({ method: 'PUT', url: `/projects/${id}`, data: changes });
    return data.project;
  },
  async remove(id) {
    const data = await request({ method: 'DELETE', url: `/projects/${id}` });
    return data.project;
  },
};
