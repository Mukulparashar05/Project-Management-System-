import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { NO_CONNECTION_MESSAGE } from '../src/utils/constants';
import { renderApp, setDeviceOnline, TOKEN_KEY, waitForDashboard } from './helpers/renderApp';

async function fillLogin(email, password) {
  await fireEvent.changeText(screen.getByLabelText('Email address'), email);
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
}

describe('login', () => {
  test('signs in, stores the token in SecureStore and shows the dashboard', async () => {
    const backend = await renderApp();
    await screen.findByText('Manage projects.');

    await fillLogin('ada@example.test', backend.password);
    await waitForDashboard();

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, expect.stringMatching(/^token-/), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // Later requests authenticate with the stored token.
    const dashboardCall = backend.api.last('GET', '/dashboard');
    expect(dashboardCall.headers.Authorization).toBe(`Bearer ${await SecureStore.getItemAsync(TOKEN_KEY)}`);
  });

  test('validates the form before calling the API', async () => {
    const backend = await renderApp();
    await screen.findByText('Manage projects.');

    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Email is required')).toBeOnTheScreen();
    expect(screen.getByText('Password is required')).toBeOnTheScreen();
    expect(backend.api.calls).toHaveLength(0);
  });

  test('shows the API error for wrong credentials', async () => {
    await renderApp();
    await screen.findByText('Manage projects.');

    await fillLogin('ada@example.test', 'WrongPassword1');

    expect(await screen.findByText('Invalid email or password')).toBeOnTheScreen();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

describe('registration', () => {
  async function fillRegistration({ fullName, email, password, confirmPassword = password }) {
    await fireEvent.changeText(screen.getByLabelText('Full name'), fullName);
    await fireEvent.changeText(screen.getByLabelText('Email address'), email);
    await fireEvent.changeText(screen.getByLabelText('Password'), password);
    await fireEvent.changeText(screen.getByLabelText('Confirm password'), confirmPassword);
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  }

  test('creates an account and signs straight in', async () => {
    const backend = await renderApp();
    await fireEvent.press(await screen.findByRole('link', { name: 'Create an account' }));

    await fillRegistration({ fullName: 'Grace Example', email: 'grace@example.test', password: 'Password123' });

    expect(await screen.findByText(/Good (morning|afternoon|evening), Grace/)).toBeOnTheScreen();
    expect(backend.api.last('POST', '/auth/register').body).toEqual({
      fullName: 'Grace Example',
      email: 'grace@example.test',
      password: 'Password123',
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, expect.any(String), expect.any(Object));
  });

  test('reports a duplicate email next to the email field', async () => {
    await renderApp();
    await fireEvent.press(await screen.findByRole('link', { name: 'Create an account' }));

    await fillRegistration({ fullName: 'Ada Again', email: 'ada@example.test', password: 'Password123' });

    expect(await screen.findByText('An account with this email already exists')).toBeOnTheScreen();
  });

  test('checks password rules and confirmation locally', async () => {
    const backend = await renderApp();
    await fireEvent.press(await screen.findByRole('link', { name: 'Create an account' }));

    await fillRegistration({
      fullName: 'Short Password',
      email: 'short@example.test',
      password: 'abc',
      confirmPassword: 'abd',
    });

    expect(screen.getByText('Password needs at least 8 characters')).toBeOnTheScreen();
    expect(screen.getByText('Passwords do not match')).toBeOnTheScreen();
    expect(backend.api.last('POST', '/auth/register')).toBeUndefined();
  });
});

describe('session lifecycle', () => {
  test('restores a stored session on launch', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();
    expect(backend.api.last('GET', '/auth/me')).toBeDefined();
  });

  test('logs out after confirmation, revokes the token and clears secure storage', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();

    await fireEvent.press(screen.getByRole('tab', { name: /Account/ }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Log out' }));
    const confirm = alertSpy.mock.calls[0][2].find((button) => button.text === 'Log out');
    await act(() => confirm.onPress());

    expect(await screen.findByText('Manage projects.')).toBeOnTheScreen();
    expect(backend.api.last('POST', '/auth/logout')).toBeDefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  test('an expired token sends the user to login with a clear message', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();

    backend.expireAllTokens();
    await fireEvent.press(screen.getByRole('tab', { name: /Projects/ }));

    expect(await screen.findByText('Your session has expired. Please log in again.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen();
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  test('without network on launch it explains the problem and recovers on retry', async () => {
    const backend = await renderApp({ signedIn: true, offline: true });

    expect(await screen.findByText('Can’t verify your session')).toBeOnTheScreen();
    // Shown both in the offline banner and in the error message itself.
    expect(screen.getAllByText(NO_CONNECTION_MESSAGE)).toHaveLength(2);
    // The stored session is kept: being offline is not a reason to sign the user out.
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).not.toBeNull();

    backend.setOffline(false);
    await setDeviceOnline(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await waitForDashboard();
  });
});

describe('connectivity', () => {
  test('shows the offline banner and a friendly error instead of a blank screen', async () => {
    const backend = await renderApp({ signedIn: true });
    await waitForDashboard();

    backend.setOffline(true);
    await setDeviceOnline(false);
    expect(screen.getByText(NO_CONNECTION_MESSAGE)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: /Projects/ }));
    expect(await screen.findByText('Couldn’t load projects')).toBeOnTheScreen();
    // Once in the banner and once in the error state of the list.
    expect(screen.getAllByText(NO_CONNECTION_MESSAGE)).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();

    backend.setOffline(false);
    await setDeviceOnline(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Mobile launch')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText(NO_CONNECTION_MESSAGE)).toBeNull());
  });
});
