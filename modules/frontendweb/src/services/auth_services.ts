/**
 * @file auth_services.ts
 * @layer services
 * @description React custom hooks for auth domain.
 *              FIX 1.2: AbortController to prevent race conditions & button spamming
 *              FIX 1.3: useEffect cleanup to prevent memory leaks on unmount
 *              FIX 1.5: getStoredToken() with JWT validation guard
 *              Manages local state (isLoading, error) and orchestrates Adapter calls.
 *              Dispatches sessionStarted event on successful login/register.
 *              Does NOT manage global context (that's router layer).
 * @owner AG-04
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  loginUser as adapterLoginUser,
  registerUser as adapterRegisterUser,
  getCurrentUser as adapterGetCurrentUser,
  mapErrorToMessage,
} from '../adapters/auth_adapters';
import { AUTH_CONFIG } from '../configs/auth_config';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  AuthState,
} from '../entities/auth_entities';

/**
 * FIX 1.5: Retrieve and validate stored JWT token from localStorage.
 * Checks for garbage values like "undefined", "null", and validates JWT format.
 * @returns Valid token string or null
 */
export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey);

    // Validate: not null, not empty, not garbage strings
    if (
      !token ||
      token === 'undefined' ||
      token === 'null' ||
      token === '[object Object]' ||
      !token.trim()
    ) {
      return null;
    }

    // Basic JWT format check: must have 3 parts separated by dots
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtPattern.test(token)) {
      console.warn('[Auth] Invalid token format detected. Clearing corrupted token.');
      localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
      return null;
    }

    return token;
  } catch (err) {
    console.error('[Auth] Error reading stored token:', err);
    return null;
  }
}

/**
 * FIX 1.5: Safely remove stored token from localStorage.
 */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
    localStorage.removeItem(AUTH_CONFIG.storage.userKey);
  } catch (err) {
    console.error('[Auth] Error clearing stored token:', err);
  }
}

/**
 * Custom hook for user login.
 * FIX 1.2: Uses AbortController to cancel pending requests on new attempt.
 * FIX 1.3: useEffect cleanup to prevent state updates on unmounted component.
 * @returns {Object} { isLoading, error, errorCode, login }
 *   - login: async function to perform login
 */
export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // FIX 1.2: AbortController ref to cancel pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // FIX 1.3: Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const login = useCallback(
    async (payload: LoginRequest): Promise<{ success: boolean; data?: AuthResponse }> => {
      // FIX 1.2: Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const authResponse = await adapterLoginUser(payload);

        // FIX 1.3: Only update state if component is still mounted (not aborted)
        if (!abortControllerRef.current.signal.aborted) {
          // Store token in localStorage
          localStorage.setItem(AUTH_CONFIG.storage.tokenKey, authResponse.access_token);

          // Dispatch sessionStarted event for global router to listen
          const event = new CustomEvent(AUTH_CONFIG.events.sessionStarted, {
            detail: {
              token: authResponse.access_token,
              expiresIn: authResponse.expires_in,
            },
          });
          window.dispatchEvent(event);

          setIsLoading(false);
          return { success: true, data: authResponse };
        }

        return { success: false };
      } catch (err: unknown) {
        // FIX 1.3: Only update state if not aborted
        if (abortControllerRef.current?.signal.aborted) {
          return { success: false };
        }

        const backendError = err as { code?: string; message?: string };
        const code = backendError?.code || 'UNKNOWN_ERROR';
        const message = mapErrorToMessage(code);

        setErrorCode(code);
        setError(message);
        setIsLoading(false);

        return { success: false };
      }
    },
    []
  );

  return { isLoading, error, errorCode, login };
}

/**
 * Custom hook for user registration.
 * FIX 1.2: Uses AbortController to cancel pending requests on new attempt.
 * FIX 1.3: useEffect cleanup to prevent state updates on unmounted component.
 * @returns {Object} { isLoading, error, errorCode, register }
 *   - register: async function to perform registration
 */
export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // FIX 1.2: AbortController ref to cancel pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // FIX 1.3: Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const register = useCallback(
    async (payload: RegisterRequest): Promise<{ success: boolean; data?: AuthResponse }> => {
      // FIX 1.2: Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const authResponse = await adapterRegisterUser(payload);

        // FIX 1.3: Only update state if component is still mounted (not aborted)
        if (!abortControllerRef.current.signal.aborted) {
          // Store token in localStorage
          localStorage.setItem(AUTH_CONFIG.storage.tokenKey, authResponse.access_token);

          // Dispatch sessionStarted event for global router to listen
          const event = new CustomEvent(AUTH_CONFIG.events.sessionStarted, {
            detail: {
              token: authResponse.access_token,
              expiresIn: authResponse.expires_in,
            },
          });
          window.dispatchEvent(event);

          setIsLoading(false);
          return { success: true, data: authResponse };
        }

        return { success: false };
      } catch (err: unknown) {
        // FIX 1.3: Only update state if not aborted
        if (abortControllerRef.current?.signal.aborted) {
          return { success: false };
        }

        const backendError = err as { code?: string; message?: string };
        const code = backendError?.code || 'UNKNOWN_ERROR';
        const message = mapErrorToMessage(code);

        setErrorCode(code);
        setError(message);
        setIsLoading(false);

        return { success: false };
      }
    },
    []
  );

  return { isLoading, error, errorCode, register };
}

/**
 * Custom hook to load the authenticated user's profile.
 * @returns {Object} { isLoading, error, user, loadUser }
 *   - loadUser: async function to fetch user profile from backend
 */
export function useGetCurrentUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadUser = useCallback(async (token: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const userData = await adapterGetCurrentUser(token);

      if (!abortControllerRef.current.signal.aborted) {
        setUser(userData);
        localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(userData));
        setIsLoading(false);
        return { success: true, data: userData };
      }

      return { success: false };
    } catch (err: unknown) {
      if (abortControllerRef.current?.signal.aborted) {
        return { success: false };
      }

      const backendError = err as { code?: string; message?: string };
      const message = mapErrorToMessage(backendError?.code || 'UNKNOWN_ERROR');
      setError(message);
      setIsLoading(false);
      return { success: false };
    }
  }, []);

  return { isLoading, error, user, loadUser };
}

/**
 * Utility function to validate form input before submission.
 * @param type - 'login' or 'register'
 * @param payload - Form data
 * @returns { valid: boolean, errors: Record<string, string> }
 */
export function validateAuthForm(
  type: 'login' | 'register',
  payload: Record<string, string>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate email
  if (payload.email && !AUTH_CONFIG.validation.email.pattern.test(payload.email)) {
    errors.email = AUTH_CONFIG.validation.email.message;
  }

  // Validate password
  if (payload.password && payload.password.length < AUTH_CONFIG.validation.password.minLength) {
    errors.password = AUTH_CONFIG.validation.password.message;
  }

  // Validate username (for register)
  if (type === 'register' && payload.username) {
    const { minLength, maxLength, pattern, message } = AUTH_CONFIG.validation.username;
    if (
      payload.username.length < minLength ||
      payload.username.length > maxLength ||
      !pattern.test(payload.username)
    ) {
      errors.username = message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
