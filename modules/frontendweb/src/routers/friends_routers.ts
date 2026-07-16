/**
 * @file friends_routers.ts
 * @layer routers
 * @description Friends router layer (0% JSX): orchestrates friends hooks.
 * @owner AG-04
 */

import { useCallback } from 'react'
import {
    useFriendList,
    useRemoveFriend,
    useSendFriendRequest,
} from '../services/friends_services'

export function useFriendsController() {
    const friendList = useFriendList()
    const sendState = useSendFriendRequest()
    const removeState = useRemoveFriend()

    const sendFriendRequest = useCallback(
        async (targetUserId: number) => {
            const result = await sendState.sendRequest(targetUserId)
            if (result.success) {
                await friendList.refetch()
            }
            return result
        },
        [sendState, friendList]
    )

    const removeFriend = useCallback(
        async (friendId: number) => {
            const result = await removeState.removeFriend(friendId)
            if (result.success) {
                await friendList.refetch()
            }
            return result
        },
        [removeState, friendList]
    )

    return {
        friends: friendList,
        sendFriendRequest,
        removeFriend,
        isSending: sendState.isLoading,
        sendError: sendState.error,
        isRemoving: removeState.isLoading,
        removeError: removeState.error,
    }
}