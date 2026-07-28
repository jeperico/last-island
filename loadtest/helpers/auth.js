import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, AVATARS } from '../config.js';
import { extractAccessToken, jsonParams } from './http.js';

/**
 * Register a unique user for this VU/iteration.
 * Returns { accessToken, userName, email } or null on failure.
 */
export function registerUser(vuId, iteration) {
  const timestamp = Date.now();
  const email = `k6_vu${vuId}_${iteration}_${timestamp}@test.com`;
  const name = `k6_vu${vuId}_${timestamp}`;
  const password = 'K6TestPass123!';
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

  const payload = JSON.stringify({
    name: name,
    email: email,
    password: password,
    avatar: avatar,
  });

  const res = http.post(`${BASE_URL}/auth/register`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(res, {
    'register status is 201': (r) => r.status === 201,
    'register returns user data': (r) => {
      const body = r.json();
      return body && body.user && body.user.name;
    },
  });

  if (!success) {
    console.error(`Registration failed: ${res.status} - ${res.body}`);
    return null;
  }

  const accessToken = extractAccessToken(res);
  if (!accessToken) {
    console.error('No access_token cookie in register response');
    return null;
  }

  const userData = res.json();
  return {
    accessToken: accessToken,
    userName: userData.user.name,
    email: email,
    password: password,
  };
}

/**
 * Login an existing user.
 * Returns { accessToken, userName } or null on failure.
 */
export function loginUser(email, password) {
  const payload = JSON.stringify({ email, password });

  const res = http.post(`${BASE_URL}/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
  });

  if (!success) {
    console.error(`Login failed: ${res.status} - ${res.body}`);
    return null;
  }

  const accessToken = extractAccessToken(res);
  if (!accessToken) {
    console.error('No access_token cookie in login response');
    return null;
  }

  const userData = res.json();
  return {
    accessToken: accessToken,
    userName: userData.user.name,
  };
}
