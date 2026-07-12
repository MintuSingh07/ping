function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto) {
    return (globalThis as any).crypto;
  }
  throw new Error('[secure-web-token] Web Crypto API is not available in this environment.');
}

/**
 * Generates a browser-compatible P-256 ECDSA key pair for DPoP binding.
 * The private key is non-exportable — it cannot be stolen via XSS.
 */
export async function generateDpopKey(): Promise<{
  publicKeyJwk: JsonWebKey;
  privateKey: CryptoKey;
}> {
  const cryptoObj = getCrypto();
  const keyPair = await cryptoObj.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, // non-exportable private key
    ['sign', 'verify']
  ) as CryptoKeyPair;
  const publicKeyJwk = await cryptoObj.subtle.exportKey('jwk', keyPair.publicKey);
  return {
    publicKeyJwk,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Creates a self-contained DPoP proof for a specific request.
 * Send this as the single `x-dpop-proof` header with your API request.
 */
export async function createDpopProof(
  privateKey: CryptoKey,
  publicKeyJwk: JsonWebKey,
  url: string,
  method: string
): Promise<string> {
  if (!privateKey) {
    throw new Error('[secure-web-token] Private key is required to create DPoP proof.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payloadObj = { url, method: method.toUpperCase(), timestamp };
  const payloadStr = JSON.stringify(payloadObj);

  const encoder = new TextEncoder();
  const cryptoObj = getCrypto();
  const rawSignature = await cryptoObj.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privateKey,
    encoder.encode(payloadStr)
  );

  // Convert IEEE P1363 raw signature to ASN.1 DER format for Node.js compatibility
  const derSignature = rawToDer(rawSignature);
  const signatureBase64Url = arrayBufferToBase64Url(derSignature);

  // Build self-contained proof: public key + payload + signature
  const proof = {
    jwk: publicKeyJwk,
    payload: payloadStr,
    signature: signatureBase64Url,
  };

  return stringToBase64Url(JSON.stringify(proof));
}

/**
 * Converts raw IEEE P1363 P-256 ECDSA signature to ASN.1 DER format.
 */
function rawToDer(rawSignatureBuffer: ArrayBuffer): Uint8Array {
  const raw = new Uint8Array(rawSignatureBuffer);
  if (raw.length !== 64) {
    throw new Error('Only P-256 signatures are supported');
  }
  let r = raw.slice(0, 32);
  let s = raw.slice(32, 64);
  let rOffset = 0;
  while (rOffset < r.length - 1 && r[rOffset] === 0) rOffset++;
  r = r.slice(rOffset);
  let sOffset = 0;
  while (sOffset < s.length - 1 && s[sOffset] === 0) sOffset++;
  s = s.slice(sOffset);
  const rBytes = Array.from(r);
  if (r[0] >= 0x80) rBytes.unshift(0x00);
  const sBytes = Array.from(s);
  if (s[0] >= 0x80) sBytes.unshift(0x00);
  const derBytes = [
    0x30,
    2 + rBytes.length + 2 + sBytes.length,
    0x02,
    rBytes.length,
    ...rBytes,
    0x02,
    sBytes.length,
    ...sBytes
  ];
  return new Uint8Array(derBytes);
}

function arrayBufferToBase64Url(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return arrayBufferToBase64Url(bytes);
}

// --- INDEXEDDB STORAGE SYSTEM FOR SECURE PERSISTENCE ---
const DB_NAME = 'ping-crypto-db';
const STORE_NAME = 'keypair-store';
const KEY_ID = 'dpop-keypair';

export async function saveKeysToDb(privateKey: CryptoKey, publicKeyJwk: JsonWebKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ privateKey, publicKeyJwk }, KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getKeysFromDb(): Promise<{ privateKey: CryptoKey; publicKeyJwk: JsonWebKey } | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(KEY_ID);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearKeysFromDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}
