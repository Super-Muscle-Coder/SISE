/**
 * @file ResultPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang chỉ số hiệu năng THUẦN TÚY — KHÔNG hiển thị lại ảnh
 *              (đúng phân vai trò đã chốt với HomePage). 2 khối độc lập:
 *              1. Kết quả truy vấn vừa thực hiện (latency_ms, top_k, số
 *                 lượng kết quả) — đọc từ Outlet context (lastSearchResponse,
 *                 do DashboardPage cung cấp), KHÔNG tự gọi API.
 *              2. Benchmark CLIP tổng thể (mrr/hit_rate/precision/recall)
 *                 — gọi GET /eval/metrics qua useEvalController(), CHỈ
 *                 admin xem được (theo đúng admin_authorization đã audit
 *                 Nhóm 4). Đây là bằng chứng học thuật chính cho báo cáo.
 * @owner AG-04
 */

import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useEvalController } from '@/routers/eval_routers'
import type { DashboardOutletContext } from './HomePage'

export function ResultPage(): React.ReactElement {
    const { lastSearchResponse } = useOutletContext<DashboardOutletContext>()
    const evalController = useEvalController()

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
            {/* Khối 1 — kết quả truy vấn vừa thực hiện */}
            <section>
                <h2
                    style={{
                        margin: '0 0 var(--spacing-base) 0',
                        fontSize: 'var(--text-heading-h3-size)',
                        fontWeight: 'var(--text-heading-h3-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Latest Query Performance
                </h2>

                {!lastSearchResponse ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        No search performed yet — try searching from the header above.
                    </p>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 'var(--spacing-base)',
                        }}
                    >
                        <MetricCard label="Query latency" value={`${lastSearchResponse.latency_ms.toFixed(1)} ms`} />
                        <MetricCard label="Top K" value={String(lastSearchResponse.top_k)} />
                        <MetricCard label="Results returned" value={String(lastSearchResponse.results.length)} />
                    </div>
                )}
            </section>

            {/* Khối 2 — benchmark CLIP tổng thể, admin only */}
            <section>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-base)',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'var(--text-heading-h3-size)',
                            fontWeight: 'var(--text-heading-h3-weight)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        CLIP Model Benchmark
                    </h2>

                    {evalController.isAdminUser && (
                        <button
                            type="button"
                            onClick={() => evalController.metrics.fetchMetrics()}
                            disabled={evalController.metrics.isLoading}
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-lg)',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                backgroundColor: 'var(--color-brand-primary)',
                                color: 'var(--color-text-inverted)',
                                fontSize: 'var(--text-ui-button-size)',
                                cursor: evalController.metrics.isLoading ? 'not-allowed' : 'pointer',
                                opacity: evalController.metrics.isLoading ? 0.6 : 1,
                            }}
                        >
                            {evalController.metrics.isLoading ? 'Loading...' : 'Refresh Metrics'}
                        </button>
                    )}
                </div>

                {evalController.isCheckingAdmin ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Checking permissions...</p>
                ) : !evalController.isAdminUser ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Benchmark metrics are only visible to admin accounts.
                    </p>
                ) : evalController.metrics.error ? (
                    <p style={{ color: 'var(--color-semantic-error)' }}>{evalController.metrics.error}</p>
                ) : !evalController.metrics.metrics ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        No benchmark data yet — click "Refresh Metrics" to load.
                    </p>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 'var(--spacing-base)',
                        }}
                    >
                        <MetricCard label="MRR" value={evalController.metrics.metrics.mrr.toFixed(4)} />
                        <MetricCard label="Hit Rate" value={evalController.metrics.metrics.hit_rate.toFixed(4)} />
                        <MetricCard label="Precision" value={evalController.metrics.metrics.precision.toFixed(4)} />
                        <MetricCard label="Recall" value={evalController.metrics.metrics.recall.toFixed(4)} />
                    </div>
                )}
            </section>
        </div>
    )
}

function MetricCard({ label, value }: { label: string; value: string }): React.ReactElement {
    return (
        <div
            style={{
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-light)',
                backgroundColor: 'var(--color-bg-primary)',
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--text-body-sm-size)', color: 'var(--color-text-secondary)' }}>
                {label}
            </p>
            <p
                style={{
                    margin: 0,
                    fontSize: 'var(--text-heading-h3-size)',
                    fontWeight: 'var(--text-heading-h3-weight)',
                    color: 'var(--color-brand-primary)',
                }}
            >
                {value}
            </p>
        </div>
    )
}