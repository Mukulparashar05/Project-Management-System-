import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  createProject,
  createTask,
  prisma,
  registerUser,
  resetDatabase,
} from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const missingId = '00000000-0000-4000-8000-000000000000';

async function setupOwnerWithProject() {
  const owner = await registerUser();
  const project = await createProject(owner.auth, { name: 'Launch' });
  return { ...owner, project };
}

describe('POST /api/tasks', () => {
  it('creates a task in the user’s project with defaults', async () => {
    const { user, auth, project } = await setupOwnerWithProject();

    const response = await api()
      .post('/api/tasks')
      .set(auth)
      .send({ projectId: project.id, name: '  Write copy  ' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Task created');
    expect(response.body.data.task).toMatchObject({
      projectId: project.id,
      name: 'Write copy',
      description: null,
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: null,
      project: { id: project.id, name: 'Launch' },
    });

    const stored = await prisma.task.findUnique({ where: { id: response.body.data.task.id } });
    expect(stored.userId).toBe(user.id);
  });

  it('stores priority, status, description and due date', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const response = await api().post('/api/tasks').set(auth).send({
      projectId: project.id,
      name: 'QA pass',
      description: 'Regression test the release',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2026-10-20',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.task).toMatchObject({
      description: 'Regression test the release',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2026-10-20',
    });
  });

  it('refuses to create a task in another user’s project', async () => {
    const attacker = await registerUser();
    const victim = await setupOwnerWithProject();

    const response = await api()
      .post('/api/tasks')
      .set(attacker.auth)
      .send({ projectId: victim.project.id, name: 'Injected task' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Project not found');
    expect(await prisma.task.count()).toBe(0);
  });

  it('returns 404 for a project that does not exist', async () => {
    const { auth } = await registerUser();
    const response = await api()
      .post('/api/tasks')
      .set(auth)
      .send({ projectId: missingId, name: 'Orphan' });

    expect(response.status).toBe(404);
  });

  it.each([
    [{ name: 'No project' }, 'projectId', 'Project is required'],
    [{ projectId: 'abc', name: 'Bad project id' }, 'projectId', 'Project must be a valid id'],
    [{ name: '' }, 'name', 'Task name is required'],
    [{ name: 'T', priority: 'URGENT' }, 'priority', 'Priority must be one of LOW, MEDIUM, HIGH'],
    [{ name: 'T', status: 'DONE' }, 'status', 'Status must be one of PENDING, IN_PROGRESS, COMPLETED'],
    [{ name: 'T', dueDate: '2026-02-29' }, 'dueDate', 'Must be a valid date in YYYY-MM-DD format'],
  ])('rejects invalid payload %# with a field error', async (payload, field, message) => {
    const { auth, project } = await setupOwnerWithProject();
    const body = 'projectId' in payload || field === 'projectId' ? payload : { projectId: project.id, ...payload };

    const response = await api().post('/api/tasks').set(auth).send(body);

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({ field, message });
  });
});

describe('GET /api/tasks', () => {
  it('lists only the user’s tasks and can scope them to one project', async () => {
    const alice = await setupOwnerWithProject();
    const aliceOther = await createProject(alice.auth, { name: 'Other' });
    const bob = await setupOwnerWithProject();
    await createTask(alice.auth, alice.project.id, { name: 'Alice launch task' });
    await createTask(alice.auth, aliceOther.id, { name: 'Alice other task' });
    await createTask(bob.auth, bob.project.id, { name: 'Bob task' });

    const all = await api().get('/api/tasks').set(alice.auth);
    expect(all.status).toBe(200);
    expect(all.body.data.tasks.map((task) => task.name).sort()).toEqual([
      'Alice launch task',
      'Alice other task',
    ]);

    const scoped = await api().get('/api/tasks').query({ projectId: alice.project.id }).set(alice.auth);
    expect(scoped.body.data.tasks.map((task) => task.name)).toEqual(['Alice launch task']);
  });

  it('returns 404 when listing tasks of another user’s project', async () => {
    const alice = await registerUser();
    const bob = await setupOwnerWithProject();
    await createTask(bob.auth, bob.project.id);

    const response = await api().get('/api/tasks').query({ projectId: bob.project.id }).set(alice.auth);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Project not found');
  });

  it('searches by name and filters by status and priority', async () => {
    const { auth, project } = await setupOwnerWithProject();
    await createTask(auth, project.id, { name: 'Design landing page', priority: 'HIGH', status: 'IN_PROGRESS' });
    await createTask(auth, project.id, { name: 'Design icons', priority: 'LOW', status: 'COMPLETED' });
    await createTask(auth, project.id, { name: 'Write release notes', priority: 'HIGH', status: 'PENDING' });

    const names = (response) => response.body.data.tasks.map((task) => task.name).sort();
    const list = (query) => api().get('/api/tasks').query({ projectId: project.id, ...query }).set(auth);

    expect(names(await list({ search: 'design' }))).toEqual(['Design icons', 'Design landing page']);
    expect(names(await list({ status: 'COMPLETED' }))).toEqual(['Design icons']);
    expect(names(await list({ priority: 'HIGH' }))).toEqual(['Design landing page', 'Write release notes']);
    expect(names(await list({ search: 'design', priority: 'HIGH', status: 'IN_PROGRESS' }))).toEqual([
      'Design landing page',
    ]);
    expect(names(await list({ search: 'nothing matches' }))).toEqual([]);
  });

  it.each([
    [{ status: 'DONE' }, 'status'],
    [{ priority: 'URGENT' }, 'priority'],
    [{ projectId: 'not-a-uuid' }, 'projectId'],
    [{ search: 'x'.repeat(101) }, 'search'],
  ])('rejects invalid filter %#', async (query, field) => {
    const { auth } = await registerUser();
    const response = await api().get('/api/tasks').query(query).set(auth);

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe(field);
  });

  it('requires authentication', async () => {
    const response = await api().get('/api/tasks');
    expect(response.status).toBe(401);
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns the user’s task', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const task = await createTask(auth, project.id, { name: 'Read me' });

    const response = await api().get(`/api/tasks/${task.id}`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.task).toMatchObject({ id: task.id, name: 'Read me' });
  });

  it('returns 404 for another user’s task', async () => {
    const alice = await registerUser();
    const bob = await setupOwnerWithProject();
    const bobsTask = await createTask(bob.auth, bob.project.id);

    const response = await api().get(`/api/tasks/${bobsTask.id}`).set(alice.auth);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, message: 'Task not found', code: 'NOT_FOUND' });
  });
});

describe('PUT /api/tasks/:id', () => {
  it('marks a task as completed', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const task = await createTask(auth, project.id);

    const response = await api().put(`/api/tasks/${task.id}`).set(auth).send({ status: 'COMPLETED' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Task updated');
    expect(response.body.data.task.status).toBe('COMPLETED');
  });

  it('changes priority and edits other fields', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const task = await createTask(auth, project.id, { name: 'Draft', dueDate: '2026-10-10' });

    const response = await api().put(`/api/tasks/${task.id}`).set(auth).send({
      name: 'Final',
      description: 'Updated details',
      priority: 'HIGH',
      dueDate: null,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.task).toMatchObject({
      name: 'Final',
      description: 'Updated details',
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: null,
    });
  });

  it('does not allow moving a task to another project', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const other = await createProject(auth);
    const task = await createTask(auth, project.id);

    const response = await api().put(`/api/tasks/${task.id}`).set(auth).send({ projectId: other.id });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toEqual({ field: 'projectId', message: 'Field not allowed: projectId' });
  });

  it('rejects an empty update', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const task = await createTask(auth, project.id);

    const response = await api().put(`/api/tasks/${task.id}`).set(auth).send({});
    expect(response.status).toBe(400);
  });

  it('cannot modify another user’s task', async () => {
    const alice = await registerUser();
    const bob = await setupOwnerWithProject();
    const bobsTask = await createTask(bob.auth, bob.project.id, { name: 'Bob task' });

    const response = await api()
      .put(`/api/tasks/${bobsTask.id}`)
      .set(alice.auth)
      .send({ status: 'COMPLETED', name: 'Hijacked' });

    expect(response.status).toBe(404);
    const stored = await prisma.task.findUnique({ where: { id: bobsTask.id } });
    expect(stored).toMatchObject({ name: 'Bob task', status: 'PENDING' });
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes the user’s task', async () => {
    const { auth, project } = await setupOwnerWithProject();
    const task = await createTask(auth, project.id);

    const response = await api().delete(`/api/tasks/${task.id}`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.task).toEqual({ id: task.id, projectId: project.id });
    expect(await prisma.task.count()).toBe(0);
  });

  it('cannot delete another user’s task', async () => {
    const alice = await registerUser();
    const bob = await setupOwnerWithProject();
    const bobsTask = await createTask(bob.auth, bob.project.id);

    const response = await api().delete(`/api/tasks/${bobsTask.id}`).set(alice.auth);

    expect(response.status).toBe(404);
    expect(await prisma.task.count({ where: { id: bobsTask.id } })).toBe(1);
  });
});

describe('project and task relationship', () => {
  it('reports per-project task counts and progress', async () => {
    const { auth, project } = await setupOwnerWithProject();
    await createTask(auth, project.id, { status: 'COMPLETED' });
    await createTask(auth, project.id, { status: 'COMPLETED' });
    await createTask(auth, project.id, { status: 'IN_PROGRESS' });
    await createTask(auth, project.id, { status: 'PENDING' });

    const response = await api().get(`/api/projects/${project.id}`).set(auth);

    expect(response.body.data.project.taskCounts).toEqual({
      total: 4,
      pending: 1,
      inProgress: 1,
      completed: 2,
    });
    expect(response.body.data.project.progress).toBe(50);
  });

  it('deleting a project deletes its tasks', async () => {
    const { auth, project } = await setupOwnerWithProject();
    await createTask(auth, project.id);
    await createTask(auth, project.id);

    await api().delete(`/api/projects/${project.id}`).set(auth).expect(200);

    expect(await prisma.task.count()).toBe(0);
  });

  it('the database itself rejects a task whose owner differs from the project owner', async () => {
    const alice = await setupOwnerWithProject();
    const bob = await registerUser();

    await expect(
      prisma.task.create({
        data: { name: 'Bypassing the API', projectId: alice.project.id, userId: bob.user.id },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });
});
