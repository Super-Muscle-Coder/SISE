/**
 * @file friends_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow friends: path, pagination default.
 * @owner AG-04
 * @reference openapi.yaml paths /friends, /friends/request, /friends/{friend_id}
 */

import { getEnvNumberWithDefault } from '@/utils/env_helpers';

export const FRIENDS_CONFIG = {
    /**
     * [CONTRACT] API paths — openapi.yaml Clause D, Friends.
     */
    paths: {
        list: '/friends',
        request: '/friends/request',
        remove: (friendId: number) => `/friends/${friendId}`,
    } as const,

    /**
     * [CONTRACT] openapi.yaml GET /friends: offset default 0, limit default 20
     * — đúng tên tham số như /albums, /media (offset/limit, KHÔNG phải
     * page/page_size).
     */
    LIST: {
        defaultOffset: getEnvNumberWithDefault('VITE_FRIENDS_LIST_DEFAULT_OFFSET', 0),
        defaultLimit: getEnvNumberWithDefault('VITE_FRIENDS_LIST_DEFAULT_LIMIT', 20),
    } as const,
} as const;

export type FriendsConfigType = typeof FRIENDS_CONFIG;