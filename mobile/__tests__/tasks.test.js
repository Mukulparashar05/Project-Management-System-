import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Alert } from 'react-native';
import { pullToRefresh, renderApp, waitForDashboard } from './helpers/renderApp';

async function openProject(name = 'Mobile launch') {
  await fireEvent.press(screen.getByRole('tab', { name: /Projects/ }));
  await fireEvent.press(await screen.findByRole('button', { name: new RegExp(`^${name}`) }));
  return screen.findByText('Write release notes');
}

const taskNames = () =>
  screen.queryAllByRole('button', { name: /\. Edit task$/ }).map((element) => element.props.accessibilityLabel.replace('. Edit task', ''));

describe('projects', () => {
  test('lists the user’s projects with progress and supports pull-to-refresh', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await fireEvent.press(screen.getByRole('tab', { name: /Projects/ }));

    expect(await screen.findByRole('button', { name: /^Mobile launch, 33% complete/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Website refresh, 0% complete/ })).toBeOnTheScreen();

    // A project created on the web appears after pulling to refresh.
    backend.db.projects.push({ ...backend.db.projects[1], id: 'project-3', name: 'Created on the web' });
    const callsBefore = backend.api.calls.filter((call) => call.url === '/projects').length;
    await pullToRefresh('projects-list');

    expect(await screen.findByRole('button', { name: /^Created on the web/ })).toBeOnTheScreen();
    expect(backend.api.calls.filter((call) => call.url === '/projects').length).toBe(callsBefore + 1);
  });
});

describe('tasks under a project', () => {
  test('shows the project summary and its tasks', async () => {
    await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    expect(screen.getByText('1 of 3 tasks completed')).toBeOnTheScreen();
    expect(taskNames()).toEqual(['Write release notes', 'Record demo video', 'Set up crash reporting']);
  });

  test('marks a task as completed with the checkbox', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Write release notes as completed' }));

    expect(await screen.findByRole('checkbox', { name: 'Mark Write release notes as not completed' })).toBeOnTheScreen();
    expect(backend.api.last('PUT', '/tasks/task-1').body).toEqual({ status: 'COMPLETED' });
    expect(await screen.findByText('2 of 3 tasks completed')).toBeOnTheScreen();
  });

  test('searches tasks by name and filters by status and priority on the server', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    await fireEvent.changeText(screen.getByLabelText('Search tasks by name'), 'demo');
    await waitFor(() => expect(taskNames()).toEqual(['Record demo video']));
    expect(backend.api.last('GET', '/tasks').params).toEqual({ projectId: 'project-1', search: 'demo' });

    await fireEvent.changeText(screen.getByLabelText('Search tasks by name'), '');
    await fireEvent.press(screen.getByRole('radio', { name: 'Status: Completed' }));
    await waitFor(() => expect(taskNames()).toEqual(['Set up crash reporting']));
    expect(backend.api.last('GET', '/tasks').params).toEqual({ projectId: 'project-1', status: 'COMPLETED' });

    await fireEvent.press(screen.getByRole('radio', { name: 'Status: All' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Priority: High' }));
    await waitFor(() => expect(taskNames()).toEqual(['Write release notes']));
    expect(backend.api.last('GET', '/tasks').params).toEqual({ projectId: 'project-1', priority: 'HIGH' });

    await fireEvent.press(screen.getByRole('radio', { name: 'Priority: Low' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Status: Pending' }));
    expect(await screen.findByText('No tasks match')).toBeOnTheScreen();
  });

  test('pull-to-refresh picks up a task created on another device', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    backend.db.tasks.push({ ...backend.db.tasks[0], id: 'task-web', name: 'Added from the web app' });
    await pullToRefresh('tasks-list');

    await waitFor(() => expect(taskNames()).toContain('Added from the web app'));
  });
});

describe('task form', () => {
  test('creates a task with priority, status and due date', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    await fireEvent.press(screen.getByRole('button', { name: 'New task' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Create task' }));
    expect(screen.getByText('Task name is required')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Task name'), '  Prepare store listing  ');
    await fireEvent.changeText(screen.getByLabelText('Description'), 'Screenshots and copy');
    await fireEvent.press(screen.getByRole('radio', { name: 'Priority: High' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Status: In progress' }));

    DateTimePickerAndroid.open.mockImplementation(({ onChange }) =>
      onChange({ type: 'set' }, new Date(2030, 4, 17)),
    );
    await fireEvent.press(screen.getByRole('button', { name: /^Due date: not set/ }));
    expect(screen.getByText('May 17, 2030')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => expect(taskNames()).toContain('Prepare store listing'));
    expect(backend.api.last('POST', '/tasks').body).toEqual({
      projectId: 'project-1',
      name: 'Prepare store listing',
      description: 'Screenshots and copy',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2030-05-17',
    });
  });

  test('edits status and priority of an existing task', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    await fireEvent.press(screen.getByRole('button', { name: 'Record demo video. Edit task' }));
    expect(await screen.findByDisplayValue('Record demo video')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Priority: Medium' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Status: Completed' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(backend.api.last('PUT', '/tasks/task-2')).toBeDefined());
    expect(backend.api.last('PUT', '/tasks/task-2').body).toMatchObject({ priority: 'MEDIUM', status: 'COMPLETED' });
    expect(await screen.findByRole('checkbox', { name: 'Mark Record demo video as not completed' })).toBeOnTheScreen();
  });

  test('deletes a task only after confirmation', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    await fireEvent.press(screen.getByRole('button', { name: 'Write release notes. Edit task' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete task' }));

    expect(alertSpy).toHaveBeenCalledWith('Delete task?', expect.stringContaining('Write release notes'), expect.any(Array));
    expect(backend.api.last('DELETE', '/tasks/task-1')).toBeUndefined();

    const confirm = alertSpy.mock.calls[0][2].find((button) => button.style === 'destructive');
    await act(() => confirm.onPress());

    await waitFor(() => expect(taskNames()).not.toContain('Write release notes'));
    expect(backend.api.last('DELETE', '/tasks/task-1')).toBeDefined();
  });

  test('shows a server error, e.g. when the task was deleted elsewhere', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    await openProject();

    await fireEvent.press(screen.getByRole('button', { name: 'Record demo video. Edit task' }));
    await screen.findByDisplayValue('Record demo video');
    backend.db.tasks = backend.db.tasks.filter((task) => task.id !== 'task-2');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Task not found')).toBeOnTheScreen();
    expect(within(screen.getByRole('alert')).getByText('Task not found')).toBeOnTheScreen();
  });
});
