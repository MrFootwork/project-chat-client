import axios from 'axios';
import React, { useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import config from '../../config';

const API_URL = config.API_URL;

type UserContext = Omit<User, 'password'> | null;
type TokenContext = string | null;

type AuthContextType = {
  loading: boolean;
  user: UserContext;
  setUser: React.Dispatch<React.SetStateAction<UserContext>>;
  token: TokenContext;
  setToken: React.Dispatch<React.SetStateAction<TokenContext>>;
};

const AuthContext = React.createContext<AuthContextType>({
  loading: true,
  user: null,
  setUser: () => {},
  token: null,
  setToken: () => {},
});

function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContext>(null);
  const [token, setToken] = useState<TokenContext>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setToken(window.localStorage.getItem('chatToken'));

    axios
      .get(API_URL + '/api/users/me', {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('chatToken')}`,
        },
      })
      .then(({ data }) => setUser(data))
      .catch(error => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ loading, user, setUser, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthWrapper, AuthContext };
