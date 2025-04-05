import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

import { AuthWrapper } from './contexts/AuthWrapper.tsx';
import { RoomsWrapper } from './contexts/RoomsWrapper.tsx';
import { SocketWrapper } from './contexts/SocketWrapper.tsx';
import ThemeWrapper from './contexts/ThemeWrapper.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthWrapper>
        <RoomsWrapper>
          <SocketWrapper>
            <ThemeWrapper>
              <App />
            </ThemeWrapper>
          </SocketWrapper>
        </RoomsWrapper>
      </AuthWrapper>
    </BrowserRouter>
  </StrictMode>
);
