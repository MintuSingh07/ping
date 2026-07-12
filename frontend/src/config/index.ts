export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'Ping',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000',
};

export default config;
