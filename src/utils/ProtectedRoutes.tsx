import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthWrapper';

const ProtectedRoutes = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <Outlet />;
  // return user ? <Outlet /> : <Navigate to='/auth' />;
};

export default ProtectedRoutes;
