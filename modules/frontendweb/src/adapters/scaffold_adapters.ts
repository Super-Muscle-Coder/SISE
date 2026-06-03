import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { scaffoldConfig } from '../configs/scaffold_env'
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
                // Inject Bearer Token from localStorage
                const token = localStorage.getItem('access_token')
                if (token) {
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
                // Handle 401 Unauthorized: clear session
                if (error.response?.status === 401) {
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('user_id')
                    // Trigger session expiration event
                    window.dispatchEvent(
                        new CustomEvent('sessionExpired', {
                            detail: { reason: 'Unauthorized' },
                        })
                    )
                }

                return Promise.reject(error)
            }
        )
    }

    public getClient(): AxiosInstance {
        return this.client
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

export const scaffoldAdapter = new ScaffoldAdapter(scaffoldConfig.API_BASE_URL)