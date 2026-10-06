import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

export const app = createApp();
export const api = () => request(app);
export { prisma };

export async function resetDatabase() {
  await prisma.$executeRaw`TRUNCATE TABLE "tasks", "projects", "revoked_tokens", "users" CASCADE`;
}

let userCounter = 0;

export async function registerUser(overrides = {}) {
  userCounter += 1;
  const payload = {
    fullName: `Test User ${userCounter}`,
    email: `user${userCounter}.${Date.now()}@example.test`,
    password: 'Password123',
    ...overrides,
  };

  const response = await api().post('/api/auth/register').send(payload);
  if (response.status !== 201) {
    throw new Error(`Test user registration failed: ${response.status} ${JSON.stringify(response.body)}`);
  }

  const { user, token } = response.body.data;
  return { user, token, password: payload.password, auth: { Authorization: `Bearer ${token}` } };
}

export async function createProject(auth, overrides = {}) {
  const response = await api()
    .post('/api/projects')
    .set(auth)
    .send({ name: 'Test project', ...overrides });
  if (response.status !== 201) {
    throw new Error(`Test project creation failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.data.project;
}

export async function createTask(auth, projectId, overrides = {}) {
  const response = await api()
    .post('/api/tasks')
    .set(auth)
    .send({ projectId, name: 'Test task', ...overrides });
  if (response.status !== 201) {
    throw new Error(`Test task creation failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.data.task;
}
