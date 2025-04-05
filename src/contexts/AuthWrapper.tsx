import config from '../../config';

import React, { useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

import { User, UserSignUp } from '../types/user';
import { ResponseError } from '../types/error';

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
  login: (credentials: {
    credential: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: UserSignUp) => Promise<void>;
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
  signup: async () => {},
});

function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContext>(null);
  const [token, setToken] = useState<TokenContext>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // FIXME Handle server down error
    // Failed to validate token: Error: Error: Failed to fetch user from token: AxiosError: Network Error
    validateToken().catch(error =>
      console.log(`Failed to validate token: ${error}`)
    );
  }, []);

  async function logout() {
    // Logout
    window.localStorage.removeItem('chatToken');
    setToken(null);
    setUser(null);
    notifications.cleanQueue();

    try {
      const response = await axios.post(API_URL + '/auth/logout', undefined, {
        withCredentials: true,
      });

      if (response.status !== 200)
        console.warn(
          `Server responded unexpectedly to logout request: ${response}`
        );

      console.log('Logged out');
    } catch (error) {
      throw new Error(`Couldn't logout: ${error}`);
    }
  }

  async function signup(userData: UserSignUp) {
    setLoading(true);

    try {
      const response = await axios.post(API_URL + '/auth/signup', userData, {
        withCredentials: true,
      });

      if (response.status !== 201) throw response;

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const customError: ResponseError = {
          message: error.response.data.message || 'An error occurred',
          code: error.response.status?.toString(),
          details: error.response.data,
        };

        throw customError;
      } else {
        throw {
          message: error.message || 'Unknown error occurred',
        } as ResponseError;
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials: { credential: string; password: string }) {
    setLoading(true);

    const { credential, password } = credentials;

    // Check if credential is an email or username
    const isEmail = /\S+@\S+\.\S+/.test(credential);

    // Send the right body
    const requestBody = isEmail
      ? { email: credential, password }
      : { name: credential, password };

    try {
      // get token and store it
      const response = await axios.post(API_URL + '/auth/login', requestBody);

      if (response.status !== 200) throw response;

      setToken(response.data.jwt);
      window.localStorage.setItem('chatToken', response.data.jwt);

      // get user and store it
      await storeUserData(response.data.jwt);
    } catch (error: any) {
      if (error.response?.data) {
        const customError: ResponseError = {
          message: error.response.data.message || 'An error occurred',
          code: error.response.status?.toString(),
          details: error.response.data,
        };

        throw customError;
      } else {
        throw {
          message: error.message || 'Unknown error occurred',
        } as ResponseError;
      }
    } finally {
      setLoading(false);
    }
  }

  async function validateToken() {
    const token = window.localStorage.getItem('chatToken');

    if (!token) throw new Error('No token found in local storage.');

    setToken(token);

    try {
      await storeUserData(token);
    } catch (error) {
      throw new Error(`${error}`);
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
      throw new Error(`Failed to fetch user from token: ${error}`);
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
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthWrapper, AuthContext };
