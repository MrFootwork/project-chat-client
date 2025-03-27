const config = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5005',
  ENV: import.meta.env.VITE_ENV || 'development',
};

export default config;
