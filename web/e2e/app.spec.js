import { expect, test } from '@playwright/test';
import {
  apiCall,
  loginViaUi,
  PASSWORD,
  registerViaApi,
  signExpiredToken,
  TOKEN_STORAGE_KEY,
  uniqueEmail,
} from './support/helpers.js';

test.describe('authentication', () => {
  test('redirects unauthenticated visitors to the login page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Manage projects/ })).toBeVisible();
  });

  test('registers, lands on an empty dashboard, logs out and logs back in', async ({ page }) => {
    const email = uniqueEmail('register');
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Grace Example');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /, Grace$/ })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Total projects' })).toContainText('0');
    await expect(page.getByText('Start your first project')).toBeVisible();

    // The session survives a full page reload.
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY)).toBeNull();

    await loginViaUi(page, { email });
    await expect(page.getByRole('heading', { name: /, Grace$/ })).toBeVisible();
  });

  test('validates the login form and reports wrong credentials', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await page.goto('/login');

    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();

    await page.getByLabel('Email address').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword9');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('rejects a duplicate email during registration', async ({ page, request }) => {
    const existing = await registerViaApi(request);
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Someone Else');
    await page.getByLabel('Email address').fill(existing.email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('An account with this email already exists')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('returns to login with a clear message when the session expires', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUi(page, user);

    const me = await apiCall(request, user.token, 'GET', '/auth/me');
    const expiredToken = signExpiredToken(me.user.id);
    await page.evaluate(([key, token]) => localStorage.setItem(key, token), [TOKEN_STORAGE_KEY, expiredToken]);

    await page.getByRole('link', { name: 'Projects' }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Your session has expired. Please log in again.')).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY)).toBeNull();
  });
});

test.describe('projects and tasks', () => {
  test('creates, searches, filters, edits and deletes projects', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await loginViaUi(page, user);
    await page.getByRole('link', { name: 'Projects' }).first().click();
    await expect(page.getByText('No projects yet')).toBeVisible();

    const createProject = async ({ name, status, startDate, endDate }) => {
      await page.getByRole('button', { name: 'New project' }).first().click();
      const dialog = page.getByRole('dialog', { name: 'New project' });
      await dialog.getByLabel('Project name').fill(name);
      if (status) await dialog.getByLabel('Status').selectOption(status);
      if (startDate) await dialog.getByLabel('Start date').fill(startDate);
      if (endDate) await dialog.getByLabel('End date').fill(endDate);
      await dialog.getByRole('button', { name: 'Create project' }).click();
      await expect(page.getByText(`Project “${name}” created`)).toBeVisible();
    };

    // Date-order validation happens before anything is sent.
    await page.getByRole('button', { name: 'New project' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New project' });
    await dialog.getByLabel('Project name').fill('Bad dates');
    await dialog.getByLabel('Start date').fill('2026-10-20');
    await dialog.getByLabel('End date').fill('2026-10-01');
    await dialog.getByRole('button', { name: 'Create project' }).click();
    await expect(dialog.getByText('End date must be on or after the start date')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await createProject({ name: 'Website relaunch', status: 'IN_PROGRESS', startDate: '2026-10-01', endDate: '2026-11-15' });
    await createProject({ name: 'Mobile beta' });
    await expect(page.getByRole('article')).toHaveCount(2);

    await page.getByLabel('Search projects by name').fill('website');
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Website relaunch' })).toBeVisible();
    await page.getByLabel('Search projects by name').fill('');

    await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: 'Not started' }).click();
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Mobile beta' })).toBeVisible();
    await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: 'Completed' }).click();
    await expect(page.getByText('No projects match your filters')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('article')).toHaveCount(2);

    await page.getByRole('button', { name: 'Edit Mobile beta' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit project' });
    await editDialog.getByLabel('Project name').fill('Android beta');
    await editDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Project updated')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Android beta' })).toBeVisible();

    await page.getByRole('link', { name: 'Website relaunch' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Website relaunch' })).toBeVisible();
    await expect(page.getByText(/Oct 1, 2026 → Nov 15, 2026/)).toBeVisible();

    await page.getByRole('link', { name: 'All projects' }).click();
    await page.getByRole('button', { name: 'Delete Android beta' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Delete project?' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: 'Delete project' }).click();
    await expect(page.getByText('Deleted “Android beta”')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(1);
  });

  test('manages tasks inside a project', async ({ page, request }) => {
    const user = await registerViaApi(request);
    const project = await apiCall(request, user.token, 'POST', '/projects', { name: 'Launch plan' });
    await loginViaUi(page, user);
    await page.goto(`/projects/${project.project.id}`);
    await expect(page.getByText('No tasks yet')).toBeVisible();

    const createTask = async ({ name, priority }) => {
      await page.getByRole('button', { name: 'New task' }).click();
      const dialog = page.getByRole('dialog', { name: 'New task' });
      await dialog.getByLabel('Task name').fill(name);
      if (priority) await dialog.getByLabel('Priority').selectOption(priority);
      await dialog.getByRole('button', { name: 'Create task' }).click();
      await expect(page.getByText(`Task “${name}” created`)).toBeVisible();
    };

    await page.getByRole('button', { name: 'New task' }).click();
    await page.getByRole('dialog', { name: 'New task' }).getByRole('button', { name: 'Create task' }).click();
    await expect(page.getByText('Task name is required')).toBeVisible();
    await page.getByRole('dialog', { name: 'New task' }).getByRole('button', { name: 'Cancel' }).click();

    await createTask({ name: 'Write release notes', priority: 'HIGH' });
    await createTask({ name: 'Record demo video', priority: 'LOW' });
    await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem')).toHaveCount(2);

    await page.getByRole('checkbox', { name: 'Mark “Write release notes” as completed' }).click();
    await expect(page.getByText('Task marked as completed')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Mark “Write release notes” as not completed' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByText('1 of 2 tasks completed')).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Project progress' })).toHaveAttribute('aria-valuenow', '50');

    await page.getByLabel('Status of Record demo video').selectOption('IN_PROGRESS');
    await expect(page.getByText('Status set to In progress')).toBeVisible();
    await page.getByLabel('Priority of Record demo video').selectOption('MEDIUM');
    await expect(page.getByText('Priority set to Medium')).toBeVisible();

    await page.getByLabel('Search tasks by name').fill('release');
    await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem')).toHaveCount(1);
    await page.getByLabel('Search tasks by name').fill('');
    await page.getByLabel('Filter by status').selectOption('IN_PROGRESS');
    await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem')).toHaveCount(1);
    await expect(page.getByText('Record demo video')).toBeVisible();
    await page.getByLabel('Filter by status').selectOption('');
    await page.getByLabel('Filter by priority').selectOption('HIGH');
    await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem')).toHaveCount(1);
    await expect(page.getByText('Write release notes')).toBeVisible();
    await page.getByLabel('Filter by priority').selectOption('LOW');
    await expect(page.getByText('No tasks match your filters')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).first().click();

    await page.getByRole('button', { name: 'Edit Record demo video' }).click();
    const editDialog = page.getByRole('dialog', { name: 'Edit task' });
    await editDialog.getByLabel('Task name').fill('Record 5-minute demo');
    await editDialog.getByLabel('Due date').fill('2026-12-01');
    await editDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Task updated')).toBeVisible();
    await expect(page.getByText('Record 5-minute demo')).toBeVisible();

    await page.getByRole('button', { name: 'Delete Record 5-minute demo' }).click();
    await page.getByRole('alertdialog', { name: 'Delete task?' }).getByRole('button', { name: 'Delete task' }).click();
    await expect(page.getByText('Task deleted')).toBeVisible();
    await expect(page.getByRole('list', { name: 'Tasks' }).getByRole('listitem')).toHaveCount(1);
    await expect(page.getByText('1 of 1 task completed')).toBeVisible();
  });

  test('dashboard statistics come from the database', async ({ page, request }) => {
    const user = await registerViaApi(request);
    const { project: active } = await apiCall(request, user.token, 'POST', '/projects', {
      name: 'Active project',
      status: 'IN_PROGRESS',
    });
    await apiCall(request, user.token, 'POST', '/projects', { name: 'Backlog project' });
    await apiCall(request, user.token, 'POST', '/tasks', { projectId: active.id, name: 'Done', status: 'COMPLETED' });
    await apiCall(request, user.token, 'POST', '/tasks', { projectId: active.id, name: 'Todo 1' });
    await apiCall(request, user.token, 'POST', '/tasks', { projectId: active.id, name: 'Todo 2', dueDate: '2030-01-15' });

    await loginViaUi(page, user);
    await expect(page.getByRole('group', { name: 'Total projects' })).toContainText('2');
    await expect(page.getByRole('group', { name: 'Total tasks' })).toContainText('3');
    await expect(page.getByRole('group', { name: 'Completed tasks' })).toContainText('1');
    await expect(page.getByRole('group', { name: 'Pending tasks' })).toContainText('2');
    await expect(page.getByRole('group', { name: 'Projects in progress' })).toContainText('1');
    await expect(page.getByRole('heading', { name: 'Up next' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Todo 2' })).toBeVisible();
  });

  test('a user cannot open another user’s project', async ({ page, request }) => {
    const owner = await registerViaApi(request);
    const { project } = await apiCall(request, owner.token, 'POST', '/projects', { name: 'Private roadmap' });
    const intruder = await registerViaApi(request);

    await loginViaUi(page, intruder);
    await page.goto(`/projects/${project.id}`);
    await expect(page.getByText('Project not found')).toBeVisible();
    await expect(page.getByText('Private roadmap')).toHaveCount(0);
  });
});

test.describe('small screens', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps the login form usable on a phone-sized viewport', async ({ page, request }) => {
    const user = await registerViaApi(request);
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeInViewport();
    await loginViaUi(page, user);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
  });
});
