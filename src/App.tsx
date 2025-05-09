// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css';

import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import ProtectedRoutes from './utils/ProtectedRoutes';
import NavBar from './components/NavBar';
import ModalManager from './components/ModalManager';

function App() {
  return (
    <>
      <NavBar />

      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/auth' element={<AuthPage />} />

        {/* This redirects to /auth if not logged in */}
        <Route element={<ProtectedRoutes />}>
          <Route path='/chat' element={<ChatPage />} />
          <Route path='/chat/:roomID' element={<ChatPage />} />
        </Route>

        <Route path='*' element={<Navigate to='/' />} />
      </Routes>
      <ModalManager />
    </>
  );
}

export default App;
