import { request } from '../client';
export const authService = {
  terms: () => request('/api/auth/terms'),
  register: body => request('/api/auth/register', { method: 'POST', body }),
  login: body => request('/api/auth/login', { method: 'POST', body }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};
