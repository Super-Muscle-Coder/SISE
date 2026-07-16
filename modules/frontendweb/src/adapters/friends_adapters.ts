/**
 * @file friends_adapters.ts
 * @layer adapters
 * @description Adapter layer for friends workflow.
 *              SỬA (Bước 3 audit): sendFriendRequest() trước đây dùng mã
 *              lỗi tự chế 'HTTP_404'/'HTTP_409' thay vì ERROR_CODES đã có
 *              sẵn trong scaffold_entities.ts — phá vỡ "1 nguồn sự thật
 *              duy nhất cho error code". Đã đổi sang ERROR_CODES.NOT_FOUND
 *              / ERROR_CODES.CONFLICT. Riêng 400 giữ 'HTTP_400' vì
 *              ERROR_CODES hiện KHÔNG có mã validation/bad-request chung
 *              nào phù hợp hơn — ép dùng 1 trong 7 mã có sẵn sẽ sai ngữ
 *              nghĩa hơn giữ nguyên.
 * @owner AG-04
 */

import axios from 'axios'
import { scaffoldAdapter } from './scaffold_adapters'
import { FRIENDS_CONFIG } from '../configs/friends_configs'
import type { StandardError } from '../entities/scaffold_entities'
import { ERROR_CODES } from '../entities/scaffold_entities'
import type {
    FriendListResponse,
    FriendRequestResponse,
} from '../entities/friends_entities'

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

function normalizeFriendsError(error: unknown, fallbackMessage: string): StandardError {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const backendMessage = extractBackendMessage(error.response?.data)

        return {
            code:
                (typeof (error.response?.data as Record<string, unknown> | undefined)?.code === 'string'
                    ? ((error.response?.data as Record<string, unknown>).code as string)
                    : undefined) ||
                (status ? `HTTP_${status}` : 'ERR_FRIENDS_REQUEST_FAILED'),
            message: backendMessage || error.message || fallbackMessage,
            details: {
                httpStatus: status,
            },
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
        code: 'ERR_FRIENDS_REQUEST_FAILED',
        message: fallbackMessage,
    }
}

export class FriendsAdapter {
    async getFriendList(offset: number, limit: number): Promise<FriendListResponse> {
        try {
            const response = await scaffoldAdapter.get<FriendListResponse>(
                FRIENDS_CONFIG.paths.list,
                {
                    params: { offset, limit },
                }
            )
            return response.data
        } catch (error) {
            throw normalizeFriendsError(error, 'Failed to load friend list.')
        }
    }

    async sendFriendRequest(targetUserId: number): Promise<FriendRequestResponse> {
        try {
            const response = await scaffoldAdapter.post<FriendRequestResponse>(
                FRIENDS_CONFIG.paths.request,
                { target_user_id: targetUserId }
            )
            return response.data
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status
                const backendMessage = extractBackendMessage(error.response?.data)

                if (status === 400) {
                    // Không có mã ERROR_CODES nào phù hợp cho validation/bad-request
                    // chung — giữ 'HTTP_400', xem giải thích đầu file.
                    throw {
                        code: 'HTTP_400',
                        message: backendMessage || 'Invalid friend request.',
                        details: { httpStatus: 400 },
                    } as StandardError
                }

                if (status === 404) {
                    throw {
                        code: ERROR_CODES.NOT_FOUND,
                        message: 'Target user not found',
                        details: { httpStatus: 404 },
                    } as StandardError
                }

                if (status === 409) {
                    throw {
                        code: ERROR_CODES.CONFLICT,
                        message: 'Already friends with this user',
                        details: { httpStatus: 409 },
                    } as StandardError
                }
            }

            throw normalizeFriendsError(error, 'Failed to send friend request.')
        }
    }

    async removeFriend(friendId: number): Promise<void> {
        try {
            await scaffoldAdapter.delete(FRIENDS_CONFIG.paths.remove(friendId))
        } catch (error) {
            throw normalizeFriendsError(error, 'Failed to remove friend.')
        }
    }
}

export const friendsAdapter = new FriendsAdapter()