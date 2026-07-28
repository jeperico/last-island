import http from 'k6/http';
import { BASE_URL } from '../config.js';

/**
 * Extract access_token from Set-Cookie response headers.
 * Returns the cookie string value or null.
 */
export function extractAccessToken(response) {
  const cookies = response.headers['Set-Cookie'];
  if (!cookies) return null;

  // Set-Cookie can be a string or array
  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  for (const cookie of cookieArray) {
    const match = cookie.match(/access_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Create default request params with JSON content type and optional cookies.
 */
export function jsonParams(accessToken) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (accessToken) {
    params.headers['Cookie'] = `access_token=${accessToken}`;
  }
  return params;
}

/**
 * Authenticated GET request.
 */
export function authGet(path, accessToken) {
  return http.get(`${BASE_URL}${path}`, jsonParams(accessToken));
}

/**
 * Authenticated POST request with JSON body.
 */
export function authPost(path, body, accessToken) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(body), jsonParams(accessToken));
}

/**
 * Authenticated POST request with no body.
 */
export function authPostEmpty(path, accessToken) {
  return http.post(`${BASE_URL}${path}`, null, jsonParams(accessToken));
}

/**
 * Authenticated PUT request with JSON body.
 */
export function authPut(path, body, accessToken) {
  return http.put(`${BASE_URL}${path}`, JSON.stringify(body), jsonParams(accessToken));
}
