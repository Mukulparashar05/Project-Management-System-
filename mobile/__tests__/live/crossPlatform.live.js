/**
 * Live cross-platform checks: the real mobile app (screens, contexts, services) runs against a
 * real Orbit API and database that the web app also uses. Started by web/e2e/cross-platform.spec.js,
 * which drives the web side and passes the shared account through environment variables.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import App from '../../src/App';
import { apiClient } from '../../src/services/apiClient';
import { pullToRefresh } from '../helpers/renderApp';
import { nodeHttpAdapter } from './nodeHttpAdapter';

const { ORBIT_LIVE_API_URL, ORBIT_LIVE_EMAIL, ORBIT_LIVE_PASSWORD, ORBIT_LIVE_PROJECT, ORBIT_LIVE_SYNC_DIR } =
  process.env;
const WAIT = { timeout: 10_000 };

beforeAll(() => {
  if (!ORBIT_LIVE_API_URL || !ORBIT_LIVE_EMAIL || !ORBIT_LIVE_PROJECT) {
    throw new Error('Live tests are started by web/e2e/cross-platform.spec.js, which sets ORBIT_LIVE_* variables.');
  }
  apiClient.defaults.baseURL = ORBIT_LIVE_API_URL;
  apiClient.defaults.adapter = nodeHttpAdapter;
});

/** Tells the web side we are ready, then waits until it has made its change. */
async function handOverToWeb(step) {
  writeFileSync(join(ORBIT_LIVE_SYNC_DIR, `${step}.ready`), '');
  const done = join(ORBIT_LIVE_SYNC_DIR, `${step}.done`);
  const deadline = Date.now() + 45_000;
  while (!existsSync(done)) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for the web step "${step}"`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function signInOnPhone() {
  await render(<App />);
  await fireEvent.changeText(await screen.findByLabelText('Email address', {}, WAIT), ORBIT_LIVE_EMAIL);
  await fireEvent.changeText(screen.getByLabelText('Password'), ORBIT_LIVE_PASSWORD);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText(/Good (morning|afternoon|evening)/, {}, WAIT);
}

async function openSharedProject() {
  await fireEvent.press(screen.getByRole('tab', { name: /Projects/ }));
  await fireEvent.press(await screen.findByRole('button', { name: new RegExp(`^${ORBIT_LIVE_PROJECT}, `) }, WAIT));
}

const taskRow = (name) => screen.getByRole('button', { name: `${name}. Edit task` });

test('phase 1: sees web data on the phone, then edits and creates tasks there', async () => {
  await signInOnPhone();
  // Dashboard numbers come from the same database the web app wrote to.
  expect(await screen.findByLabelText('Total projects: 1', {}, WAIT)).toBeOnTheScreen();
  expect(screen.getByLabelText('Total tasks: 1')).toBeOnTheScreen();

  await openSharedProject();
  await screen.findByText('Created on web', {}, WAIT);

  await fireEvent.press(screen.getByRole('checkbox', { name: 'Mark Created on web as completed' }));
  await screen.findByRole('checkbox', { name: 'Mark Created on web as not completed' }, WAIT);

  await fireEvent.press(taskRow('Created on web'));
  await screen.findByDisplayValue('Created on web', {}, WAIT);
  await fireEvent.press(screen.getByRole('radio', { name: 'Priority: High' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(within(taskRow('Created on web')).getByText('High priority')).toBeOnTheScreen(), WAIT);

  await fireEvent.press(screen.getByRole('button', { name: 'New task' }));
  await fireEvent.changeText(await screen.findByLabelText('Task name', {}, WAIT), 'Created on Android');
  await fireEvent.press(screen.getByRole('button', { name: 'Create task' }));
  expect(await screen.findByRole('button', { name: 'Created on Android. Edit task' }, WAIT)).toBeOnTheScreen();
});

test('phase 2: pull-to-refresh shows a change that was made on the web meanwhile', async () => {
  await signInOnPhone();
  await openSharedProject();
  await screen.findByRole('button', { name: 'Created on Android. Edit task' }, WAIT);
  expect(within(taskRow('Created on Android')).getByText('Pending')).toBeOnTheScreen();

  await handOverToWeb('web-change');
  await pullToRefresh('tasks-list');

  await waitFor(() => expect(within(taskRow('Created on Android')).getByText('In progress')).toBeOnTheScreen(), WAIT);
  expect(screen.getByRole('button', { name: 'Renamed on web. Edit task' })).toBeOnTheScreen();
});
