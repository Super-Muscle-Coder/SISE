# Base Components Library

This directory contains reusable, dumb UI components that follow the design system.

## Component Structure

All components follow these principles:

1. **Pure Presentational** — No business logic, no API calls
2. **Design Token Aligned** — Use `design_tokens.ts` for all styling
3. **Tailwind-based** — Leverage Tailwind utility classes + custom variants
4. **Fully Typed** — Strict TypeScript, no `any` types
5. **Accessible** — WCAG 2.1 AA compliant (ARIA labels, semantic HTML)
6. **Composable** — Small, focused components that combine into larger patterns

## Available Components (To Be Implemented in T004-03+)

### Layout Components
- `CardBase` — Container for masonry gallery items with overlay support
- `Container` — Responsive wrapper with max-width
- `Grid` — Masonry grid layout
- `Spacer` — Vertical/horizontal spacing utility

### Form Components
- `Button` — Primary, secondary, ghost variants (pill-shaped)
- `Input` — Text input with focus/error states
- `TextArea` — Multi-line text input
- `Label` — Form label with accessibility
- `FormField` — Wrapper combining label + input + error message

### Feedback Components
- `Badge` — Tag/status indicator (confidence score, privacy level)
- `Toast` — Temporary notification (success, error, info, warning)
- `Spinner` — Loading indicator (animated)
- `ProgressBar` — Progress visualization

### Image Components
- `ImageCard` — Masonry card with image, overlay, and action buttons
- `Avatar` — User profile picture (circular)

### Navigation Components
- `Header` — App navigation bar
- `Breadcrumb` — Navigation path indicator

## Import Example
