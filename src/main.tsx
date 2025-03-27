import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import '@mantine/core/styles.css';
import { BrowserRouter } from 'react-router-dom';
import ThemeWrapper from './contexts/ThemeWrapper.tsx';
import { AuthWrapper } from './contexts/AuthWrapper.tsx';
import { RoomsWrapper } from './contexts/RoomsWrapper.tsx';
import { SocketWrapper } from './contexts/SocketWrapper.tsx';

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
