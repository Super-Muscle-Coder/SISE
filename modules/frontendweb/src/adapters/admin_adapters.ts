/**
 * @file admin_adapters.ts
 * @layer adapters
 * @description Adapter layer for admin workflow (reindex).
 *              SỬA (Bước 3 audit): comment cũ ghi nhầm response là bất
 *              đồng bộ (202) — thực tế hợp đồng ghi rõ response 201,
 *              endpoint xử lý ĐỒNG BỘ (chỉ trả về sau khi reindex xong
 *              thật). Không có thay đổi logic runtime (code không hardcode
 *              kiểm tra status code cụ thể), chỉ sửa lại JSDoc cho khớp sự
 *              thật, tránh gây hiểu lầm cho người đọc sau này.
 * @owner AG-04
 */

import axios from 'axios'
import { scaffoldAdapter } from './scaffold_adapters'
import { ADMIN_CONFIG } from '../configs/admin_configs'
import { ERROR_CODES } from '../entities/scaffold_entities'
import type { StandardError } from '../entities/scaffold_entities'
import type {
    TriggerReindexRequest,
    TriggerReindexResponse,
} from '../entities/admin_entities'

function extractBackendMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null
    const record = data as Record<string, unknown>

    if (typeof record.message === 'string' && record.message.trim()) {
        return record.message
    }

    if (typeof record.detail === 'string' && record.detail.trim()) {
        return record.detail
    }

    return null
}

function normalizeAdminError(error: unknown, fallbackMessage: string): StandardError {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status

        if (status === 403) {
            return {
                code: ERROR_CODES.FORBIDDEN_ADMIN_ONLY,
                message: 'This endpoint requires admin role',
                details: { httpStatus: 403 },
            }
        }

        const backendData = error.response?.data as Record<string, unknown> | undefined
        const backendCode = typeof backendData?.code === 'string' ? backendData.code : null
        const backendMessage = extractBackendMessage(backendData)

        return {
            code: backendCode || (status ? `HTTP_${status}` : 'ERR_ADMIN_REQUEST_FAILED'),
            message: backendMessage || error.message || fallbackMessage,
            details: { httpStatus: status },
        }
    }

    if (typeof error === 'object' && error !== null) {
        const e = error as Record<string, unknown>
        if (typeof e.code === 'string' && typeof e.message === 'string') {
            return {
                code: e.code,
                message: e.message,
                details:
                    typeof e.details === 'object' && e.details !== null
                        ? (e.details as Record<string, unknown>)
                        : undefined,
            }
        }
    }

    return {
        code: 'ERR_ADMIN_REQUEST_FAILED',
        message: fallbackMessage,
    }
}

export class AdminAdapter {
    /**
     * POST /admin/reindex — response 201, XỬ LÝ ĐỒNG BỘ. Promise chỉ
     * resolve sau khi Backend đã reindex xong thật sự (có thể mất nhiều
     * thời gian với dataset lớn) — KHÔNG polling, response đã là kết quả
     * cuối cùng.
     */
    async triggerReindex(
        payload?: TriggerReindexRequest
    ): Promise<TriggerReindexResponse> {
        const body: TriggerReindexRequest = {
            batch_size: payload?.batch_size ?? ADMIN_CONFIG.reindexDefaultBatchSize,
            ...(typeof payload?.resume_from === 'string' && payload.resume_from.trim()
                ? { resume_from: payload.resume_from }
                : {}),
        }

        try {
            const response = await scaffoldAdapter.post<TriggerReindexResponse>(
                ADMIN_CONFIG.paths.reindex,
                body
            )
            return response.data
        } catch (error) {
            throw normalizeAdminError(error, 'Failed to trigger reindex.')
        }
    }
}

export const adminAdapter = new AdminAdapter()