/**
 * @file friends_services.ts
 * @layer services
 * @description Service hooks for friends workflow.
 * @owner AG-04
 */

import { useCallback, useEffect, useState } from 'react'
import { FRIENDS_CONFIG } from '../configs/friends_configs'
import { friendsAdapter } from '../adapters/friends_adapters'
import type {
    Friend,
    FriendRequestResponse,
} from '../entities/friends_entities'
import type { StandardError } from '../entities/scaffold_entities'

interface FriendListState {
    items: Friend[]
    loading: boolean
    error: Error | null
    pagination: {
        offset: number
        limit: number
        total: number
    }
}

function toError(value: unknown, fallback: string): Error {
    if (value instanceof Error) return value

    if (typeof value === 'object' && value !== null) {
        const v = value as Record<string, unknown>
        if (typeof v.message === 'string' && v.message.trim()) {
            return new Error(v.message)
        }
    }

    return new Error(fallback)
}

export function useFriendList() {
    const [state, setState] = useState<FriendListState>({
        items: [],
        loading: false,
        error: null,
        pagination: {
            offset: FRIENDS_CONFIG.LIST.defaultOffset,
            limit: FRIENDS_CONFIG.LIST.defaultLimit,
            total: 0,
        },
    })

    const fetchList = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const response = await friendsAdapter.getFriendList(
                state.pagination.offset,
                state.pagination.limit
            )

            setState((prev) => ({
                ...prev,
                items: response.items,
                loading: false,
                error: null,
                pagination: {
                    ...prev.pagination,
                    total: response.total,
                },
            }))
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: toError(error, 'Failed to load friends.'),
            }))
        }
    }, [state.pagination.offset, state.pagination.limit])

    useEffect(() => {
        fetchList()
    }, [fetchList])

    const setOffset = useCallback((offset: number) => {
        setState((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                offset: Math.max(0, Math.floor(offset)),
            },
        }))
    }, [])

    const setLimit = useCallback((limit: number) => {
        setState((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                limit: Math.max(1, Math.floor(limit)),
                offset: FRIENDS_CONFIG.LIST.defaultOffset,
            },
        }))
    }, [])

    return {
        items: state.items,
        loading: state.loading,
        error: state.error,
        pagination: state.pagination,
        setOffset,
        setLimit,
        refetch: fetchList,
    }
}

export function useSendFriendRequest() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [errorCode, setErrorCode] = useState<string | null>(null)

    const sendRequest = useCallback(
        async (
            targetUserId: number
        ): Promise<{ success: boolean; data?: FriendRequestResponse }> => {
            setIsLoading(true)
            setError(null)
            setErrorCode(null)

            try {
                const data = await friendsAdapter.sendFriendRequest(targetUserId)
                return { success: true, data }
            } catch (err) {
                const normalized = err as StandardError
                const message =
                    typeof normalized?.message === 'string' && normalized.message
                        ? normalized.message
                        : 'Failed to send friend request.'

                setError(new Error(message))
                setErrorCode(typeof normalized?.code === 'string' ? normalized.code : null)
                return { success: false }
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    return {
        isLoading,
        error,
        errorCode,
        sendRequest,
    }
}

export function useRemoveFriend() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const removeFriend = useCallback(
        async (friendId: number): Promise<{ success: boolean }> => {
            setIsLoading(true)
            setError(null)

            try {
                await friendsAdapter.removeFriend(friendId)
                return { success: true }
            } catch (err) {
                setError(toError(err, 'Failed to remove friend.'))
                return { success: false }
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    return {
        isLoading,
        error,
        removeFriend,
    }
}