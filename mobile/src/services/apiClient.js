import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { API_URL, REQUEST_TIMEOUT_MS } from '../config';
import { NO_CONNECTION_MESSAGE, SERVER_UNREACHABLE_MESSAGE } from '../utils/constants';
import { tokenStorage } from './tokenStorage';

// Error codes the API returns when the presented token can no longer be used.
const SESSION_ERROR_CODES = new Set(['AUTH_REQUIRED', 'TOKEN_EXPIRED', 'TOKEN_INVALID']);
const CONNECTIVITY_CODES = new Set(['OFFLINE', 'NETWORK_ERROR', 'TIMEOUT']);

export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN', fieldErrors = {} }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get isConnectivityError() {
    return CONNECTIVITY_CODES.has(this.code);
  }
}

async function isDeviceOffline() {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === false || state.isInternetReachable === false;
  } catch {
    return false;
  }
}

export async function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (!error.response) {
    // No HTTP response at all: tell "phone is offline" apart from "server unreachable".
    if (await isDeviceOffline()) return new ApiError({ message: NO_CONNECTION_MESSAGE, code: 'OFFLINE' });
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        message: 'The server is taking too long to respond. Please try again.',
        code: 'TIMEOUT',
      });
    }
    return new ApiError({ message: SERVER_UNREACHABLE_MESSAGE, code: 'NETWORK_ERROR' });
  }

  const { status, data } = error.response;
  const fieldErrors = Object.fromEntries(
    (data?.errors ?? []).map((fieldError) => [fieldError.field, fieldError.message]),
  );
  return new ApiError({
    status,
    code: data?.code ?? `HTTP_${status}`,
    message: data?.message ?? 'Something went wrong. Please try again.',
    fieldErrors,
  });
}

let sessionExpiredHandler = null;

/** Registers the callback that ends the session when an authenticated request gets a 401. */
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null;
  };
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = await toApiError(error);
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (apiError.status === 401 && sentToken && SESSION_ERROR_CODES.has(apiError.code)) {
      await sessionExpiredHandler?.(apiError);
    }
    throw apiError;
  },
);

/** Performs a request and unwraps the API's { success, data, message } envelope. */
export async function request(config) {
  const response = await apiClient.request(config);
  return response.data.data;
}

export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}
