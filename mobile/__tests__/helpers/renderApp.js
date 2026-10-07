import NetInfo from '@react-native-community/netinfo';
import { act, render, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import App from '../../src/App';
import { createFakeBackend } from './fakeBackend';

export const TOKEN_KEY = 'orbit.authToken';
const ONLINE = { type: 'wifi', isConnected: true, isInternetReachable: true };
const OFFLINE = { type: 'none', isConnected: false, isInternetReachable: false };

let netInfoListeners = [];

/**
 * Resets native fakes and renders the whole app.
 * signedIn: a token from an earlier launch is already in SecureStore.
 * offline:  the device has no connection when the app starts.
 */
export async function renderApp({ signedIn = false, offline = false } = {}) {
  SecureStore.__resetStore();
  jest.clearAllMocks();
  netInfoListeners = [];
  const initialState = offline ? OFFLINE : ONLINE;
  NetInfo.fetch.mockResolvedValue(initialState);
  NetInfo.addEventListener.mockImplementation((listener) => {
    netInfoListeners.push(listener);
    listener(initialState);
    return () => {
      netInfoListeners = netInfoListeners.filter((item) => item !== listener);
    };
  });

  const backend = createFakeBackend();
  backend.setOffline(offline);
  if (signedIn) await SecureStore.setItemAsync(TOKEN_KEY, backend.issueToken('user-1'));
  SecureStore.setItemAsync.mockClear();

  await render(<App />);
  return backend;
}

/** Triggers the list's RefreshControl the way a pull-to-refresh gesture does. */
export async function pullToRefresh(listTestId) {
  const list = screen.getByTestId(listTestId);
  await act(() => list.props.refreshControl.props.onRefresh());
}

/** Simulates the device losing (or regaining) its connection. */
export async function setDeviceOnline(online) {
  NetInfo.fetch.mockResolvedValue(online ? ONLINE : OFFLINE);
  await act(() => {
    netInfoListeners.forEach((listener) => listener(online ? ONLINE : OFFLINE));
  });
}

export async function waitForDashboard() {
  expect(await screen.findByText(/Good (morning|afternoon|evening), Ada/)).toBeOnTheScreen();
}
