import http from 'node:http';
import https from 'node:https';
import axios, { AxiosError, AxiosHeaders } from 'axios';

/**
 * Axios transport that sends real HTTP requests from Jest, so the unmodified app can talk to
 * a running Orbit API. Axios still serialises requests and parses responses as on a device.
 */
export function nodeHttpAdapter(config) {
  return new Promise((resolve, reject) => {
    const url = new URL(axios.getUri(config));
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.request(
      url,
      { method: config.method.toUpperCase(), headers: AxiosHeaders.from(config.headers).toJSON() },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          const result = {
            data: body,
            status: response.statusCode,
            statusText: response.statusMessage,
            headers: response.headers,
            config,
            request,
          };
          if (config.validateStatus(response.statusCode)) resolve(result);
          else {
            reject(
              new AxiosError(
                `Request failed with status code ${response.statusCode}`,
                AxiosError.ERR_BAD_RESPONSE,
                config,
                request,
                result,
              ),
            );
          }
        });
      },
    );
    request.setTimeout(config.timeout || 20_000, () => request.destroy(new Error('Request timed out')));
    request.on('error', (error) => reject(new AxiosError(error.message, AxiosError.ERR_NETWORK, config, request)));
    if (config.data) request.write(config.data);
    request.end();
  });
}
