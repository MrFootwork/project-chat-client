// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css';

import config from '../config';
import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

const API_URL = config.API_URL;

function App() {
  // useEffect(() => {
  //   axios
  //     .get('https://project-chat-server.onrender.com/api/users')
  //     // .get('http://localhost:5005/api/books')
  //     .then(res => {
  //       console.log(res.data);
  //       setUsers(res.data);
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     });
  // }, []);

  return (
    <>
      <div> {`Test ${API_URL}`} </div>

      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path='/login' element={<AuthPage />} />
      </Routes>
    </>
  );
}

export default App;
