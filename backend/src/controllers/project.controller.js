import * as projectService from '../services/project.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function listProjects(req, res) {
  const projects = await projectService.listProjects(req.user.id, req.validated.query);
  sendSuccess(res, { projects }, 'Projects retrieved');
}

export async function getProject(req, res) {
  const project = await projectService.getProject(req.user.id, req.validated.params.id);
  sendSuccess(res, { project }, 'Project retrieved');
}

export async function createProject(req, res) {
  const project = await projectService.createProject(req.user.id, req.validated.body);
  sendSuccess(res, { project }, 'Project created', 201);
}

export async function updateProject(req, res) {
  const project = await projectService.updateProject(
    req.user.id,
    req.validated.params.id,
    req.validated.body,
  );
  sendSuccess(res, { project }, 'Project updated');
}

export async function deleteProject(req, res) {
  const project = await projectService.deleteProject(req.user.id, req.validated.params.id);
  sendSuccess(res, { project }, 'Project deleted');
}
