import React from 'react'
import type { ImageMetadata } from '../../entities/media_entities'

interface ImageCardProps {
    item: ImageMetadata
}

const PRIVACY_ICON: Record<0 | 1 | 2, string> = {
    0: '🔒',
    1: '👥',
    2: '🌍',
}

const INDEX_STATUS_LABEL: Record<'pending' | 'ready' | 'failed', string> = {
    pending: 'Processing...',
    ready: 'Ready',
    failed: 'Failed',
}

const INDEX_STATUS_COLOR: Record<'pending' | 'ready' | 'failed', string> = {
    pending: 'var(--color-semantic-warning)',
    ready: 'var(--color-semantic-success)',
    failed: 'var(--color-semantic-error)',
}

export function ImageCard({ item }: ImageCardProps): React.ReactElement {
    const [imageLoadFailed, setImageLoadFailed] = React.useState(false)

    const shownTags = item.tags?.slice(0, 3) ?? []
    const extraTagCount = Math.max(0, (item.tags?.length ?? 0) - shownTags.length)
    const createdDate = new Date(item.created_at).toLocaleDateString()

    return (
        <article
            style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    aspectRatio: '1 / 1',
                    backgroundColor: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {imageLoadFailed ? (
                    <div
                        style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--text-body-sm-size)',
                            textAlign: 'center',
                            padding: 'var(--spacing-base)',
                        }}
                    >
                        Failed to load image
                    </div>
                ) : (
                    <img
                        src={item.minio_url}
                        alt={`Image ${item.image_id}`}
                        onError={() => setImageLoadFailed(true)}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                )}
            </div>

            <div style={{ padding: 'var(--spacing-base)' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-sm)',
                    }}
                >
                    <span
                        style={{
                            fontSize: 'var(--text-body-sm-size)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        {PRIVACY_ICON[item.privacy_level]}{' '}
                        {item.privacy_level === 0
                            ? 'Private'
                            : item.privacy_level === 1
                                ? 'Friends'
                                : 'Public'}
                    </span>

                    <span
                        style={{
                            fontSize: 'var(--text-ui-badge-size)',
                            fontWeight: 'var(--text-ui-badge-weight)',
                            color: INDEX_STATUS_COLOR[item.index_status],
                        }}
                    >
                        {INDEX_STATUS_LABEL[item.index_status]}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-sm)',
                    }}
                >
                    {shownTags.map((tag) => (
                        <span
                            key={`${item.image_id}-${tag}`}
                            style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-secondary)',
                                borderRadius: 'var(--radius-full)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                fontSize: 'var(--text-body-xs-size)',
                            }}
                        >
                            #{tag}
                        </span>
                    ))}
                    {extraTagCount > 0 && (
                        <span
                            style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: 'var(--text-body-xs-size)',
                            }}
                        >
                            +{extraTagCount}
                        </span>
                    )}
                </div>

                <p
                    style={{
                        margin: 0,
                        color: 'var(--color-text-tertiary)',
                        fontSize: 'var(--text-body-xs-size)',
                    }}
                >
                    {createdDate}
                </p>
            </div>
        </article>
    )
}