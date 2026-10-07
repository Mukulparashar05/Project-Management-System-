import { AxiosError } from 'axios';
import { apiClient } from '../../src/services/apiClient';

/** Builds the API's success envelope. */
export const ok = (data, status = 200) => ({ status, body: { success: true, data, message: 'OK' } });

/** Builds the API's error envelope. */
export const fail = (status, message, code) => ({ status, body: { success: false, message, code } });

export const NETWORK_FAILURE = { networkFailure: true };

function compile(route) {
  const [method, path] = route.split(' ');
  const pattern = new RegExp(`^${path.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`);
  return { method, pattern };
}

/**
 * Replaces the HTTP transport of the real Axios client with an in-memory router, so the
 * app's interceptors, services, contexts and screens run exactly as they do on a device.
 * Handlers receive { params, body, pathParams, headers } and return ok()/fail()/NETWORK_FAILURE.
 */
export function installMockApi(routes) {
  const compiled = Object.entries(routes).map(([route, handler]) => ({ ...compile(route), handler }));
  const calls = [];

  apiClient.defaults.adapter = async (config) => {
    const method = config.method.toUpperCase();
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const call = { method, url: config.url, params: config.params ?? {}, body, headers: config.headers };
    calls.push(call);

    const route = compiled.find((entry) => entry.method === method && entry.pattern.test(config.url));
    if (!route) throw new Error(`Unexpected request: ${method} ${config.url}`);

    const result = await route.handler({ ...call, pathParams: config.url.match(route.pattern).groups ?? {} });
    if (result.networkFailure) {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {});
    }

    const response = { data: result.body, status: result.status, statusText: '', headers: {}, config, request: {} };
    if (result.status >= 200 && result.status < 300) return response;
    throw new AxiosError(`Request failed with status code ${result.status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response);
  };

  return {
    calls,
    last: (method, url) => [...calls].reverse().find((call) => call.method === method && call.url === url),
  };
}
