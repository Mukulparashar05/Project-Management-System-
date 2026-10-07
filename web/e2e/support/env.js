// Isolated ports and a dedicated secret so end-to-end runs never touch a running dev server.
export const E2E_API_PORT = 4100;
export const E2E_WEB_PORT = 5180;
export const E2E_API_URL = `http://localhost:${E2E_API_PORT}/api`;
export const E2E_WEB_URL = `http://localhost:${E2E_WEB_PORT}`;
export const E2E_JWT_SECRET = 'e2e-only-jwt-secret-with-at-least-32-characters';
