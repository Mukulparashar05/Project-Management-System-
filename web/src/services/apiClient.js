import axios from 'axios';
import { tokenStorage } from './tokenStorage.js';

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');

// Error codes the API uses when the presented token can no longer be used.
const SESSION_ERROR_CODES = new Set(['AUTH_REQUIRED', 'TOKEN_EXPIRED', 'TOKEN_INVALID']);

export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN', fieldErrors = {}, canceled = false }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.canceled = canceled;
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError({ message: 'Request canceled', code: 'CANCELED', canceled: true });
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({
      message: 'The server is taking too long to respond. Please try again.',
      code: 'TIMEOUT',
    });
  }
  if (!error.response) {
    return new ApiError({
      message: 'Unable to reach the server. Check your internet connection and try again.',
      code: 'NETWORK_ERROR',
    });
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

/** Registers the callback used when an authenticated request is rejected with 401. */
export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = null;
  };
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    const sentToken = Boolean(error.config?.headers?.Authorization);
    if (apiError.status === 401 && sentToken && SESSION_ERROR_CODES.has(apiError.code)) {
      sessionExpiredHandler?.(apiError);
    }
    return Promise.reject(apiError);
  },
);

/** Unwraps the API's { success, data, message } envelope. */
export async function request(config) {
  const response = await apiClient.request(config);
  return response.data.data;
}

// Drops empty filters so query strings stay clean (the API treats empty values as "no filter").
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}
