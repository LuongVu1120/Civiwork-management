"use client";
import { useAuth } from '@/app/contexts/AuthContext';

export function useAuthenticatedFetch() {
  const { makeAuthenticatedRequest } = useAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await makeAuthenticatedRequest(url, options);
      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  };

  return { authenticatedFetch };
}
