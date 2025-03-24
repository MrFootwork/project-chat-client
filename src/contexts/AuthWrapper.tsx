import axios from 'axios';
import React, { useState, useEffect, ReactNode, useContext } from 'react';
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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    validateToken();
  }, []);

  async function logout() {
    try {
      const response = await axios.post(API_URL + '/auth/logout', undefined, {
        withCredentials: true,
      });

      if (response.statusText !== 'OK')
        throw new Error(
          `Server didn't respond to logout: ${response.status} ${response.statusText}`
        );

      // Logout
      setUser(null);
      setToken(null);
      window.localStorage.removeItem('chatToken');
      console.log('Logged out');
    } catch (error) {
      throw new Error(`Couldn't logout: ${error}`);
    }
  }

  async function login(credentials: { email: string; password: string }) {
    const { email, password } = credentials;
    setLoading(true);

    try {
      // get token and store it
      const { data } = await axios.post(API_URL + '/auth/login', {
        email,
        password,
      });

      if (!data) return;

      setToken(data.jwt);
      window.localStorage.setItem('chatToken', data.jwt);

      // get user and store it
      await storeUserData(data.jwt);

      // FIXME Connect to socket
    } catch (error) {
      throw new Error("Couldn't login");
    }
  }

  async function validateToken() {
    const token = window.localStorage.getItem('chatToken');

    if (!token) {
      console.warn('No token in local storage');
      return;
    }

    setToken(token);

    try {
      await storeUserData(token);
    } catch (error) {
      throw new Error("Couldn't validate token.");
    }
  }

  async function storeUserData(token: string) {
    try {
      const response = await axios.get(API_URL + '/api/users/me', {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error}`);
    } finally {
      setLoading(false);
    }
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
