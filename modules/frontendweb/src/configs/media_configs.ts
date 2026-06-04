// src/configs/media_configs.ts
// Central media workflow configuration constants
// T004-03 scope: single file upload, dashboard gallery, minimal album selection

export const MEDIA_CONFIG = {
  // --- API Paths (must match openapi.yaml) ---
  paths: {
    uploadUrl: '/media/upload-url',
    uploadConfirm: '/media/upload/confirm',
    mediaGet: '/media/{image_id}', // Template; substitute {image_id}
    mediaList: '/media', // Accepts ?album_id=N&page=N&page_size=M
    mediaDelete: '/media/{image_id}', // Template
    albumList: '/albums',
    albumCreate: '/albums',
  },

  // --- Upload Constraints (from data_schema.yaml global_configs) ---
  upload: {
    maxFileSizeMb: 20,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    presignedUrlExpirySec: 3600, // 1 hour
  },

  // --- Polling Strategy (Tech Lead Decision Q2) ---
  polling: {
    indexStatusPollIntervalMs: 3000, // 3 seconds
    maxPollRetries: 10, // 30 seconds total ceiling
  },

  // --- UI Layout (Masonry grid, Q1 decision) ---
  masonry: {
    gridClass: 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 break-inside-avoid',
    // Tailwind responsive columns; individual cards use break-inside-avoid
  },

  // --- Image Card Rendering ---
  imageCard: {
    aspectRatioDynamic: true, // Inject width/height as aspect-ratio CSS
    placeholderBg: 'bg-gray-200',
    errorBg: 'bg-red-50',
    skeletonPulse: true,
  },

  // --- Pagination Defaults ---
  pagination: {
    defaultPageSize: 20,
    minPageSize: 10,
    maxPageSize: 100,
  },

  // --- Local State Keys (for tracking upload context) ---
  storage: {
    pendingUploadsKey: 'media_pending_uploads', // LocalStorage key for tracking in-progress uploads
  },

  // --- Index Status Labels (for display) ---
  indexStatusLabels: {
    pending: 'Processing…',
    processing: 'Processing…',
    ready: 'Ready',
    failed: 'Failed',
    timeout_retry: 'Retry',
  },

  // --- Privacy Level Labels ---
  privacyLabels: {
    0: 'Private',
    1: 'Friends',
    2: 'Public',
  },

  privacyIcons: {
    0: '🔒',
    1: '👥',
    2: '🌐',
  },

  // --- Placeholder & Error Messages ---
  messages: {
    uploadInitError: 'Failed to request upload URL. Please try again.',
    uploadPutError: 'Failed to upload file to storage. Please try again.',
    uploadConfirmError: 'Failed to confirm upload. The file may have been uploaded but metadata registration failed.',
    pollTimeoutError: 'Image indexing took too long. Click to retry.',
    privacyDenied: 'You do not have permission to view this image.',
    imageNotFound: 'Image not found or has been deleted.',
  },
} as const;

export type MediaConfig = typeof MEDIA_CONFIG;