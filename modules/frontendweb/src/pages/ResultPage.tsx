/**
 * @file ResultPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang chỉ số hiệu năng THUẦN TÚY — KHÔNG hiển thị lại ảnh
 *              (đúng phân vai trò đã chốt với HomePage). 2 khối độc lập:
 *              1. Kết quả truy vấn vừa thực hiện (latency_ms, top_k, số
 *                 lượng kết quả) — đọc từ Outlet context (lastSearchResponse,
 *                 do DashboardPage cung cấp), KHÔNG tự gọi API.
 *              2. Benchmark CLIP tổng thể (mrr/hit_rate/precision/recall)
 *                 — admin only.
 *              SỬA: bổ sung nút "Run Evaluation" (POST /eval/run) — trước
 *              đây chỉ có "Refresh Metrics" (GET /eval/metrics, thuần đọc
 *              lại kết quả CŨ đã lưu). Phát hiện qua test thật: bảng
 *              evaluation_runs/evaluation_metrics vừa tạo migration xong,
 *              hoàn toàn trống — GET /eval/metrics trả về 0.0 cho cả 4 chỉ
 *              số vì query không tìm thấy dòng nào với status='completed'.
 *              PHẢI chạy POST /eval/run trước ít nhất 1 lần để có dữ liệu
 *              thật, sau đó "Refresh Metrics" mới có ý nghĩa. Dùng
 *              evalController.runEvaluation (đã có sẵn từ Nhóm 4, chưa
 *              từng được UI gọi tới) — không cần sửa routers/services/
 *              adapters, hạ tầng đã đủ.
 * @owner AG-04
 */

import React from 'react'
import { useOutletContext } from 'react-router-dom'
import { useEvalController } from '@/routers/eval_routers'
import type { DashboardOutletContext } from './HomePage'

export function ResultPage(): React.ReactElement {
    const { lastSearchResponse } = useOutletContext<DashboardOutletContext>()
    const evalController = useEvalController()

    const { runEvaluation, metrics, isAdminUser, isCheckingAdmin } = evalController

    // Sau khi Run Evaluation hoàn tất (isRunning: true → false, có result),
    // tự động refresh metrics 1 lần để hiển thị số liệu MỚI NHẤT ngay,
    // không bắt người dùng phải tự bấm "Refresh Metrics" thêm 1 lần nữa.
    const previousIsRunningRef = React.useRef(false)
    React.useEffect(() => {
        const justFinished = previousIsRunningRef.current && !runEvaluation.isRunning
        previousIsRunningRef.current = runEvaluation.isRunning

        if (justFinished && runEvaluation.result && !runEvaluation.isTimedOut) {
            metrics.fetchMetrics()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runEvaluation.isRunning])

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
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-sm)',
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

                    {isAdminUser && (
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button
                                type="button"
                                onClick={() => runEvaluation.run()}
                                disabled={runEvaluation.isRunning}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    backgroundColor: runEvaluation.isRunning
                                        ? 'var(--color-text-tertiary)'
                                        : 'var(--color-brand-primary)',
                                    color: 'var(--color-text-inverted)',
                                    fontSize: 'var(--text-ui-button-size)',
                                    cursor: runEvaluation.isRunning ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {runEvaluation.isRunning ? 'Running...' : 'Run Evaluation'}
                            </button>

                            <button
                                type="button"
                                onClick={() => metrics.fetchMetrics()}
                                disabled={metrics.isLoading}
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                                    borderRadius: 'var(--radius-full)',
                                    border: '1px solid var(--color-brand-primary)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-brand-primary)',
                                    fontSize: 'var(--text-ui-button-size)',
                                    cursor: metrics.isLoading ? 'not-allowed' : 'pointer',
                                    opacity: metrics.isLoading ? 0.6 : 1,
                                }}
                            >
                                {metrics.isLoading ? 'Loading...' : 'Refresh Metrics'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Trạng thái đang chạy evaluation — hiển thị riêng, không
                    lẫn với trạng thái lỗi/loading của metrics.fetchMetrics() */}
                {runEvaluation.isRunning && (
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-base)' }}>
                        Running evaluation — this samples indexed images and computes
                        MRR/HitRate/Precision/Recall. May take a while for large datasets.
                    </p>
                )}

                {runEvaluation.isTimedOut && (
                    <p style={{ color: 'var(--color-semantic-error)', marginBottom: 'var(--spacing-base)' }}>
                        Evaluation is taking longer than expected. It may still be running
                        on the server — try "Refresh Metrics" again in a moment.
                    </p>
                )}

                {runEvaluation.error && !runEvaluation.isTimedOut && (
                    <p style={{ color: 'var(--color-semantic-error)', marginBottom: 'var(--spacing-base)' }}>
                        {runEvaluation.error}
                    </p>
                )}

                {isCheckingAdmin ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Checking permissions...</p>
                ) : !isAdminUser ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Benchmark metrics are only visible to admin accounts.
                    </p>
                ) : metrics.error ? (
                    <p style={{ color: 'var(--color-semantic-error)' }}>{metrics.error}</p>
                ) : !metrics.metrics ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        No benchmark data yet — click "Run Evaluation" first, then
                        "Refresh Metrics" to load the results.
                    </p>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 'var(--spacing-base)',
                        }}
                    >
                        <MetricCard label="MRR" value={metrics.metrics.mrr.toFixed(4)} />
                        <MetricCard label="Hit Rate" value={metrics.metrics.hit_rate.toFixed(4)} />
                        <MetricCard label="Precision" value={metrics.metrics.precision.toFixed(4)} />
                        <MetricCard label="Recall" value={metrics.metrics.recall.toFixed(4)} />
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