import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, createProject, prisma, registerUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

const missingId = '00000000-0000-4000-8000-000000000000';

describe('POST /api/projects', () => {
  it('creates a project owned by the authenticated user with sensible defaults', async () => {
    const { user, auth } = await registerUser();
    const response = await api().post('/api/projects').set(auth).send({ name: '  Website redesign  ' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Project created');
    expect(response.body.data.project).toMatchObject({
      name: 'Website redesign',
      description: null,
      status: 'NOT_STARTED',
      startDate: null,
      endDate: null,
      taskCounts: { total: 0, pending: 0, inProgress: 0, completed: 0 },
      progress: 0,
    });
    expect(response.body.data.project.createdAt).toEqual(expect.any(String));

    const stored = await prisma.project.findUnique({ where: { id: response.body.data.project.id } });
    expect(stored.userId).toBe(user.id);
  });

  it('stores all provided fields and returns dates as YYYY-MM-DD', async () => {
    const { auth } = await registerUser();
    const response = await api().post('/api/projects').set(auth).send({
      name: 'Mobile launch',
      description: 'Ship the Android app',
      status: 'IN_PROGRESS',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.project).toMatchObject({
      description: 'Ship the Android app',
      status: 'IN_PROGRESS',
      startDate: '2026-10-01',
      endDate: '2026-12-31',
    });
  });

  it('never lets the client choose the owner', async () => {
    const { auth } = await registerUser();
    const { user: otherUser } = await registerUser();

    const response = await api()
      .post('/api/projects')
      .set(auth)
      .send({ name: 'Sneaky', userId: otherUser.id });

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('userId');
    expect(await prisma.project.count()).toBe(0);
  });

  it.each([
    [{}, 'name', 'Project name is required'],
    [{ name: '   ' }, 'name', 'Project name is required'],
    [{ name: 'x'.repeat(121) }, 'name', 'Project name must be at most 120 characters'],
    [{ name: 'P', status: 'DONE' }, 'status', 'Status must be one of NOT_STARTED, IN_PROGRESS, COMPLETED'],
    [{ name: 'P', startDate: '2026-13-01' }, 'startDate', 'Must be a valid date in YYYY-MM-DD format'],
    [{ name: 'P', endDate: '2026-02-30' }, 'endDate', 'Must be a valid date in YYYY-MM-DD format'],
    [{ name: 'P', startDate: '01/10/2026' }, 'startDate', 'Must be a valid date in YYYY-MM-DD format'],
    [
      { name: 'P', startDate: '2026-10-10', endDate: '2026-10-01' },
      'endDate',
      'End date must be on or after the start date',
    ],
  ])('rejects invalid payload %# with a field error', async (payload, field, message) => {
    const { auth } = await registerUser();
    const response = await api().post('/api/projects').set(auth).send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.errors).toContainEqual({ field, message });
  });

  it('accepts a single-day project (start date equals end date)', async () => {
    const { auth } = await registerUser();
    const response = await api()
      .post('/api/projects')
      .set(auth)
      .send({ name: 'Workshop', startDate: '2026-11-05', endDate: '2026-11-05' });

    expect(response.status).toBe(201);
  });
});

describe('GET /api/projects', () => {
  it('lists only the authenticated user’s projects, newest first', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    await createProject(alice.auth, { name: 'Alice first' });
    await createProject(alice.auth, { name: 'Alice second' });
    await createProject(bob.auth, { name: 'Bob only' });

    const response = await api().get('/api/projects').set(alice.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.projects.map((project) => project.name)).toEqual([
      'Alice second',
      'Alice first',
    ]);
  });

  it('searches by name (case-insensitive, partial) and filters by status', async () => {
    const { auth } = await registerUser();
    await createProject(auth, { name: 'Website redesign', status: 'IN_PROGRESS' });
    await createProject(auth, { name: 'Website copy', status: 'COMPLETED' });
    await createProject(auth, { name: 'Mobile app', status: 'IN_PROGRESS' });

    const search = await api().get('/api/projects').query({ search: 'WEBSITE' }).set(auth);
    expect(search.body.data.projects.map((project) => project.name).sort()).toEqual([
      'Website copy',
      'Website redesign',
    ]);

    const status = await api().get('/api/projects').query({ status: 'IN_PROGRESS' }).set(auth);
    expect(status.body.data.projects.map((project) => project.name).sort()).toEqual([
      'Mobile app',
      'Website redesign',
    ]);

    const both = await api()
      .get('/api/projects')
      .query({ search: 'web', status: 'IN_PROGRESS' })
      .set(auth);
    expect(both.body.data.projects.map((project) => project.name)).toEqual(['Website redesign']);
  });

  it('treats empty filter values as "no filter"', async () => {
    const { auth } = await registerUser();
    await createProject(auth);

    const response = await api().get('/api/projects?search=&status=').set(auth);
    expect(response.status).toBe(200);
    expect(response.body.data.projects).toHaveLength(1);
  });

  it('rejects an invalid status filter', async () => {
    const { auth } = await registerUser();
    const response = await api().get('/api/projects').query({ status: 'ARCHIVED' }).set(auth);

    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('status');
  });

  it('treats SQL fragments in the search text as plain text', async () => {
    const { auth } = await registerUser();
    await createProject(auth, { name: 'Normal project' });

    const injection = await api()
      .get('/api/projects')
      .query({ search: "' OR '1'='1' --" })
      .set(auth);
    expect(injection.status).toBe(200);
    expect(injection.body.data.projects).toEqual([]);

    const wildcard = await api().get('/api/projects').query({ search: '%' }).set(auth);
    expect(wildcard.status).toBe(200);
    expect(wildcard.body.data.projects).toEqual([]);
  });

  it('matches LIKE wildcard characters literally', async () => {
    const { auth } = await registerUser();
    await createProject(auth, { name: '100% coverage' });
    await createProject(auth, { name: 'snake_case cleanup' });
    await createProject(auth, { name: 'Unrelated' });

    const percent = await api().get('/api/projects').query({ search: '%' }).set(auth);
    expect(percent.body.data.projects.map((project) => project.name)).toEqual(['100% coverage']);

    const underscore = await api().get('/api/projects').query({ search: '_' }).set(auth);
    expect(underscore.body.data.projects.map((project) => project.name)).toEqual([
      'snake_case cleanup',
    ]);
  });

  it('requires authentication', async () => {
    const response = await api().get('/api/projects');
    expect(response.status).toBe(401);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns the project with task counts', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth, { name: 'Details' });

    const response = await api().get(`/api/projects/${project.id}`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.project).toMatchObject({ id: project.id, name: 'Details', progress: 0 });
  });

  it('returns 404 for another user’s project and for unknown ids', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const bobsProject = await createProject(bob.auth);

    const foreign = await api().get(`/api/projects/${bobsProject.id}`).set(alice.auth);
    const unknown = await api().get(`/api/projects/${missingId}`).set(alice.auth);

    for (const response of [foreign, unknown]) {
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ success: false, message: 'Project not found', code: 'NOT_FOUND' });
    }
  });

  it('returns 400 for a malformed id', async () => {
    const { auth } = await registerUser();
    const response = await api().get('/api/projects/123').set(auth);

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toEqual({ field: 'id', message: 'Invalid id format' });
  });
});

describe('PUT /api/projects/:id', () => {
  it('updates only the provided fields', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth, { name: 'Old name', description: 'Keep me' });

    const response = await api()
      .put(`/api/projects/${project.id}`)
      .set(auth)
      .send({ name: 'New name', status: 'COMPLETED' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Project updated');
    expect(response.body.data.project).toMatchObject({
      name: 'New name',
      status: 'COMPLETED',
      description: 'Keep me',
    });
  });

  it('checks the date order against the stored dates', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth, { startDate: '2026-10-10' });

    const response = await api()
      .put(`/api/projects/${project.id}`)
      .set(auth)
      .send({ endDate: '2026-10-01' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
      { field: 'endDate', message: 'End date must be on or after the start date' },
    ]);
  });

  it('clears optional fields when null is sent', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth, {
      description: 'Temporary',
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    });

    const response = await api()
      .put(`/api/projects/${project.id}`)
      .set(auth)
      .send({ description: null, startDate: null, endDate: null });

    expect(response.status).toBe(200);
    expect(response.body.data.project).toMatchObject({
      description: null,
      startDate: null,
      endDate: null,
    });
  });

  it('rejects an empty update', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth);

    const response = await api().put(`/api/projects/${project.id}`).set(auth).send({});

    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toBe('Provide at least one field to update');
  });

  it('cannot modify another user’s project', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const bobsProject = await createProject(bob.auth, { name: 'Bob project' });

    const response = await api()
      .put(`/api/projects/${bobsProject.id}`)
      .set(alice.auth)
      .send({ name: 'Hijacked' });

    expect(response.status).toBe(404);
    const stored = await prisma.project.findUnique({ where: { id: bobsProject.id } });
    expect(stored.name).toBe('Bob project');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes the project', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth);

    const response = await api().delete(`/api/projects/${project.id}`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { project: { id: project.id } },
      message: 'Project deleted',
    });
    expect(await prisma.project.count()).toBe(0);
  });

  it('cannot delete another user’s project', async () => {
    const alice = await registerUser();
    const bob = await registerUser();
    const bobsProject = await createProject(bob.auth);

    const response = await api().delete(`/api/projects/${bobsProject.id}`).set(alice.auth);

    expect(response.status).toBe(404);
    expect(await prisma.project.count({ where: { id: bobsProject.id } })).toBe(1);
  });
});
