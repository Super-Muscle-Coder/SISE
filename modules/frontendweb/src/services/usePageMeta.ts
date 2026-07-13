/**
 * @file usePageMeta.ts
 * @layer services (dùng chung, không thuộc riêng 1 workflow)
 * @description Hook set document.title và meta tag SEO. Trước đây là
 *              PageMeta.tsx đặt tại components/common/ — SAI vị trí: nó
 *              mang hình hài 1 React Component (<PageMeta />) nhưng thân
 *              hàm hoàn toàn không render JSX, chỉ side-effect DOM
 *              (document.title, meta tag), đúng bản chất là hook logic.
 *              Đã dời sang services/ theo đúng nguyên tắc §2.4.1:
 *              components/ (Nhóm B) chỉ chứa JSX thuần, không business
 *              logic; hook thuộc về Nhóm A.
 * @owner AG-04
 */

import { useEffect } from 'react'

interface UsePageMetaOptions {
    title: string
    description?: string
    robots?: string
}

/**
 * usePageMeta: Set page metadata cho SEO.
 *
 * Usage (trong pages/*.tsx, KHÔNG phải trong components/):
 *   usePageMeta({ title: 'Login - SISE', description: 'Sign in to your account' })
 */
export function usePageMeta({
    title,
    description,
    robots = 'index, follow',
}: UsePageMetaOptions): void {
    useEffect(() => {
        document.title = title

        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]')
            if (metaDescription) {
                metaDescription.setAttribute('content', description)
            } else {
                const meta = document.createElement('meta')
                meta.name = 'description'
                meta.content = description
                document.head.appendChild(meta)
            }
        }

        const metaRobots = document.querySelector('meta[name="robots"]')
        if (metaRobots) {
            metaRobots.setAttribute('content', robots)
        } else {
            const meta = document.createElement('meta')
            meta.name = 'robots'
            meta.content = robots
            document.head.appendChild(meta)
        }
    }, [title, description, robots])
}