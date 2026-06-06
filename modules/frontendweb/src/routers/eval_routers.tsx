/**
 * Evaluation Dashboard Router
 * 
 * Main UI component for the evaluation dashboard.
 * Displays real-time status, control buttons, and metric cards.
 * Uses native SVG + Tailwind CSS for metrics visualization (no charting libs).
 * Aligned with globals.css design tokens and tailwind.config.ts color scheme.
 */

import React, { useState } from 'react';
import { useEvaluationPolling } from '../services/eval_services';
import { getEvalConfig } from '../configs/eval_configs';
import { MetricCardData } from '../entities/eval_entities';

// ============================================================================
// MAIN COMPONENT: EvaluationDashboard
// ============================================================================

export function EvaluationDashboard(): React.ReactElement {
    const {
        runStatus,
        evalId,
        metrics,
        errorMessage,
        elapsedMs,
        lastFetchedAt,
        startEvaluation,
        stopEvaluation,
        resetEvaluation,
    } = useEvaluationPolling();

    const config = getEvalConfig();
    const [showDetails, setShowDetails] = useState(false);

    // ========================================================================
    // RENDER HELPERS
    // ========================================================================

    // Design system color mapping (aligned with CSS variables in globals.css)
    const statusBadgeClass = {
        idle: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
        pending: 'bg-blue-100 text-blue-700 border border-blue-200',
        polling: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        success: 'bg-green-100 text-green-700 border border-green-200',
        failed: 'bg-red-100 text-red-700 border border-red-200',
        timeout: 'bg-orange-100 text-orange-700 border border-orange-200',
    }[runStatus];

    const statusMessage = config.labels.status[runStatus];

    // Format elapsed time for display
    const formatElapsedTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${seconds}s`;
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-zinc-900 mb-2">
                    Evaluation Dashboard
                </h1>
                <p className="text-zinc-600 text-lg">
                    Monitor retrieval model performance metrics (MRR, Precision, Hit Rate, Recall)
                </p>
            </div>

            {/* Status Panel */}
            <div className="bg-white rounded-lg shadow-base p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-800 mb-2">Status</h2>
                        <div className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${statusBadgeClass}`}>
                            {statusMessage}
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex gap-3">
                        {runStatus === 'idle' && (
                            <button
                                onClick={startEvaluation}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150"
                            >
                                {config.labels.runButton}
                            </button>
                        )}

                        {(runStatus === 'pending' || runStatus === 'polling') && (
                            <button
                                onClick={stopEvaluation}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:scale-95 transition-all duration-150"
                            >
                                {config.labels.stopButton}
                            </button>
                        )}

                        {(runStatus === 'success' || runStatus === 'failed' || runStatus === 'timeout') && (
                            <button
                                onClick={resetEvaluation}
                                className="px-6 py-2 bg-zinc-600 text-white rounded-lg font-semibold hover:bg-zinc-700 active:scale-95 transition-all duration-150"
                            >
                                {config.labels.resetButton}
                            </button>
                        )}
                    </div>
                </div>

                {/* Loading Spinner (visible during polling) */}
                {(runStatus === 'pending' || runStatus === 'polling') && (
                    <div className="flex items-center gap-3 mt-4">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-sm text-zinc-600">
                            {runStatus === 'pending'
                                ? 'Initializing evaluation...'
                                : `Evaluating... (${formatElapsedTime(elapsedMs)})`}
                        </span>
                    </div>
                )}

                {/* Metadata Footer */}
                {evalId && (
                    <div className="mt-4 text-xs text-zinc-500 space-y-1 font-mono">
                        <p>Eval ID: {evalId}</p>
                        {lastFetchedAt && (
                            <p>Last updated: {new Date(lastFetchedAt).toLocaleTimeString()}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                    <h3 className="text-sm font-semibold text-red-800 mb-1">Error</h3>
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
            )}

            {/* Metric Cards Grid */}
            {metrics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {metrics.map((metric, idx) => (
                        <MetricCard key={idx} metric={metric} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {runStatus === 'idle' && metrics.length === 0 && (
                <div className="bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-300 p-12 text-center">
                    <p className="text-zinc-600 mb-4 font-medium">No evaluation has been run yet.</p>
                    <p className="text-zinc-500 text-sm">
                        Click &quot;{config.labels.runButton}&quot; to benchmark the retrieval model on indexed images.
                    </p>
                </div>
            )}

            {/* Details Toggle (optional, for debugging) */}
            {runStatus !== 'idle' && (
                <div className="mt-8">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        {showDetails ? 'Hide' : 'Show'} Details
                    </button>
                    {showDetails && (
                        <pre className="bg-zinc-100 rounded-lg p-4 mt-4 overflow-x-auto text-xs text-zinc-700 font-mono border border-zinc-200">
                            {JSON.stringify(
                                {
                                    runStatus,
                                    evalId,
                                    elapsedMs,
                                    metricsCount: metrics.length,
                                    lastFetchedAt,
                                },
                                null,
                                2
                            )}
                        </pre>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// METRIC CARD COMPONENT: Native SVG Visualizations
// ============================================================================

interface MetricCardProps {
    metric: MetricCardData;
}

/**
 * Reusable metric card with native SVG visualization.
 * No external charting libraries — pure HTML/SVG + Tailwind.
 */
function MetricCard({ metric }: MetricCardProps): React.ReactElement {
    const { label, value, unit, tooltip } = metric;

    // Normalize value to 0–1 for visualization (already done in transform function)
    const normalizedValue = unit === '%' ? value / 100 : value;

    return (
        <div className="bg-white rounded-lg shadow-base hover:shadow-md transition-shadow p-6 relative group">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-700">{label}</h3>
                {/* Tooltip Icon */}
                <div className="relative">
                    <button
                        className="text-zinc-400 hover:text-zinc-600 text-sm w-5 h-5 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                        title={tooltip}
                    >
                        i
                    </button>
                    {/* Tooltip Popover (Tailwind group hover) */}
                    <div className="absolute z-10 hidden group-hover:block bg-zinc-900 text-white text-xs rounded-lg p-2 w-40 bottom-full right-0 mb-2 shadow-lg">
                        {tooltip}
                        {/* Arrow */}
                        <div className="absolute top-full right-2 w-2 h-2 bg-zinc-900 transform rotate-45" />
                    </div>
                </div>
            </div>

            {/* Value Display */}
            <div className="mb-4">
                <span className="text-3xl font-extrabold text-zinc-900">
                    {normalizedValue.toFixed(unit === '%' ? 1 : 3)}
                </span>
                <span className="text-lg text-zinc-600 ml-1">{unit}</span>
            </div>

            {/* SVG Visualization */}
            <div className="mb-2">
                {label.includes('Precision') || label.includes('Hit Rate') || label.includes('Recall') ? (
                    /* Horizontal Progress Bar */
                    <ProgressBar value={normalizedValue} />
                ) : (
                    /* MRR: Circular Progress Ring */
                    <CircleProgressRing value={normalizedValue} />
                )}
            </div>

            {/* Mini Label */}
            <p className="text-xs text-zinc-500 text-center">
                {(normalizedValue * 100).toFixed(0)}% of maximum
            </p>
        </div>
    );
}

// ============================================================================
// SVG COMPONENT: HORIZONTAL PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
    value: number; // 0.0 to 1.0
}

function ProgressBar({ value }: ProgressBarProps): React.ReactElement {
    return (
        <svg viewBox="0 0 100 6" className="w-full h-auto" preserveAspectRatio="none">
            {/* Background track */}
            <rect x="0" y="0" width="100" height="6" fill="#e4e4e7" rx="3" />
            {/* Filled track */}
            <rect
                x="0"
                y="0"
                width={value * 100}
                height="6"
                fill="#3b82f6"
                rx="3"
                style={{ transition: 'width 0.3s ease-out' }}
            />
        </svg>
    );
}

// ============================================================================
// SVG COMPONENT: CIRCULAR PROGRESS RING
// ============================================================================

interface CircleProgressRingProps {
    value: number; // 0.0 to 1.0
}

function CircleProgressRing({ value }: CircleProgressRingProps): React.ReactElement {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.max(0, Math.min(1, value)));

    return (
        <svg viewBox="0 0 80 80" className="w-full max-w-xs mx-auto">
            {/* Background circle */}
            <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="4"
            />
            {/* Progress circle (animated) */}
            <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
            />
        </svg>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default EvaluationDashboard;