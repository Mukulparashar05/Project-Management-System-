import { cleanParams, request } from './apiClient';

export const projectService = {
  async list(filters = {}) {
    const data = await request({ method: 'GET', url: '/projects', params: cleanParams(filters) });
    return data.projects;
  },
  async get(id) {
    const data = await request({ method: 'GET', url: `/projects/${id}` });
    return data.project;
  },
};
