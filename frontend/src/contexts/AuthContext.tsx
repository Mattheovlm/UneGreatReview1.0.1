import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export type User = {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  bio?: string;
  theme_preference?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Safety timeout: never block the app more than 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    try {
      const savedToken = await AsyncStorage.getItem('session_token');
      if (!savedToken) {
        clearTimeout(timeout);
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setToken(savedToken);
        setUser(userData);
      } else {
        await AsyncStorage.removeItem('session_token');
        setToken(null);
        setUser(null);
      }
    } catch (e) {
      console.error('Auth check failed:', e);
      // Don't clear the token on network error — user might be offline
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (newToken: string, userData: User) => {
    await AsyncStorage.setItem('session_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    const savedToken = await AsyncStorage.getItem('session_token');
    if (savedToken) {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${savedToken}` },
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    await AsyncStorage.removeItem('session_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const savedToken = token || await AsyncStorage.getItem('session_token');
    if (!savedToken) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` },
      });
      if (res.ok) setUser(await res.json());
    } catch (e) {
      console.error('Refresh user error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
