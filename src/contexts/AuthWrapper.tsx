import config from '../../config';
import { User, UserEdit, UserSignUp } from '../types/user';
import { ResponseError } from '../types/error';

import React, { useState, useEffect, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
import { notifications } from '@mantine/notifications';

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
  validatePassword: (password: string) => Promise<boolean>;
  login: (credentials: {
    credential: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: UserSignUp) => Promise<void>;
  updateUser: (userData: UserEdit) => Promise<User>;
};

const AuthContext = React.createContext<AuthContextType>({
  loading: true,
  user: null,
  setUser: () => {},
  token: null,
  setToken: () => {},
  validateToken: async () => {},
  validatePassword: async () => false,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  updateUser: async () => ({} as User),
});

function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContext>(null);
  const [token, setToken] = useState<TokenContext>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // This runs twice in development mode, but not in production
    validateToken().catch(error => {
      console.error(error);

      if (error.code === 'ERR_NETWORK')
        notifications.show({
          title: 'Token validation failed',
          message: 'It seems the server is down. Please try again later.',
          color: 'red',
          autoClose: false,
        });
    });
  }, []);

  async function validatePassword(password: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_URL}/auth/validate-password`,
        { password },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
          },
        }
      );

      if (response.status === 200) return true;
      return false;
    } catch (error) {
      if ((error as AxiosError).status === 401) return false;
      console.log(error);
      return false;
    }
  }

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

  async function updateUser(userData: UserEdit) {
    try {
      const { data: updatedUser } = await axios.patch(
        `${API_URL}/api/users/me`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('chatToken')}`,
          },
        }
      );
      console.log(`🚀 ~ updateUser ~ updatedUser:`, updatedUser);

      return updatedUser as User;
    } catch (error) {
      throw error;
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
        throw error;
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
      await _storeUserData(response.data.jwt);
    } catch (error: any) {
      if (error.response?.data) {
        const customError: ResponseError = {
          message: error.response.data.message || 'An error occurred',
          code: error.response.status?.toString(),
          details: error.response.data,
        };

        throw customError;
      } else {
        throw error;
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
      await _storeUserData(token);
    } catch (error) {
      throw error;
    }
  }

  async function _storeUserData(token: string) {
    try {
      const response = await axios.get(API_URL + '/api/users/me', {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
    } catch (error) {
      throw error;
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
        validatePassword,
        login,
        logout,
        signup,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthWrapper, AuthContext };
