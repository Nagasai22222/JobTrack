import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authStorage } from '../utils/authStorage';
import { api } from '../services/api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = authStorage.getToken();
    if (storedToken) {
      setToken(storedToken);
      // Basic user state restored from token existence
      setUser({ username: 'Authenticated User' });
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    if (response.token) {
      authStorage.setToken(response.token);
      setToken(response.token);
      setUser({ username: credentials.username });
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    await api.post('/api/auth/register', data);
  };

  const logout = (): void => {
    authStorage.removeToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
