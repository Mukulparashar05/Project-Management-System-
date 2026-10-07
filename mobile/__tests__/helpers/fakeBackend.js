import { fail, installMockApi, NETWORK_FAILURE, ok } from './mockApi';

const PASSWORD = 'Password123';

function countBy(items, key, keys) {
  const counts = Object.fromEntries(keys.map((value) => [value, 0]));
  for (const item of items) counts[item[key]] += 1;
  return counts;
}

function nameMatches(item, search) {
  return !search || item.name.toLowerCase().includes(String(search).toLowerCase());
}

/**
 * In-memory stand-in for the Orbit REST API with the same routes, envelopes, status codes and
 * error codes as the real backend. Tests drive the real app against it.
 */
export function createFakeBackend() {
  // Generated ids start high so they never collide with the seeded ids below.
  let sequence = 100;
  const nextId = (prefix) => `${prefix}-${(sequence += 1)}`;
  const now = '2026-10-06T09:00:00.000Z';

  const db = {
    users: [{ id: 'user-1', fullName: 'Ada Example', email: 'ada@example.test', password: PASSWORD, createdAt: now, updatedAt: now }],
    tokens: new Map(),
    expiredTokens: new Set(),
    projects: [
      {
        id: 'project-1',
        userId: 'user-1',
        name: 'Mobile launch',
        description: 'Ship the Android app',
        status: 'IN_PROGRESS',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'project-2',
        userId: 'user-1',
        name: 'Website refresh',
        description: null,
        status: 'NOT_STARTED',
        startDate: null,
        endDate: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [
      { id: 'task-1', userId: 'user-1', projectId: 'project-1', name: 'Write release notes', description: null, priority: 'HIGH', status: 'PENDING', dueDate: '2030-01-10', createdAt: now, updatedAt: now },
      { id: 'task-2', userId: 'user-1', projectId: 'project-1', name: 'Record demo video', description: 'Five minutes', priority: 'LOW', status: 'IN_PROGRESS', dueDate: null, createdAt: now, updatedAt: now },
      { id: 'task-3', userId: 'user-1', projectId: 'project-1', name: 'Set up crash reporting', description: null, priority: 'MEDIUM', status: 'COMPLETED', dueDate: null, createdAt: now, updatedAt: now },
    ],
  };
  let offline = false;

  const publicUser = ({ password: _password, ...user }) => user;

  const serializeTask = (task) => {
    const project = db.projects.find((item) => item.id === task.projectId);
    const { userId: _userId, ...rest } = task;
    return { ...rest, project: { id: project.id, name: project.name } };
  };

  const serializeProject = (project) => {
    const tasks = db.tasks.filter((task) => task.projectId === project.id);
    const counts = countBy(tasks, 'status', ['PENDING', 'IN_PROGRESS', 'COMPLETED']);
    const taskCounts = { total: tasks.length, pending: counts.PENDING, inProgress: counts.IN_PROGRESS, completed: counts.COMPLETED };
    const { userId: _userId, ...rest } = project;
    return { ...rest, taskCounts, progress: tasks.length ? Math.round((counts.COMPLETED / tasks.length) * 100) : 0 };
  };

  function issueToken(userId) {
    const token = `token-${(sequence += 1)}`;
    db.tokens.set(token, userId);
    return token;
  }

  // Wraps handlers so authentication and connectivity behave like the real API.
  const guarded = (handler) => (call) => {
    if (offline) return NETWORK_FAILURE;
    const token = call.headers.Authorization?.replace('Bearer ', '');
    if (!token) return fail(401, 'Authentication required. Please log in.', 'AUTH_REQUIRED');
    if (db.expiredTokens.has(token)) return fail(401, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    const userId = db.tokens.get(token);
    if (!userId) return fail(401, 'Your session is no longer valid. Please log in again.', 'TOKEN_INVALID');
    return handler({ ...call, userId, token });
  };
  const open = (handler) => (call) => (offline ? NETWORK_FAILURE : handler(call));

  const findOwned = (collection, id, userId) => collection.find((item) => item.id === id && item.userId === userId);

  const api = installMockApi({
    'POST /auth/register': open(({ body }) => {
      if (db.users.some((user) => user.email === body.email.toLowerCase())) {
        return fail(409, 'An account with this email already exists', 'EMAIL_IN_USE');
      }
      const user = { id: nextId('user'), ...body, email: body.email.toLowerCase(), createdAt: now, updatedAt: now };
      db.users.push(user);
      return ok({ user: publicUser(user), token: issueToken(user.id) }, 201);
    }),
    'POST /auth/login': open(({ body }) => {
      const user = db.users.find((item) => item.email === body.email.toLowerCase());
      if (!user || user.password !== body.password) {
        return fail(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
      }
      return ok({ user: publicUser(user), token: issueToken(user.id) });
    }),
    'POST /auth/logout': guarded(({ token }) => {
      db.tokens.delete(token);
      return ok(null);
    }),
    'GET /auth/me': guarded(({ userId }) => ok({ user: publicUser(db.users.find((user) => user.id === userId)) })),
    'GET /dashboard': guarded(({ userId }) => {
      const projects = db.projects.filter((project) => project.userId === userId);
      const tasks = db.tasks.filter((task) => task.userId === userId);
      const projectsByStatus = countBy(projects, 'status', ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);
      const tasksByStatus = countBy(tasks, 'status', ['PENDING', 'IN_PROGRESS', 'COMPLETED']);
      return ok({
        stats: {
          totalProjects: projects.length,
          totalTasks: tasks.length,
          completedTasks: tasksByStatus.COMPLETED,
          pendingTasks: tasksByStatus.PENDING,
          inProgressTasks: tasksByStatus.IN_PROGRESS,
          projectsInProgress: projectsByStatus.IN_PROGRESS,
          completionRate: tasks.length ? Math.round((tasksByStatus.COMPLETED / tasks.length) * 100) : 0,
        },
        projectsByStatus,
        tasksByStatus,
        upcomingTasks: tasks
          .filter((task) => task.dueDate && task.status !== 'COMPLETED')
          .map(serializeTask),
      });
    }),
    'GET /projects': guarded(({ userId, params }) =>
      ok({
        projects: db.projects
          .filter((project) => project.userId === userId)
          .filter((project) => nameMatches(project, params.search) && (!params.status || project.status === params.status))
          .map(serializeProject),
      }),
    ),
    'GET /projects/:id': guarded(({ userId, pathParams }) => {
      const project = findOwned(db.projects, pathParams.id, userId);
      return project ? ok({ project: serializeProject(project) }) : fail(404, 'Project not found', 'NOT_FOUND');
    }),
    'GET /tasks': guarded(({ userId, params }) =>
      ok({
        tasks: db.tasks
          .filter((task) => task.userId === userId && (!params.projectId || task.projectId === params.projectId))
          .filter((task) => nameMatches(task, params.search))
          .filter((task) => (!params.status || task.status === params.status) && (!params.priority || task.priority === params.priority))
          .map(serializeTask),
      }),
    ),
    'POST /tasks': guarded(({ userId, body }) => {
      if (!findOwned(db.projects, body.projectId, userId)) return fail(404, 'Project not found', 'NOT_FOUND');
      const task = { id: nextId('task'), userId, createdAt: now, updatedAt: now, ...body };
      db.tasks.push(task);
      return ok({ task: serializeTask(task) }, 201);
    }),
    'PUT /tasks/:id': guarded(({ userId, pathParams, body }) => {
      const task = findOwned(db.tasks, pathParams.id, userId);
      if (!task) return fail(404, 'Task not found', 'NOT_FOUND');
      Object.assign(task, body);
      return ok({ task: serializeTask(task) });
    }),
    'DELETE /tasks/:id': guarded(({ userId, pathParams }) => {
      const task = findOwned(db.tasks, pathParams.id, userId);
      if (!task) return fail(404, 'Task not found', 'NOT_FOUND');
      db.tasks = db.tasks.filter((item) => item.id !== task.id);
      return ok({ task: { id: task.id, projectId: task.projectId } });
    }),
  });

  return {
    db,
    api,
    password: PASSWORD,
    /** Pretends a token was issued earlier, as if the user had logged in on a previous launch. */
    issueToken,
    expireAllTokens: () => db.tokens.forEach((_userId, token) => db.expiredTokens.add(token)),
    setOffline: (value) => {
      offline = value;
    },
  };
}
