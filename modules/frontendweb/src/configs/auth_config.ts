/**
 * @file auth_config.ts
 * @layer configs
 * @description Centralized auth configuration constants and error message mappings.
 *              All auth paths and messages flow from this single source of truth.
 * @owner AG-04
 */

export const AUTH_CONFIG = {
  // API Paths (relative to gateway base URL)
  paths: {
    login: '/auth/login',
    register: '/auth/register',
    getCurrentUser: '/auth/me',
  },

  // localStorage keys
  storage: {
    tokenKey: 'auth_token',
    userKey: 'auth_user',
  },

  // Event names (custom DOM events)
  events: {
    sessionStarted: 'sessionStarted',
    sessionEnded: 'sessionEnded',
  },

  // Client-side validation rules
  validation: {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address.',
    },
    password: {
      minLength: 6,
      message: 'Password must be at least 6 characters.',
    },
    username: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: 'Username must be 3-50 characters (alphanumeric, hyphens, underscores only).',
    },
  },

  // Error code → UI message mapping (hybrid error handling)
  errorMessages: {
    ERR_INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    ERR_USER_NOT_FOUND: 'No account found with this email.',
    ERR_USER_ALREADY_EXISTS: 'This email is already registered. Try logging in.',
    ERR_VALIDATION_FAILED: 'Please check your input and try again.',
    ERR_NETWORK: 'Network error. Please check your connection and try again.',
    ERR_UNAUTHORIZED: 'You are not authorized to perform this action.',
    ERR_SERVER_ERROR: 'Server error. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  },
} as const;

export type AuthErrorCode = keyof typeof AUTH_CONFIG.errorMessages;