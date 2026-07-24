/**
 * @file ResultPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang chỉ số hiệu năng — KHÔNG hiển thị ảnh gallery thông
 *              thường (đúng phân vai trò đã chốt với HomePage), NHƯNG có
 *              hiển thị ảnh cụ thể trong phần "Misclassified Queries" vì
 *              đây là bằng chứng trực quan cần thiết cho phân tích lỗi.
 *              SỬA (nâng cấp UI theo yêu cầu Project Owner, chỉ đổi UI
 *              không đổi UX):
 *              1. Misclassified Queries: top-K nâng từ 6 → 10 ảnh, kích
 *                 thước ảnh lớn hơn hẳn (64px → 120px) để nhìn rõ độ
 *                 tương đồng thị giác giữa các ảnh CLIP nhầm lẫn.
 *              2. Thêm vùng biểu đồ (recharts) đặt giữa bảng Breakdown by
 *                 Class và Cross-Class Confusion Matrix — 3 tab: Bar chart
 *                 breakdown theo class, Confusion Matrix dạng heatmap tô
 *                 màu, Scatter phân bố score (đúng/sai) trong top-K của
 *                 misclassified queries. Dùng field `score` mới bổ sung
 *                 vào MisclassifiedTopKResult (eval_entities.ts).
 * @owner AG-04
 */

import React from 'react'
import { useOutletContext } from 'react-router-dom'
import {
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { useEvalController } from '@/routers/eval_routers'
import type { DashboardOutletContext } from './HomePage'
import type { EvaluationClassBreakdown, MisclassifiedQuery } from '@/entities/eval_entities'

// Cove categorical palette, thứ tự cố định — dùng cho breakdown chart
// (mỗi class 1 màu, KHÔNG cycle theo rank/giá trị).
const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948', '#7f77dd', '#993c1d']
const COLOR_SUCCESS = 'var(--color-semantic-success)'
const COLOR_ERROR = 'var(--color-semantic-error)'

export function ResultPage(): React.ReactElement {
    const { lastSearchResponse } = useOutletContext<DashboardOutletContext>()
    const evalController = useEvalController()
    const { runEvaluation, metrics, isAdminUser, isCheckingAdmin } = evalController

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xl)' }}>
            {/* Khối 1 — kết quả truy vấn vừa thực hiện */}
            <section>
                <h2 style={sectionTitleStyle}>Latest Query Performance</h2>

                {!lastSearchResponse ? (
                    <p style={mutedTextStyle}>
                        No search performed yet — try searching from the header above.
                    </p>
                ) : (
                    <MetricGrid>
                        <MetricCard label="Query latency" value={`${lastSearchResponse.latency_ms.toFixed(1)} ms`} />
                        <MetricCard label="Top K" value={String(lastSearchResponse.top_k)} />
                        <MetricCard label="Results returned" value={String(lastSearchResponse.results.length)} />
                    </MetricGrid>
                )}
            </section>

            {isCheckingAdmin ? (
                <p style={mutedTextStyle}>Checking permissions...</p>
            ) : !isAdminUser ? (
                <p style={mutedTextStyle}>Benchmark metrics are only visible to admin accounts.</p>
            ) : (
                <>
                    {/* Khối 2 — chạy benchmark mới, kết quả đầy đủ nhất */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-base)', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                            <h2 style={{ ...sectionTitleStyle, margin: 0 }}>CLIP Model Benchmark</h2>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <ActionButton onClick={() => runEvaluation.run()} disabled={runEvaluation.isRunning} variant="solid">
                                    {runEvaluation.isRunning ? 'Running...' : 'Run Evaluation'}
                                </ActionButton>
                                <ActionButton onClick={() => metrics.fetchMetrics()} disabled={metrics.isLoading} variant="outline">
                                    {metrics.isLoading ? 'Loading...' : 'Refresh Saved Metrics'}
                                </ActionButton>
                            </div>
                        </div>

                        {runEvaluation.isRunning && (
                            <p style={{ ...mutedTextStyle, marginBottom: 'var(--spacing-base)' }}>
                                Running evaluation — sampling indexed images and computing
                                MRR/HitRate/Precision/Recall + per-class breakdown. May take
                                a while for large datasets.
                            </p>
                        )}

                        {runEvaluation.isTimedOut && (
                            <p style={{ ...errorTextStyle, marginBottom: 'var(--spacing-base)' }}>
                                Evaluation is taking longer than expected. It may still be
                                running on the server.
                            </p>
                        )}

                        {runEvaluation.error && !runEvaluation.isTimedOut && (
                            <p style={{ ...errorTextStyle, marginBottom: 'var(--spacing-base)' }}>{runEvaluation.error}</p>
                        )}

                        {!runEvaluation.result ? (
                            !runEvaluation.isRunning && (
                                <p style={mutedTextStyle}>Click "Run Evaluation" to compute fresh benchmark results.</p>
                            )
                        ) : (
                            <EvaluationResultView result={runEvaluation.result} />
                        )}
                    </section>

                    {/* Khối 3 — đọc lại kết quả đã lưu DB (4 chỉ số cốt lõi) */}
                    <section>
                        <h2 style={sectionTitleStyle}>Last Saved Benchmark (from database)</h2>
                        {metrics.error ? (
                            <p style={errorTextStyle}>{metrics.error}</p>
                        ) : !metrics.metrics ? (
                            <p style={mutedTextStyle}>No saved benchmark data yet — click "Refresh Saved Metrics" to load.</p>
                        ) : (
                            <MetricGrid>
                                <MetricCard label="MRR" value={metrics.metrics.mrr.toFixed(4)} />
                                <MetricCard label="Hit Rate" value={metrics.metrics.hit_rate.toFixed(4)} />
                                <MetricCard label="Precision" value={metrics.metrics.precision.toFixed(4)} />
                                <MetricCard label="Recall" value={metrics.metrics.recall.toFixed(4)} />
                            </MetricGrid>
                        )}
                    </section>
                </>
            )}
        </div>
    )
}

/**
 * computeAggregateFromBreakdown: tính 4 chỉ số tổng hợp toàn cục bằng
 * weighted average theo query_count của từng class — dùng làm FALLBACK
 * khi response không có sẵn 4 field cấp gốc.
 */
function computeAggregateFromBreakdown(
    breakdown: Record<string, EvaluationClassBreakdown>
): { mrr: number; hit_rate: number; precision: number; recall: number; query_count: number } {
    const classes = Object.values(breakdown)
    const totalQueryCount = classes.reduce((sum, c) => sum + c.query_count, 0)

    if (totalQueryCount === 0) {
        return { mrr: 0, hit_rate: 0, precision: 0, recall: 0, query_count: 0 }
    }

    const weightedSum = (key: 'mrr' | 'hit_rate' | 'precision' | 'recall') =>
        classes.reduce((sum, c) => sum + c[key] * c.query_count, 0) / totalQueryCount

    return {
        mrr: weightedSum('mrr'),
        hit_rate: weightedSum('hit_rate'),
        precision: weightedSum('precision'),
        recall: weightedSum('recall'),
        query_count: totalQueryCount,
    }
}

function EvaluationResultView({
    result,
}: {
    result: NonNullable<ReturnType<typeof useEvalController>['runEvaluation']['result']>
}): React.ReactElement {
    const fallback = computeAggregateFromBreakdown(result.breakdown_by_class)
    const aggregate =
        typeof result.mrr === 'number'
            ? {
                  mrr: result.mrr,
                  hit_rate: result.hit_rate ?? fallback.hit_rate,
                  precision: result.precision ?? fallback.precision,
                  recall: result.recall ?? fallback.recall,
                  query_count: result.query_count ?? fallback.query_count,
              }
            : fallback

    const [activeTab, setActiveTab] = React.useState<'breakdown' | 'confusion' | 'scores'>('breakdown')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            {/* 4 chỉ số toàn cục */}
            <MetricGrid>
                <MetricCard label="MRR" value={aggregate.mrr.toFixed(4)} />
                <MetricCard label="Hit Rate" value={aggregate.hit_rate.toFixed(4)} />
                <MetricCard label="Precision" value={aggregate.precision.toFixed(4)} />
                <MetricCard label="Recall" value={aggregate.recall.toFixed(4)} />
                <MetricCard label="Query Count" value={String(aggregate.query_count)} />
                <MetricCard label="Cross-Class Confusion" value={`${(result.top1_cross_class_confusion_rate * 100).toFixed(1)}%`} />
            </MetricGrid>

            {/* Breakdown theo từng class — bảng */}
            <div>
                <h3 style={subTitleStyle}>Breakdown by Class</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-body-sm-size)' }}>
                        <thead>
                            <tr>
                                {['Class', 'N', 'MRR', 'Hit Rate', 'Precision', 'Recall', 'Confusion %'].map((h) => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(result.breakdown_by_class)
                                .sort((a, b) => b[1].precision - a[1].precision)
                                .map(([className, scores]) => (
                                    <tr key={className}>
                                        <td style={tdStyle}>{className}</td>
                                        <td style={tdStyle}>{scores.query_count}</td>
                                        <td style={tdStyle}>{scores.mrr.toFixed(3)}</td>
                                        <td style={tdStyle}>{scores.hit_rate.toFixed(3)}</td>
                                        <td style={tdStyle}>{scores.precision.toFixed(3)}</td>
                                        <td style={tdStyle}>{scores.recall.toFixed(3)}</td>
                                        <td style={{ ...tdStyle, color: scores.top1_cross_class_confusion_rate > 0 ? 'var(--color-semantic-error)' : 'var(--color-text-secondary)' }}>
                                            {(scores.top1_cross_class_confusion_rate * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Vùng biểu đồ — 3 tab */}
            <div>
                <h3 style={subTitleStyle}>Visual Analysis</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-base)', borderBottom: '1px solid var(--color-border-light)' }}>
                    <ChartTab label="Breakdown chart" active={activeTab === 'breakdown'} onClick={() => setActiveTab('breakdown')} />
                    <ChartTab label="Confusion heatmap" active={activeTab === 'confusion'} onClick={() => setActiveTab('confusion')} />
                    <ChartTab label="Score distribution" active={activeTab === 'scores'} onClick={() => setActiveTab('scores')} />
                </div>

                {activeTab === 'breakdown' && <BreakdownBarChart breakdown={result.breakdown_by_class} />}
                {activeTab === 'confusion' && (
                    <ConfusionHeatmap
                        classNames={Object.keys(result.breakdown_by_class)}
                        matrix={result.cross_class_confusion_matrix}
                    />
                )}
                {activeTab === 'scores' && <ScoreDistributionChart queries={result.misclassified_queries} />}
            </div>

            {/* Confusion matrix — dạng text, chỉ hiện nếu có nhầm lẫn */}
            {Object.keys(result.cross_class_confusion_matrix).length > 0 && (
                <div>
                    <h3 style={subTitleStyle}>Cross-Class Confusion Matrix</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {Object.entries(result.cross_class_confusion_matrix).map(([fromClass, confusions]) => (
                            <div key={fromClass} style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--color-text-primary)' }}>
                                <strong>{fromClass}</strong> confused with:{' '}
                                {Object.entries(confusions).map(([toClass, count]) => `${toClass} (${count}×)`).join(', ')}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Misclassified queries — bằng chứng trực quan kèm ảnh thật, top-10, ảnh lớn */}
            {result.misclassified_queries.length > 0 && (
                <div>
                    <h3 style={subTitleStyle}>Misclassified Queries ({result.misclassified_queries.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                        {result.misclassified_queries.map((mq, idx) => (
                            <MisclassifiedQueryCard key={`${mq.query_image_id}-${idx}`} query={mq} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * BreakdownBarChart: grouped bar chart 4 chỉ số (MRR/HitRate/Precision/
 * Recall) theo từng class — sequential ý nghĩa "magnitude", mỗi metric 1
 * màu cố định (không cycle theo class).
 */
function BreakdownBarChart({ breakdown }: { breakdown: Record<string, EvaluationClassBreakdown> }): React.ReactElement {
    const data = Object.entries(breakdown)
        .sort((a, b) => b[1].precision - a[1].precision)
        .map(([className, scores]) => ({
            name: className.length > 14 ? `${className.slice(0, 12)}…` : className,
            MRR: Number(scores.mrr.toFixed(3)),
            'Hit Rate': Number(scores.hit_rate.toFixed(3)),
            Precision: Number(scores.precision.toFixed(3)),
            Recall: Number(scores.recall.toFixed(3)),
        }))

    return (
        <div style={{ width: '100%', height: `${Math.max(320, data.length * 32)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border-light)" />
                    <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: 'var(--radius-base)' }} />
                    <Bar dataKey="MRR" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="Hit Rate" fill={SERIES_COLORS[1]} radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="Precision" fill={SERIES_COLORS[2]} radius={[0, 4, 4, 0]} barSize={12} />
                    <Bar dataKey="Recall" fill={SERIES_COLORS[3]} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
            <ChartLegend
                items={[
                    { label: 'MRR', color: SERIES_COLORS[0] },
                    { label: 'Hit Rate', color: SERIES_COLORS[1] },
                    { label: 'Precision', color: SERIES_COLORS[2] },
                    { label: 'Recall', color: SERIES_COLORS[3] },
                ]}
            />
        </div>
    )
}

/**
 * ConfusionHeatmap: ma trận NxN tô màu theo số lần nhầm lẫn — sequential
 * 1 màu (đậm = nhầm nhiều), ô đường chéo (chính nó) luôn để trống/xám.
 */
function ConfusionHeatmap({
    classNames,
    matrix,
}: {
    classNames: string[]
    matrix: Record<string, Record<string, number>>
}): React.ReactElement {
    const maxCount = Math.max(1, ...Object.values(matrix).flatMap((row) => Object.values(row)))

    const cellColor = (count: number): string => {
        if (count === 0) return 'var(--color-bg-secondary)'
        const intensity = count / maxCount
        // Sequential 1 hue (coral) — đậm dần theo cường độ nhầm lẫn.
        const alpha = 0.25 + intensity * 0.65
        return `rgba(216, 90, 48, ${alpha})`
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 'var(--text-body-xs-size)' }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, position: 'sticky', left: 0, backgroundColor: 'var(--color-bg-primary)' }} />
                        {classNames.map((c) => (
                            <th key={c} style={{ ...thStyle, writingMode: 'vertical-rl', textOrientation: 'mixed', maxWidth: '32px' }}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {classNames.map((rowClass) => (
                        <tr key={rowClass}>
                            <td style={{ ...tdStyle, position: 'sticky', left: 0, backgroundColor: 'var(--color-bg-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                                {rowClass}
                            </td>
                            {classNames.map((colClass) => {
                                const count = rowClass === colClass ? 0 : matrix[rowClass]?.[colClass] ?? 0
                                return (
                                    <td
                                        key={colClass}
                                        title={`${rowClass} → ${colClass}: ${count}`}
                                        style={{
                                            ...tdStyle,
                                            textAlign: 'center',
                                            backgroundColor: rowClass === colClass ? 'var(--color-border-light)' : cellColor(count),
                                            color: count > maxCount * 0.5 ? '#4A1B0C' : 'var(--color-text-secondary)',
                                            minWidth: '32px',
                                        }}
                                    >
                                        {rowClass === colClass ? '—' : count || ''}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/**
 * ScoreDistributionChart: scatter phân bố score (cosine similarity) của
 * mọi ảnh trong top-K của các misclassified queries — xanh (đúng) vs đỏ
 * (sai), minh họa khoảng cách điểm số giữa 2 nhóm.
 */
function ScoreDistributionChart({ queries }: { queries: MisclassifiedQuery[] }): React.ReactElement {
    const points = queries.flatMap((q, qIdx) =>
        q.top_k_results.map((r) => ({
            x: qIdx + 1,
            y: Number(r.score.toFixed(4)),
            rank: r.rank,
            isRelevant: r.is_relevant,
            queryLabel: q.query_tag_label,
        }))
    )

    const relevant = points.filter((p) => p.isRelevant)
    const irrelevant = points.filter((p) => !p.isRelevant)

    if (points.length === 0) {
        return <p style={mutedTextStyle}>No score data available for this run.</p>
    }

    return (
        <div>
            <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="query"
                            tickFormatter={(v) => `Q${v}`}
                            domain={[0.5, queries.length + 0.5]}
                            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="score"
                            domain={[0, 1]}
                            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                        />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{ fontSize: '12px', borderRadius: 'var(--radius-base)' }}
                            formatter={(value, name) => [String(value), name === 'y' ? 'score' : String(name)]}
                            labelFormatter={() => ''}
                        />
                        <Scatter name="Relevant" data={relevant} fill={COLOR_SUCCESS} />
                        <Scatter name="Irrelevant" data={irrelevant} fill={COLOR_ERROR} />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
            <ChartLegend
                items={[
                    { label: 'Relevant (same class)', color: COLOR_SUCCESS },
                    { label: 'Irrelevant (different class)', color: COLOR_ERROR },
                ]}
            />
            <p style={{ ...mutedTextStyle, fontSize: 'var(--text-body-xs-size)', marginTop: 'var(--spacing-xs)' }}>
                Each column (Q1, Q2...) is one misclassified query — points show the cosine similarity score of every image in its top-10 results.
            </p>
        </div>
    )
}

function MisclassifiedQueryCard({ query }: { query: MisclassifiedQuery }): React.ReactElement {
    return (
        <div
            style={{
                display: 'flex',
                gap: 'var(--spacing-lg)',
                padding: 'var(--spacing-base)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-bg-primary)',
                flexWrap: 'wrap',
            }}
        >
            <div style={{ flexShrink: 0 }}>
                {/* SỬA: ảnh query lớn hơn (96px → 160px) để dễ so sánh trực quan */}
                <img
                    src={query.query_minio_url}
                    alt={query.query_tag_label}
                    style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: 'var(--radius-base)' }}
                />
                <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--text-body-sm-size)', color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '160px' }}>
                    Query: {query.query_tag_label}
                </p>
            </div>

            <div style={{ flex: 1, minWidth: '320px' }}>
                <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-body-sm-size)', color: 'var(--color-text-primary)' }}>
                    Confused with: <strong>{query.confused_with_class}</strong>
                </p>
                {/* SỬA: top-10 (trước là top-6), ảnh lớn hơn (56px → 96px) */}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                    {query.top_k_results.slice(0, 10).map((r) => (
                        <div key={r.image_id} style={{ position: 'relative' }}>
                            <img
                                src={r.minio_url}
                                alt={`rank ${r.rank}, score ${r.score.toFixed(3)}`}
                                title={`rank ${r.rank} — score ${r.score.toFixed(3)}`}
                                style={{
                                    width: '96px',
                                    height: '96px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `3px solid ${r.is_relevant ? 'var(--color-semantic-success)' : 'var(--color-semantic-error)'}`,
                                }}
                            />
                            <span
                                style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    right: '4px',
                                    fontSize: '11px',
                                    backgroundColor: 'var(--color-overlay-black)',
                                    color: 'var(--color-text-inverted)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '1px 5px',
                                }}
                            >
                                #{r.rank} · {r.score.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function ChartTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }): React.ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                padding: 'var(--spacing-sm) var(--spacing-base)',
                border: 'none',
                borderBottom: `2px solid ${active ? 'var(--color-brand-primary)' : 'transparent'}`,
                backgroundColor: 'transparent',
                color: active ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                fontSize: 'var(--text-body-sm-size)',
                fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                cursor: 'pointer',
            }}
        >
            {label}
        </button>
    )
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }): React.ReactElement {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-base)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--text-body-xs-size)', color: 'var(--color-text-secondary)' }}>
            {items.map((item) => (
                <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
                    {item.label}
                </span>
            ))}
        </div>
    )
}

function MetricGrid({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--spacing-base)' }}>
            {children}
        </div>
    )
}

function MetricCard({ label, value }: { label: string; value: string }): React.ReactElement {
    return (
        <div style={{ padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-primary)', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: '0 0 var(--spacing-xs) 0', fontSize: 'var(--text-body-sm-size)', color: 'var(--color-text-secondary)' }}>{label}</p>
            <p style={{ margin: 0, fontSize: 'var(--text-heading-h3-size)', fontWeight: 'var(--text-heading-h3-weight)', color: 'var(--color-brand-primary)' }}>{value}</p>
        </div>
    )
}

function ActionButton({ children, onClick, disabled, variant }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant: 'solid' | 'outline' }): React.ReactElement {
    const solid = variant === 'solid'
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                borderRadius: 'var(--radius-full)',
                border: solid ? 'none' : '1px solid var(--color-brand-primary)',
                backgroundColor: solid ? (disabled ? 'var(--color-text-tertiary)' : 'var(--color-brand-primary)') : 'var(--color-bg-primary)',
                color: solid ? 'var(--color-text-inverted)' : 'var(--color-brand-primary)',
                fontSize: 'var(--text-ui-button-size)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
            }}
        >
            {children}
        </button>
    )
}

const sectionTitleStyle: React.CSSProperties = { margin: '0 0 var(--spacing-base) 0', fontSize: 'var(--text-heading-h3-size)', fontWeight: 'var(--text-heading-h3-weight)', color: 'var(--color-text-primary)' }
const subTitleStyle: React.CSSProperties = { margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--text-heading-h4-size)', fontWeight: 'var(--text-heading-h4-weight)', color: 'var(--color-text-primary)' }
const mutedTextStyle: React.CSSProperties = { color: 'var(--color-text-secondary)' }
const errorTextStyle: React.CSSProperties = { color: 'var(--color-semantic-error)' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 'var(--spacing-sm)', borderBottom: '2px solid var(--color-border-medium)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)' }
const tdStyle: React.CSSProperties = { padding: 'var(--spacing-sm)', borderBottom: '1px solid var(--color-border-light)', color: 'var(--color-text-primary)' }