import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { AuthWrapper } from './contexts/AuthWrapper.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider>
        <AuthWrapper>
          <App />
        </AuthWrapper>
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>
);
