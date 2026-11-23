import axios from 'axios';

// Standalone unauthenticated Axios client for public routes (tracking & customer check-in).
// Intentionally isolated from the shared apiClient (lib/api/client.ts) to guarantee
// no credentials, access tokens, or refresh interceptors are ever attached to anonymous requests.
export const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

