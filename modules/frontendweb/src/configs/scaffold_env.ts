const getEnvVariable = (key: string, defaultValue: string): string => {
    const value = import.meta.env[key]
    return value !== undefined ? String(value) : defaultValue
}

export const scaffoldConfig = {
    API_BASE_URL: getEnvVariable('VITE_API_BASE_URL', 'http://localhost:8000'),
    API_TIMEOUT_MS: parseInt(getEnvVariable('VITE_API_TIMEOUT_MS', '10000'), 10),
    HEALTH_CHECK_INTERVAL_MS: parseInt(
        getEnvVariable('VITE_HEALTH_CHECK_INTERVAL_MS', '30000'),
        10
    ),
} as const

export type ScaffoldConfig = typeof scaffoldConfig