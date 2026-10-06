import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, createProject, createTask, prisma, registerUser, resetDatabase } from './helpers.js';

beforeEach(resetDatabase);
afterAll(() => prisma.$disconnect());

describe('GET /api/dashboard', () => {
  it('returns zeros for a new user', async () => {
    const { auth } = await registerUser();
    const response = await api().get('/api/dashboard').set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      stats: {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        projectsInProgress: 0,
        completionRate: 0,
      },
      projectsByStatus: { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      tasksByStatus: { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      upcomingTasks: [],
    });
  });

  it('aggregates only the authenticated user’s data and stays in sync with changes', async () => {
    const alice = await registerUser();
    const bob = await registerUser();

    const website = await createProject(alice.auth, { name: 'Website', status: 'IN_PROGRESS' });
    const app = await createProject(alice.auth, { name: 'App', status: 'IN_PROGRESS' });
    await createProject(alice.auth, { name: 'Backlog', status: 'NOT_STARTED' });
    await createProject(alice.auth, { name: 'Done', status: 'COMPLETED' });

    const pendingTask = await createTask(alice.auth, website.id, { status: 'PENDING' });
    await createTask(alice.auth, website.id, { status: 'PENDING' });
    await createTask(alice.auth, website.id, { status: 'IN_PROGRESS' });
    await createTask(alice.auth, app.id, { status: 'COMPLETED' });

    const bobsProject = await createProject(bob.auth, { status: 'IN_PROGRESS' });
    await createTask(bob.auth, bobsProject.id, { status: 'COMPLETED' });
    await createTask(bob.auth, bobsProject.id, { status: 'PENDING' });

    const before = await api().get('/api/dashboard').set(alice.auth);
    expect(before.body.data.stats).toEqual({
      totalProjects: 4,
      totalTasks: 4,
      completedTasks: 1,
      pendingTasks: 2,
      inProgressTasks: 1,
      projectsInProgress: 2,
      completionRate: 25,
    });
    expect(before.body.data.projectsByStatus).toEqual({ NOT_STARTED: 1, IN_PROGRESS: 2, COMPLETED: 1 });

    await api().put(`/api/tasks/${pendingTask.id}`).set(alice.auth).send({ status: 'COMPLETED' }).expect(200);
    await api().put(`/api/projects/${app.id}`).set(alice.auth).send({ status: 'COMPLETED' }).expect(200);

    const after = await api().get('/api/dashboard').set(alice.auth);
    expect(after.body.data.stats).toMatchObject({
      completedTasks: 2,
      pendingTasks: 1,
      projectsInProgress: 1,
      completionRate: 50,
    });
  });

  it('lists the next open tasks by due date, skipping completed and undated tasks', async () => {
    const { auth } = await registerUser();
    const project = await createProject(auth, { name: 'Release' });
    await createTask(auth, project.id, { name: 'Later', dueDate: '2026-12-01' });
    await createTask(auth, project.id, { name: 'Soonest', dueDate: '2026-10-08' });
    await createTask(auth, project.id, { name: 'Finished', dueDate: '2026-10-07', status: 'COMPLETED' });
    await createTask(auth, project.id, { name: 'No date' });
    for (let day = 10; day <= 15; day += 1) {
      await createTask(auth, project.id, { name: `Day ${day}`, dueDate: `2026-10-${day}` });
    }

    const response = await api().get('/api/dashboard').set(auth);
    const upcoming = response.body.data.upcomingTasks;

    expect(upcoming.map((task) => task.name)).toEqual(['Soonest', 'Day 10', 'Day 11', 'Day 12', 'Day 13']);
    expect(upcoming[0]).toMatchObject({
      dueDate: '2026-10-08',
      project: { id: project.id, name: 'Release' },
    });
  });

  it('requires authentication', async () => {
    const response = await api().get('/api/dashboard');
    expect(response.status).toBe(401);
  });
});
