import * as taskService from '../services/task.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function listTasks(req, res) {
  const tasks = await taskService.listTasks(req.user.id, req.validated.query);
  sendSuccess(res, { tasks }, 'Tasks retrieved');
}

export async function getTask(req, res) {
  const task = await taskService.getTask(req.user.id, req.validated.params.id);
  sendSuccess(res, { task }, 'Task retrieved');
}

export async function createTask(req, res) {
  const task = await taskService.createTask(req.user.id, req.validated.body);
  sendSuccess(res, { task }, 'Task created', 201);
}

export async function updateTask(req, res) {
  const task = await taskService.updateTask(req.user.id, req.validated.params.id, req.validated.body);
  sendSuccess(res, { task }, 'Task updated');
}

export async function deleteTask(req, res) {
  const task = await taskService.deleteTask(req.user.id, req.validated.params.id);
  sendSuccess(res, { task }, 'Task deleted');
}
