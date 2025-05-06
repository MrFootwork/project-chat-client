const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5005',
  ENV: import.meta.env.VITE_ENV || 'development',
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
};

export default config;
