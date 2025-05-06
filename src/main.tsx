import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/code-highlight/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

import { AuthWrapper } from './contexts/AuthWrapper.tsx';
import { RoomsWrapper } from './contexts/RoomsWrapper.tsx';
import { SocketWrapper } from './contexts/SocketWrapper.tsx';
import ThemeWrapper from './contexts/ThemeWrapper.tsx';
import { ModalProvider } from './contexts/ModalContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthWrapper>
        <RoomsWrapper>
          <SocketWrapper>
            <ThemeWrapper>
              <ModalProvider>
                <App />
              </ModalProvider>
            </ThemeWrapper>
          </SocketWrapper>
        </RoomsWrapper>
      </AuthWrapper>
    </BrowserRouter>
  </StrictMode>
);

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log(
          'Service Worker registered with scope:',
          registration.scope
        );
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
