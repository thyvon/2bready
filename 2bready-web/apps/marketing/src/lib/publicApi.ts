import axios from 'axios';

// Separate client for PUBLIC, unauthenticated endpoints (landing page, etc.).
// Deliberately does NOT reuse the authenticated `api` client — that one attaches
// a bearer token if present and force-redirects to /login on 401.
// A public marketing page must never trigger that logout flow.
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default publicApi;