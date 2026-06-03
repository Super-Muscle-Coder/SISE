/**
 * @file auth_services.ts
 * @layer services
 * @description React custom hooks for auth domain.
 *              Manages local state (isLoading, error) and orchestrates Adapter calls.
 *              Dispatches sessionStarted event on successful login/register.
 *              Does NOT manage global context (that's router layer).
 * @owner AG-04
 */

import { useState, useCallback } from 'react';
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
 * Custom hook for user login.
 * @returns {Object} { isLoading, error, errorCode, login }
 *   - login: async function to perform login
 */
export function useLogin() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    const login = useCallback(
        async (payload: LoginRequest): Promise<{ success: boolean; data?: AuthResponse }> => {
            setIsLoading(true);
            setError(null);
            setErrorCode(null);

            try {
                const authResponse = await adapterLoginUser(payload);

                // Store token in localStorage
                localStorage.setItem(AUTH_CONFIG.storage.tokenKey, authResponse.access_token);

                // Dispatch sessionStarted event for global router to listen
                const event = new CustomEvent(AUTH_CONFIG.events.sessionStarted, {
                    detail: { token: authResponse.access_token, expiresIn: authResponse.expires_in },
                });
                window.dispatchEvent(event);

                setIsLoading(false);
                return { success: true, data: authResponse };
            } catch (err: unknown) {
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
 * @returns {Object} { isLoading, error, errorCode, register }
 *   - register: async function to perform registration
 */
export function useRegister() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorCode, setErrorCode] = useState<string | null>(null);

    const register = useCallback(
        async (payload: RegisterRequest): Promise<{ success: boolean; data?: AuthResponse }> => {
            setIsLoading(true);
            setError(null);
            setErrorCode(null);

            try {
                const authResponse = await adapterRegisterUser(payload);

                // Store token in localStorage
                localStorage.setItem(AUTH_CONFIG.storage.tokenKey, authResponse.access_token);

                // Dispatch sessionStarted event for global router to listen
                const event = new CustomEvent(AUTH_CONFIG.events.sessionStarted, {
                    detail: { token: authResponse.access_token, expiresIn: authResponse.expires_in },
                });
                window.dispatchEvent(event);

                setIsLoading(false);
                return { success: true, data: authResponse };
            } catch (err: unknown) {
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

    const loadUser = useCallback(async (token: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const userData = await adapterGetCurrentUser(token);
            setUser(userData);
            localStorage.setItem(AUTH_CONFIG.storage.userKey, JSON.stringify(userData));
            setIsLoading(false);
            return { success: true, data: userData };
        } catch (err: unknown) {
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