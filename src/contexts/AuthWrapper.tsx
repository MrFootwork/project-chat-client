import axios from 'axios';
import React, { useState, useEffect, ReactNode, useContext } from 'react';
import { User, UserSignUp } from '../types/user';
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

  interface CustomError {
    message: string;
    code?: string;
    details?: Record<string, any>;
  }

  async function signup(userData: UserSignUp) {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + '/auth/signup', userData, {
        withCredentials: true,
      });

      if (response.status !== 201) throw new Error('Failed to register user.');

      console.log('User registered successfully');
    } catch (error: any) {
      if (error.response?.data) {
        const customError: CustomError = {
          message: error.response.data.message || 'An error occurred',
          code: error.response.status?.toString(),
          details: error.response.data,
        };
        throw customError;
      } else {
        throw {
          message: error.message || 'Unknown error occurred',
        } as CustomError;
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
      const { data } = await axios.post(API_URL + '/auth/login', requestBody);

      if (!data) return;

      setToken(data.jwt);
      window.localStorage.setItem('chatToken', data.jwt);

      // get user and store it
      await storeUserData(data.jwt);
    } catch (error) {
      throw new Error("Couldn't login");
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
