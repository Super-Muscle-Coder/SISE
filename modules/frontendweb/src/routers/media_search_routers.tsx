import React, { useRef } from 'react';
import { useHybridSearch, getConfidenceBadge } from '@/services/search_media_services';
import { searchAdapter } from '@/adapters/search_adapters';
import { SEARCH_CONFIG } from '@/configs/search_configs';
import type { SearchResultItem } from '@/entities/search_entities';

/**
 * SearchDashboard: Main search page component
 * Renders search input bar, image dropzone/picker, and results masonry grid
 */
export const SearchDashboard: React.FC = () => {
    const {
        textQuery,
        selectedImageFile,
        results,
        isLoading,
        error,
        handleTextQueryChange,
        handleImageFileSelected,
        clearSelectedImage,
        clearTextQuery,
    } = useHybridSearch();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragOverRef = useRef(false);

    // ============================================================
    // Drag-drop handlers
    // ============================================================

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragOverRef.current = true;
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragOverRef.current = false;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragOverRef.current = false;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleImageFileSelected(file);
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleImageFileSelected(e.target.files[0]);
        }
    };

    const triggerFilePicker = () => {
        fileInputRef.current?.click();
    };

    // ============================================================
    // Render
    // ============================================================

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header: Search Bar + Image Preview */}
            <div className="bg-white shadow-sm border-b border-gray-200 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Images</h1>

                    {/* Text Input */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder={SEARCH_CONFIG.messages.searchPlaceholder}
                            value={textQuery}
                            onChange={(e) => handleTextQueryChange(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                        {textQuery && (
                            <button
                                onClick={clearTextQuery}
                                className="mt-2 text-sm text-gray-600 hover:text-red-600 transition"
                            >
                                Clear text query
                            </button>
                        )}
                    </div>

                    {/* Image Preview (if selected) */}
                    {selectedImageFile && (
                        <div className="mb-6 border-2 border-dashed border-blue-400 rounded-lg p-4 bg-blue-50">
                            <div className="flex items-start gap-4">
                                <img
                                    src={URL.createObjectURL(selectedImageFile)}
                                    alt="Query preview"
                                    className="w-20 h-20 object-cover rounded"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        Query Image: {selectedImageFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <button
                                        onClick={clearSelectedImage}
                                        className="mt-2 text-sm text-red-600 hover:text-red-700 transition font-medium"
                                    >
                                        Change image
                                    </button>
                                </div>
                                {isLoading && (
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Image Dropzone (if no image selected) */}
                    {!selectedImageFile && (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${dragOverRef.current
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={SEARCH_CONFIG.imageAcceptTypes}
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                            <div className="mb-3">
                                <svg
                                    className="w-12 h-12 mx-auto text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-700 font-medium">
                                {SEARCH_CONFIG.messages.dropzonePrompt}
                            </p>
                            <button
                                onClick={triggerFilePicker}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                Select Image
                            </button>
                        </div>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-gray-600 font-medium">
                                {SEARCH_CONFIG.messages.uploadingIndicator}
                            </p>
                        </div>
                    )}

                    {/* Empty State (no search executed yet) */}
                    {!isLoading && results.length === 0 && !selectedImageFile && !textQuery && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <svg
                                className="w-16 h-16 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <p className="text-xl font-semibold text-gray-600">Ready to search</p>
                            <p className="text-sm text-gray-500">
                                {SEARCH_CONFIG.messages.noImageSelected}
                            </p>
                        </div>
                    )}

                    {/* No Results State (search executed, nothing found) */}
                    {!isLoading && results.length === 0 && (selectedImageFile || textQuery) && (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <svg
                                className="w-16 h-16 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-xl font-semibold text-gray-600">
                                {SEARCH_CONFIG.messages.emptyStateTitle}
                            </p>
                            <p className="text-sm text-gray-500">
                                {SEARCH_CONFIG.messages.emptyStateDescription}
                            </p>
                        </div>
                    )}

                    {/* Results Grid */}
                    {!isLoading && results.length > 0 && (
                        <>
                            <p className="text-sm text-gray-600 mb-6 font-medium">
                                {SEARCH_CONFIG.messages.resultsInfo(results.length)}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {results.map((result) => (
                                    <SearchResultCard key={result.image_id} result={result} />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * SearchResultCard: Individual result card with score badge and privacy indicator
 * Displays image, similarity score percentage, confidence level, and privacy status
 */
interface SearchResultCardProps {
    result: SearchResultItem;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ result }) => {
    const confidence = getConfidenceBadge(result.score);
    const scorePercentage = (result.score * 100).toFixed(1);
    const privacyLabel = SEARCH_CONFIG.privacyLabels[result.metadata.privacy_level as 0 | 1 | 2];
    const privacyIcon = SEARCH_CONFIG.privacyIcons[result.metadata.privacy_level as 0 | 1 | 2];

    // Render privacy icon inline (using text labels for simplicity)
    const getPrivacyIconSymbol = (): string => {
        switch (result.metadata.privacy_level) {
            case 0:
                return '🔒'; // Private
            case 1:
                return '👥'; // Friends
            case 2:
                return '🌍'; // Public
            default:
                return '❓';
        }
    };

    return (
        <div className="relative w-full rounded-lg overflow-hidden shadow-md hover:shadow-lg transition group">
            {/* Image Container with 1:1 aspect ratio */}
            <div className="relative w-full pb-[100%] bg-gray-200">
                <img
                    src={result.minio_url}
                    alt={`Result ${result.image_id}`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22%3E%3C/svg%3E';
                    }}
                />

                {/* Privacy Badge (top-right) */}
                <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition">
                    <span
                        title={privacyLabel}
                        className="text-lg"
                    >
                        {getPrivacyIconSymbol()}
                    </span>
                </div>

                {/* Similarity Score Overlay (bottom-left) */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2.5 py-1.5 rounded-md text-xs font-semibold">
                    {scorePercentage}% match
                </div>

                {/* Confidence Badge (bottom-right) */}
                <div
                    className={`absolute bottom-2 right-2 ${confidence.colorClass} px-2.5 py-1.5 rounded-md text-xs font-semibold shadow-md`}
                >
                    {confidence.label}
                </div>
            </div>

            {/* Card Info Footer */}
            <div className="p-3 bg-white">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs text-gray-600 font-medium truncate">
                        {privacyLabel}
                    </p>
                    {result.metadata.tags.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {result.metadata.tags.length} tag{result.metadata.tags.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500">
                    {new Date(result.metadata.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

export default SearchDashboard;