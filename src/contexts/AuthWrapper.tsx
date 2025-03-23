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
  validateToken: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType>({
  loading: true,
  user: null,
  setUser: () => {},
  token: null,
  setToken: () => {},
  validateToken: async () => {},
  login: async () => {},
  logout: async () => {},
});

function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContext>(null);
  const [token, setToken] = useState<TokenContext>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('validating token');
    validateToken();
  }, []);

  async function logout() {
    const data = await axios.post(config.API_URL + '/auth/logout', undefined, {
      withCredentials: true,
    });

    console.log('LOGOUT RESPONSE: ', data);

    // Logout
    setUser(null);
    setToken(null);
    window.localStorage.removeItem('chatToken');
  }

  async function login(credentials: { email: string; password: string }) {
    console.log(`🚀 ~ login ~ loginData:`, credentials);
    const { email, password } = credentials;

    // get token and store it
    const { data } = await axios.post(API_URL + '/auth/login', {
      email,
      password,
    });
    setToken(data.jwt);
    window.localStorage.setItem('chatToken', data.jwt);

    // get user data and store it
    const response = await axios.get(API_URL + '/api/users/me', {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${data.jwt}`,
      },
    });
    setUser(response.data);
    // FIXME Connect to socket
  }

  async function validateToken() {
    setToken(window.localStorage.getItem('chatToken'));

    axios
      .get(API_URL + '/api/users/me', {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('chatToken')}`,
        },
      })
      .then(({ data }) => setUser(data))
      .catch(error => console.error(error))
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 750);
      });
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        user,
        setUser,
        token,
        setToken,
        validateToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthWrapper, AuthContext };
