'use client';

import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(initialData: T | null = null) {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    apiCall: () => Promise<Response>,
    options: ApiOptions = {}
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        options.onError?.(errorMessage);
        return null;
      }
      
      const data = await response.json();
      setState(prev => ({ ...prev, data, loading: false, error: null }));
      options.onSuccess?.(data);
      return data;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      options.onError?.(errorMessage);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset
  };
}

// Specialized hooks for common operations
export function useFetch<T = any>(url: string, options: RequestInit = {}) {
  const api = useApi<T>();
  
  const fetch = useCallback(() => {
    return api.execute(() => fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }));
  }, [url, options, api]);

  return {
    ...api,
    fetch
  };
}

export function useMutation<T = any>() {
  const api = useApi<T>();
  
  const mutate = useCallback((
    url: string, 
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any,
    options: RequestInit = {}
  ) => {
    return api.execute(() => fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options
    }));
  }, [api]);

  return {
    ...api,
    mutate
  };
}
