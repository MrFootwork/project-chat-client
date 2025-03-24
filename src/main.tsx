import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { AuthWrapper } from './contexts/AuthWrapper.tsx';
import { RoomsWrapper } from './contexts/RoomsWrapper.tsx';
import { SocketWrapper } from './contexts/SocketWrapper.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider>
        <AuthWrapper>
          <RoomsWrapper>
            <SocketWrapper>
              <App />
            </SocketWrapper>
          </RoomsWrapper>
        </AuthWrapper>
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>
);
