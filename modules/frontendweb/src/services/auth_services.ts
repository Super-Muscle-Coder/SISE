/**
 * @file auth_services.ts
 * @layer services
 * @description React custom hooks for auth domain.
 *              Manages local form state (isLoading, error) and orchestrates adapter calls.
 *              Dispatches custom events to notify global router on success.
 *              Does NOT manage global context (that's scaffold routers).
 *              FIX E.1: AbortController to prevent race conditions & button spamming.
 *              FIX E.2: useEffect cleanup to prevent memory leaks on unmount.
 *              FIX E.3: Config-driven storage keys, event names, validation rules.
 * 
 * Công dụng: Xử lý logic đăng nhập/đăng ký
  - useLogin() hook: gọi API login, lưu token
  - useRegister() hook: gọi API register
  - Quản lý session (lưu/xóa token)
  Nếu cần thay đổi logic auth, sửa ở đây
 * @owner AG-04
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    loginUser as adapterLoginUser,
    registerUser as adapterRegisterUser,
    getCurrentUser as adapterGetCurrentUser,
    mapErrorToMessage,
} from '../adapters/auth_adapters';
import { AUTH_CONFIG } from '../configs/auth_configs';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
    FormValidationResult,
} from '../entities/auth_entities';

/**
 * FIX E.3: Retrieve and validate stored JWT token from localStorage.
 * Uses config-driven storage key (AUTH_CONFIG.storage.tokenKey).
 * Checks for garbage values like "undefined", "null".
 * Validates JWT format (3 parts separated by dots).
 *
 * @returns Valid token string or null
 */
export function getStoredToken(): string | null {
    try {
        const storageKey = AUTH_CONFIG.storage.tokenKey;
        const token = localStorage.getItem(storageKey);

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

        // Basic JWT format check: 3 parts separated by dots
        const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        if (!jwtPattern.test(token)) {
            console.warn('[Auth] Invalid token format detected. Clearing corrupted token.');
            clearStoredToken();
            return null;
        }

        return token;
    } catch (err) {
        console.error('[Auth] Error reading stored token:', err);
        return null;
    }
}

/**
 * FIX E.3: Safely remove stored auth data from localStorage.
 * Uses config-driven storage keys to stay in sync with env.
 */
export function clearStoredToken(): void {
    try {
        const tokenKey = AUTH_CONFIG.storage.tokenKey;
        const userKey = AUTH_CONFIG.storage.userKey;

        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
    } catch (err) {
        console.error('[Auth] Error clearing stored token:', err);
    }
}

/**
 * Custom hook for user login.
 * FIX E.1: Uses AbortController to cancel pending requests on new attempt.
 * FIX E.2: useEffect cleanup to prevent state updates on unmounted component.
 * FIX E.3: Uses config-driven storage key and event name.
 *
 * @returns {Object} { isLoading, error, errorCode, login }
 *   - login: async function to perform login
 */
export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    // FIX E.1: AbortController ref to cancel pending requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // FIX E.2: Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const login = useCallback(
        async (payload: LoginRequest): Promise<{ success: boolean; data?: AuthResponse }> => {
            // FIX E.1: Cancel any previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setIsLoading(true);
            setError(null);
            setErrorCode(null);

            try {
                const authResponse = await adapterLoginUser(payload);

                // FIX E.2: Only update state if component is still mounted
                if (!abortControllerRef.current.signal.aborted) {
                    // FIX E.3: Store token using config-driven key
                    const tokenKey = AUTH_CONFIG.storage.tokenKey;
                    localStorage.setItem(tokenKey, authResponse.access_token);

                    // Dispatch sessionStarted event using config-driven event name
                    const eventName = AUTH_CONFIG.events.sessionStarted;
                    const event = new CustomEvent(eventName, {
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
                // FIX E.2: Only update state if not aborted
                if (abortControllerRef.current?.signal.aborted) {
                    return { success: false };
                }

                const backendError = err as { code?: string; detail?: string };
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
 * FIX E.1: Uses AbortController to cancel pending requests on new attempt.
 * FIX E.2: useEffect cleanup to prevent state updates on unmounted component.
 * FIX E.3: Uses config-driven storage key and event name.
 *
 * @returns {Object} { isLoading, error, errorCode, register }
 *   - register: async function to perform registration
 */
export function useRegister() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    // FIX E.1: AbortController ref to cancel pending requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // FIX E.2: Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const register = useCallback(
        async (payload: RegisterRequest): Promise<{ success: boolean; data?: AuthResponse }> => {
            // FIX E.1: Cancel any previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setIsLoading(true);
            setError(null);
            setErrorCode(null);

            try {
                const authResponse = await adapterRegisterUser(payload);

                // FIX E.2: Only update state if component is still mounted
                if (!abortControllerRef.current.signal.aborted) {
                    // FIX E.3: Store token using config-driven key
                    const tokenKey = AUTH_CONFIG.storage.tokenKey;
                    localStorage.setItem(tokenKey, authResponse.access_token);

                    // Dispatch sessionStarted event using config-driven event name
                    const eventName = AUTH_CONFIG.events.sessionStarted;
                    const event = new CustomEvent(eventName, {
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
                // FIX E.2: Only update state if not aborted
                if (abortControllerRef.current?.signal.aborted) {
                    return { success: false };
                }

                const backendError = err as { code?: string; detail?: string };
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
 * Calls adapter getCurrentUser() with stored JWT token.
 * FIX E.2: AbortController cleanup to prevent unmount state updates.
 * FIX E.3: Uses config-driven storage key.
 *
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
                // FIX E.3: Store user using config-driven key
                const userKey = AUTH_CONFIG.storage.userKey;
                localStorage.setItem(userKey, JSON.stringify(userData));
                setIsLoading(false);
                return { success: true, data: userData };
            }

            return { success: false };
        } catch (err: unknown) {
            if (abortControllerRef.current?.signal.aborted) {
                return { success: false };
            }

            const backendError = err as { code?: string; detail?: string };
            const message = mapErrorToMessage(backendError?.code || 'UNKNOWN_ERROR');
            setError(message);
            setIsLoading(false);
            return { success: false };
        }
    }, []);

    return { isLoading, error, user, loadUser };
}

/**
 * FIX E.3: Validate auth form input before submission.
 * Uses config-driven validation rules (AUTH_CONFIG.validation).
 * Returns field-level errors for granular UI feedback.
 * 
 * IMPORTANT: LOGIN vs REGISTER have different validation rules:
 * - LOGIN: username + password only (no email validation)
 * - REGISTER: username + email + password (with email format check)
 *
 * @param type - 'login' or 'register'
 * @param payload - Form data object
 * @returns { isValid: boolean, errors: Record<string, string> }
 */
export function validateAuthForm(
    type: 'login' | 'register',
    payload: Record<string, string>
): FormValidationResult {
    const errors: Record<string, string> = {};

    // ===== USERNAME VALIDATION (both login and register) =====
    if (payload.username) {
        const { minLength, maxLength, pattern, message } = AUTH_CONFIG.validation.username;
        if (
            payload.username.length < minLength ||
            payload.username.length > maxLength ||
            !pattern.test(payload.username)
        ) {
            errors.username = message;
        }
    } else {
        errors.username = 'Username is required';
    }

    // ===== PASSWORD VALIDATION (both login and register) =====
    if (payload.password) {
        const { minLength, message } = AUTH_CONFIG.validation.password;
        if (payload.password.length < minLength) {
            errors.password = message;
        }
    } else {
        errors.password = 'Password is required';
    }

    // ===== REGISTER-ONLY VALIDATION =====
    if (type === 'register') {
        // Email validation
        if (payload.email) {
            const { pattern, message } = AUTH_CONFIG.validation.email;
            if (!pattern.test(payload.email)) {
                errors.email = message;
            }
        } else {
            errors.email = 'Email is required';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}