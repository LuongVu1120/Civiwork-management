"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  checkAuth: () => Promise<boolean>; // was Promise<void>
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const TOKEN_KEY = 'civiwork_access_token';
const REFRESH_TOKEN_KEY = 'civiwork_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get token from localStorage
  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  };

  // Get refresh token from localStorage
  const getRefreshToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  };

  // Save tokens to localStorage
  const saveTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  // Clear tokens from localStorage
  const clearTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  // Decode JWT token to get user info
  const decodeToken = (token: string): User | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        fullName: payload.fullName,
        role: payload.role
      };
    } catch (error) {
      return null;
    }
  };

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) return false;

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (res.ok) {
        const data = await res.json();
        saveTokens(data.accessToken, data.refreshToken);
        const userData = decodeToken(data.accessToken);
        setUser(userData);
        return true;
      } else {
        clearTokens();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      setUser(null);
      return false;
    }
  };

  // Make authenticated API calls
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const newToken = getToken();
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      }
    }

    return response;
  };

  const checkAuth = async () => {
    try {
      const token = getToken();
      
      if (!token) {
        setUser(null);
        return false;
      }

      // Check if token is expired
      if (isTokenExpired(token)) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          setUser(null);
          return false;
        }
        return true;
      }

      // Token is valid, decode and set user
      const userData = decodeToken(token);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (refreshTokenValue) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      router.push('/auth/login');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    checkAuth,
    logout,
    refreshToken,
    makeAuthenticatedRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
