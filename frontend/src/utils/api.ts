import { createDpopProof, getKeysFromDb } from './crypto';
import config from '../config';

/**
 * Custom fetch wrapper that automatically signs requests with a DPoP proof
 * and attaches the Bearer token.
 */
export async function fetchWithDpop(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${config.apiBaseUrl}${path}`;
  const method = options.method || 'GET';

  const headers = new Headers(options.headers);

  // 1. Attach Bearer token from LocalStorage
  const token = localStorage.getItem('ping_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // 2. Load keys and sign request if present
  const keys = await getKeysFromDb();
  if (keys) {
    try {
      const proof = await createDpopProof(keys.privateKey, keys.publicKeyJwk, url, method);
      headers.set('x-dpop-proof', proof);
    } catch (e) {
      console.error('Failed to generate DPoP proof:', e);
    }
  }

  // 3. Make the fetch request, ensuring credentials (cookies) are sent
  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: options.credentials || 'include',
  });
}
