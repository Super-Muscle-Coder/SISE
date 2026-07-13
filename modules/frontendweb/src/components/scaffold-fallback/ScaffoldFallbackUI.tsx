/**
 * @file ScaffoldFallbackUI.tsx
 * @layer components (Layer 2)
 * @description UI hiển thị khi scaffold gặp lỗi (session expired,
 *              render error). Component thuần, chỉ nhận props.
 * @owner AG-04
 */
import React from 'react';

interface ScaffoldFallbackUIProps {
    title: string;
    message: string;
    buttonLabel: string;
    onButtonClick: () => void;
}

export function ScaffoldFallbackUI({
    title,
    message,
    buttonLabel,
    onButtonClick,
}: ScaffoldFallbackUIProps): React.ReactElement {
    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-bg-primary)',
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <h1
                    style={{
                        fontSize: 'var(--text-heading-h1-size)',
                        fontWeight: 'var(--text-heading-h1-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    {title}
                </h1>
                <p
                    style={{
                        marginTop: 'var(--spacing-base)',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    {message}
                </p>
                <button
                    onClick={onButtonClick}
                    style={{
                        marginTop: 'var(--spacing-lg)',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: 'var(--color-text-inverted)',
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        transition: `transform var(--duration-normal) var(--easing-in-out)`,
                    }}
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
}