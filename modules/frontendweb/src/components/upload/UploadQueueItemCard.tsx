import React from 'react'
import type { UploadQueueItem } from '../../entities/upload_entities'

interface UploadQueueItemCardProps {
    item: UploadQueueItem
    onRetry: () => void
    onCancel: () => void
}

const STATUS_LABEL: Record<UploadQueueItem['state'], string> = {
    pending: 'Pending',
    presigning: 'Presigning',
    uploading: 'Uploading',
    confirming: 'Confirming',
    done: 'Done',
    error: 'Error',
    cancelled: 'Cancelled',
}

function getStatusColor(state: UploadQueueItem['state']): string {
    if (state === 'done') return 'var(--color-semantic-success)'
    if (state === 'error' || state === 'cancelled') return 'var(--color-semantic-error)'
    return 'var(--color-brand-primary)'
}

function isActiveState(state: UploadQueueItem['state']): boolean {
    return (
        state === 'pending' ||
        state === 'presigning' ||
        state === 'uploading' ||
        state === 'confirming'
    )
}

export function UploadQueueItemCard({
    item,
    onRetry,
    onCancel,
}: UploadQueueItemCardProps): React.ReactElement {
    const total = item.progress.total || 1
    const percent = Math.max(0, Math.min(100, Math.round((item.progress.loaded / total) * 100)))
    const showProgress = item.state === 'uploading' || item.state === 'presigning'

    return (
        <div
            style={{
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-base)',
                backgroundColor: 'var(--color-bg-primary)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--spacing-base)',
                    alignItems: 'center',
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <p
                        style={{
                            margin: 0,
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--text-body-sm-size)',
                            fontWeight: 'var(--font-weight-semibold)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                        title={item.file.name}
                    >
                        {item.file.name}
                    </p>
                    <p
                        style={{
                            margin: 'var(--spacing-xs) 0 0 0',
                            color: getStatusColor(item.state),
                            fontSize: 'var(--text-body-xs-size)',
                            fontWeight: 'var(--font-weight-medium)',
                        }}
                    >
                        {STATUS_LABEL[item.state]}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    {item.state === 'error' && (
                        <button
                            type="button"
                            onClick={onRetry}
                            style={{
                                border: '1px solid var(--color-border-medium)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm) var(--spacing-base)',
                                fontSize: 'var(--text-body-sm-size)',
                                cursor: 'pointer',
                            }}
                        >
                            Retry
                        </button>
                    )}

                    {isActiveState(item.state) && (
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                border: '1px solid var(--color-semantic-error)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-semantic-error)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm) var(--spacing-base)',
                                fontSize: 'var(--text-body-sm-size)',
                                cursor: 'pointer',
                            }}
                        >
                            Stop
                        </button>
                    )}
                </div>
            </div>

            {showProgress && (
                <div style={{ marginTop: 'var(--spacing-sm)' }}>
                    <div
                        style={{
                            height: '8px',
                            width: '100%',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${percent}%`,
                                backgroundColor: 'var(--color-brand-primary)',
                                transition:
                                    'width var(--duration-normal) var(--easing-in-out)',
                            }}
                        />
                    </div>
                    <p
                        style={{
                            margin: 'var(--spacing-xs) 0 0 0',
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--text-body-xs-size)',
                        }}
                    >
                        {percent}%
                    </p>
                </div>
            )}

            {item.error?.message && (
                <p
                    style={{
                        margin: 'var(--spacing-sm) 0 0 0',
                        color: 'var(--color-semantic-error)',
                        fontSize: 'var(--text-body-xs-size)',
                    }}
                >
                    {item.error.message}
                </p>
            )}
        </div>
    )
}