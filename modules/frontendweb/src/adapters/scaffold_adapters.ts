/**
 * @file scaffold_adapters.ts
 * @layer adapters
 * @description Global Axios client with request/response interceptors.
 *              FIX R8: 401 Unauthorized handler that auto-logs out and redirects to login.
 *              Handles JWT token injection, idempotency keys, and health checks.
 * @owner AG-04
 */

import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { scaffoldConfig } from '../configs/scaffold_env'
import { AUTH_CONFIG } from '../configs/auth_config'
import type { StandardError } from '../entities/scaffold_entities'

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export class ScaffoldAdapter {
    private client: AxiosInstance

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: scaffoldConfig.API_TIMEOUT_MS,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        this.setupRequestInterceptor()
        this.setupResponseInterceptor()
    }

    private setupRequestInterceptor(): void {
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                // Inject Bearer Token from localStorage using safe getter
                const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey)
                if (token && token !== 'undefined' && token !== 'null') {
                    config.headers.Authorization = `Bearer ${token}`
                }

                // Inject Idempotency-Key for mutating requests if not already present
                if (
                    MUTATING_METHODS.includes(config.method?.toUpperCase() || '') &&
                    !config.headers['Idempotency-Key']
                ) {
                    config.headers['Idempotency-Key'] = uuidv4()
                }

                return config
            },
            (error: unknown) => Promise.reject(error)
        )
    }

    private setupResponseInterceptor(): void {
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<StandardError>) => {
                /**
                 * FIX R8: Global 401 Interceptor
                 * Catches unauthorized errors from ANY endpoint and auto-logs out.
                 * This is the "security gate" that prevents stale tokens from allowing requests.
                 */
                if (error.response?.status === 401) {
                    console.warn('[Axios Interceptor] 401 Unauthorized detected. Auto-logging out.');

                    // Clear all auth data from localStorage
                    localStorage.removeItem(AUTH_CONFIG.storage.tokenKey)
                    localStorage.removeItem(AUTH_CONFIG.storage.userKey)

                    // Dispatch sessionEnded event to notify all listeners
                    // This will trigger scaffold_routers.tsx to show "Session Expired" screen
                    window.dispatchEvent(
                        new CustomEvent(AUTH_CONFIG.events.sessionEnded, {
                            detail: { reason: 'unauthorized_401_intercepted' },
                        })
                    )

                    // Redirect to login (can be overridden by router listener)
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }

                    return Promise.reject(
                        new Error('Session expired: 401 Unauthorized. Redirecting to login.')
                    )
                }

                // Handle other error statuses if needed
                if (error.response?.status === 403) {
                    console.error('[Axios Interceptor] 403 Forbidden')
                }

                if (error.response?.status === 500) {
                    console.error('[Axios Interceptor] 500 Server Error')
                }

                return Promise.reject(error)
            }
        )
    }

    public getClient(): AxiosInstance {
        return this.client
    }

    /**
     * Generic GET request wrapper
     * @template T - Response data type
     */
    public async get<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.get<T>(url, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic POST request wrapper
     * @template T - Response data type
     */
    public async post<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.post<T>(url, data, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic PUT request wrapper
     * @template T - Response data type
     */
    public async put<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.put<T>(url, data, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic PATCH request wrapper
     * @template T - Response data type
     */
    public async patch<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.patch<T>(url, data, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic DELETE request wrapper
     */
    public async delete(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<{ status: number; headers: Record<string, unknown> }> {
        const response = await this.client.delete(url, config)
        return {
            status: response.status,
            headers: response.headers,
        }
    }

    public async getHealthReadiness(
        options?: AxiosRequestConfig
    ): Promise<{
        data: Record<string, unknown>
        headers: Record<string, unknown>
    }> {
        const response = await this.client.get('/health/readiness', options)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    public async getHealthLiveness(
        options?: AxiosRequestConfig
    ): Promise<Record<string, unknown>> {
        const response = await this.client.get('/health/liveness', options)
        return response.data
    }
}
