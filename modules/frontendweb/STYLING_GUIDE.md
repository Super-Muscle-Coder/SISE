# 🎨 Hướng Dẫn Styling Thống Nhất - Frontend Web

> **Tài liệu này là Single Source of Truth (SSoT) cho tất cả quyết định styling**

---

## 📋 Tóm Tắt Nhanh

| Quyết Định | Giá Trị |
|-----------|--------|
| **Phương pháp styling chính** | `Tailwind CSS` (utility-first classes) |
| **Phương pháp styling phụ** | `CSS-in-globals.css` (design tokens + base styles) |
| **Khi nào dùng CSS** | Base styles, reusable patterns, complex animations |
| **Khi nào dùng Tailwind** | Component-specific styles, responsive variants, states |
| **CSS custom properties** | ✅ Được khuyến khích (tokens, variables) |
| **Inline styles (`style={}`)** | ❌ CẤMP CÓ |
| **CSS Modules** | ❌ CẤMP CÓ |
| **Styled-components** | ❌ CẤMP CÓ |

---

## 🏗️ Kiến Trúc Styling (3 Tầng)

```
Layer 1: Design Tokens (globals.css + design_tokens.ts)
		 ↓
Layer 2: Component Base Styles (Tailwind classes)
		 ↓
Layer 3: Component Variants (Tailwind responsive + state modifiers)
```

### **Layer 1: Design Tokens (CSS Variables + TypeScript Objects)**

**File:** `src/styles/globals.css` + `src/configs/design_tokens.ts`

**Nội dung:**
- 🎨 CSS custom properties (--color-*, --spacing-*, --font-*, etc.)
- 📝 TypeScript constant objects (COLORS, TYPOGRAPHY, SPACING, SHADOWS)
- 🔄 Base element styles (h1, h2, p, input, button, a)
- ⚙️ Reusable utility classes (.masonry-container, .transition-smooth, etc.)

**Ví dụ:**
```css
/* globals.css */
:root {
	--color-brand-primary: #E60023;
	--spacing-base: 1rem;
	--font-size-lg: 1.125rem;
}

h1 {
	font-size: var(--font-size-4xl);
	font-weight: 800;
	line-height: 1.1;
}

.masonry-container {
	columns: 2;
	gap: var(--spacing-base);
}
```

```typescript
// design_tokens.ts
export const COLORS = {
	background: { primary: '#ffffff', secondary: '#f9f9f9' },
	text: { primary: '#000000', secondary: '#71717a' },
};

export const TYPOGRAPHY = {
	heading: {
		h1: { fontSize: '2.25rem', fontWeight: '800', lineHeight: '1.1' },
	},
};
```

**Khi nào sử dụng Layer 1:**
- ✅ Màu sắc, kích thước, font, shadow cho toàn app
- ✅ Base styles cho HTML elements (h1, input, button, etc.)
- ✅ Reusable patterns (masonry grid, transitions)
- ✅ Dark mode, responsive breakpoints

---

### **Layer 2: Component Base Structure (Tailwind Utilities)**

**File:** Component `.tsx` files

**Nội dung:**
- Structure: `flex`, `grid`, `absolute`, `relative` (layout)
- Sizing: `w-full`, `h-auto`, `min-w-0` (dimensions)
- Spacing: `px-4`, `py-8`, `mt-2` (padding/margin)
- Display: `block`, `inline-block`, `hidden` (visibility)

**Ví dụ:**
```tsx
// LoginForm.tsx
export function LoginForm() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
			<div className="w-full max-w-md space-y-6">
				<h1 className="text-4xl font-bold text-zinc-900">Sign In</h1>
				<form className="space-y-4">
					<input 
						className="w-full px-4 py-3 border border-zinc-200 rounded-md focus:outline-none focus:border-red-600"
						placeholder="Email"
					/>
				</form>
			</div>
		</div>
	);
}
```

**Khi nào sử dụng Layer 2:**
- ✅ Layout structure (flex, grid, absolute)
- ✅ Sizing (w-*, h-*, max-w-*)
- ✅ Spacing that's consistent with design tokens (px-4 = spacing-base, py-8 = spacing-2xl)
- ✅ Display properties (block, hidden, inline-flex)

---

### **Layer 3: Component Variants & States (Tailwind Modifiers)**

**File:** Component `.tsx` files

**Nội dung:**
- Responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- State: `hover:`, `focus:`, `active:`, `disabled:`
- Group: `group-hover:`, `peer-checked:`
- Dark mode: `dark:`

**Ví dụ:**
```tsx
// Button.tsx
export function Button({ isLoading, disabled }) {
	return (
		<button
			disabled={disabled || isLoading}
			className={`
				px-6 py-3 rounded-full font-semibold
				bg-red-600 text-white

				/* Responsive */
				sm:px-8 md:py-4

				/* Hover/Active */
				hover:bg-red-700 active:scale-95

				/* Disabled */
				disabled:opacity-60 disabled:cursor-not-allowed

				/* Loading */
				${isLoading ? 'animate-pulse' : ''}
			`}
		>
			{isLoading ? 'Loading...' : 'Sign In'}
		</button>
	);
}
```

**Khi nào sử dụng Layer 3:**
- ✅ Responsive variants (sm:, md:, lg:)
- ✅ State styles (hover:, focus:, active:, disabled:)
- ✅ Conditional classes (dynamic states based on props)

---

## 📐 Kích Thước & Spacing (Tailwind → Design Tokens)

Tailwind spacing map directly to design tokens:

| Tailwind | Design Token | Value |
|----------|--------------|-------|
| `px-1` `py-1` | `--spacing-xs` | 0.25rem |
| `px-2` `py-2` | `--spacing-sm` | 0.5rem |
| `px-3` `py-3` | `--spacing-md` | 0.75rem |
| `px-4` `py-4` | `--spacing-base` | 1rem |
| `px-6` `py-6` | `--spacing-lg` | 1.5rem |
| `px-8` `py-8` | `--spacing-xl` | 2rem |
| `px-10` `py-10` | `--spacing-2xl` | 2.5rem |
| `px-12` `py-12` | `--spacing-3xl` | 3rem |

**Rule:** Luôn sử dụng Tailwind spacing classes thay vì hardcode pixel values.

---

## 🎨 Màu Sắc (Tailwind → Design Tokens)

### Color Mapping

| Use Case | Design Token | Tailwind Class |
|----------|--------------|-----------------|
| Page background | `--color-bg-primary` | `bg-white` |
| Card background | `--color-bg-secondary` | `bg-zinc-50` |
| Hover background | `--color-bg-tertiary` | `bg-zinc-100` |
| Primary text | `--color-text-primary` | `text-zinc-900` |
| Secondary text | `--color-text-secondary` | `text-zinc-500` |
| Brand color | `--color-brand-primary` | `bg-red-600` / `text-red-600` |
| Success | `--color-semantic-success` | `text-emerald-500` |
| Error | `--color-semantic-error` | `text-red-500` |
| Warning | `--color-semantic-warning` | `text-amber-500` |

**Rule:** Không sử dụng arbitrary Tailwind colors (ví dụ: `bg-blue-700`). Chỉ dùng colors được define trong design tokens.

**❌ Sai:**
```tsx
<button className="bg-blue-700 text-white">Sign In</button> {/* undefined color */}
```

**✅ Đúng:**
```tsx
<button className="bg-red-600 text-white">Sign In</button> {/* from COLORS.brand.primary */}
```

---

## 📝 Khi Nào Dùng CSS vs Tailwind

### ✅ Dùng CSS (globals.css)

```css
/* 1. Base element styles */
button {
	padding: var(--spacing-md) var(--spacing-lg);
	border-radius: var(--radius-full);
	transition: all var(--duration-base) var(--easing-in-out);
}

/* 2. Reusable utility classes */
.masonry-container {
	columns: 3;
	gap: var(--spacing-base);
}

/* 3. Complex pseudo-elements / media queries */
@media (min-width: 768px) {
	.masonry-container {
		columns: 4;
	}
}

/* 4. Animations */
@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.fade-in {
	animation: fadeIn var(--duration-base) var(--easing-out);
}
```

### ✅ Dùng Tailwind

```tsx
// 1. Component-specific layout
<div className="flex gap-4 p-6">

// 2. Responsive variants
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">

// 3. State modifiers
<button className="hover:bg-red-700 active:scale-95 disabled:opacity-60">

// 4. Dynamic conditional classes
<div className={`p-4 ${isLoading ? 'animate-pulse' : ''}`}>
```

### ❌ KHÔNG dùng những cách này

```tsx
// ❌ Inline styles
<div style={{ color: 'red', padding: '1rem' }}>

// ❌ CSS Modules
import styles from './Button.module.css';
<button className={styles.primary}>

// ❌ Styled Components
const StyledButton = styled.button`
	background-color: red;
`;

// ❌ Arbitrary values (trong hầu hết cases)
<div className="p-[17px] text-[#e60023]">
```

---

## 🔤 Typography (Font Sizes)

| Use Case | Tailwind | CSS | Size |
|----------|----------|-----|------|
| Page Heading | `text-4xl` | `var(--font-size-4xl)` | 2.25rem |
| Section Heading | `text-3xl` | `var(--font-size-3xl)` | 1.875rem |
| Card Title | `text-xl` | `var(--font-size-xl)` | 1.25rem |
| Body Text | `text-base` | `var(--font-size-base)` | 1rem |
| Small Text | `text-sm` | `var(--font-size-sm)` | 0.875rem |
| Caption | `text-xs` | `var(--font-size-xs)` | 0.75rem |

**Rule:** Không hardcode `font-size` trong component. Luôn dùng Tailwind scale classes.

---

## 🌐 Responsive Design (Mobile-First)

**Breakpoints (Tailwind):**
- Base (mobile): No prefix, < 640px
- `sm:`: >= 640px
- `md:`: >= 768px
- `lg:`: >= 1024px
- `xl:`: >= 1280px
- `2xl:`: >= 1536px

**Pattern (Mobile-First):**
```tsx
// Mobile first (base classes apply to all)
<div className="
	grid grid-cols-1          {/* 1 column on mobile */}
	sm:grid-cols-2            {/* 2 columns on tablet */}
	md:grid-cols-3            {/* 3 columns on desktop */}
	lg:grid-cols-4            {/* 4 columns on large desktop */}
	gap-4
">

// Or with flex
<div className="
	flex flex-col              {/* stacked on mobile */}
	md:flex-row                {/* side-by-side on desktop */}
	gap-6
">
```

---

## 🎯 Shadows & Depth (Tailwind + CSS Variables)

| Level | Tailwind | CSS Variable | Use Case |
|-------|----------|--------------|----------|
| Subtle | `shadow-sm` | `--shadow-sm` | Buttons, inputs |
| Medium | `shadow-md` | `--shadow-md` | Cards, dropdowns |
| Large | `shadow-lg` | `--shadow-lg` | Modals, floating panels |
| Extra Large | `shadow-xl` | `--shadow-xl` | Hero sections |

**Rule:** Dùng Tailwind shadow classes, không hardcode `box-shadow`.

```tsx
<div className="shadow-md">  {/* ✅ Correct */}
<div style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>  {/* ❌ Wrong */}
```

---

## 🔄 Reusable Patterns (Utility Classes)

### Masonry Grid
```css
/* globals.css */
.masonry-container {
	columns: 2;
	gap: var(--spacing-base);
}

.masonry-item {
	break-inside: avoid;
	margin-bottom: var(--spacing-base);
}

@media (min-width: 640px) {
	.masonry-container {
		columns: 3;
	}
}
```

**Use in Component:**
```tsx
<div className="masonry-container">
	<div className="masonry-item">Item 1</div>
	<div className="masonry-item">Item 2</div>
</div>
```

### Smooth Transitions
```css
/* globals.css */
.transition-smooth {
	transition: all var(--duration-base) var(--easing-in-out);
}
```

**Use in Component:**
```tsx
<button className="transition-smooth hover:bg-red-700">
	Smooth hover effect
</button>
```

### Truncate Text
```tsx
<p className="truncate">Long text that gets cut off...</p>
<p className="line-clamp-2">Two lines max...</p>
```

---

## 📋 Component Structure Template

```tsx
/**
 * @file MyComponent.tsx
 * @description Component description
 * @owner AG-04
 */

import React from 'react';
import { COLORS, TYPOGRAPHY } from '@/configs/design_tokens';

interface MyComponentProps {
	variant?: 'primary' | 'secondary';
	isLoading?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
}

/**
 * MyComponent: Brief description
 * 
 * Styling:
 * - Background: COLORS.background.primary
 * - Text: COLORS.text.primary
 * - Brand color: COLORS.brand.primary
 */
export function MyComponent({
	variant = 'primary',
	isLoading = false,
	disabled = false,
	children,
}: MyComponentProps) {
	return (
		<div
			className={`
				/* Base structure (Layer 2) */
				flex flex-col items-center justify-center
				px-4 py-6 rounded-lg

				/* Variant-specific (Layer 3) */
				${variant === 'primary' ? 'bg-red-600 text-white' : 'bg-zinc-100 text-zinc-900'}

				/* State modifiers (Layer 3) */
				hover:shadow-lg active:scale-95
				disabled:opacity-60 disabled:cursor-not-allowed

				/* Loading state */
				${isLoading ? 'animate-pulse' : ''}

				/* Transitions */
				transition-smooth
			`}
			disabled={disabled || isLoading}
		>
			{children}
		</div>
	);
}
```

---

## ✅ Checklist Trước Khi Commit

- [ ] Không có inline `style={}` attributes
- [ ] Không có hardcoded colors (dùng Tailwind color classes)
- [ ] Không có hardcoded font sizes (dùng Tailwind text-* classes)
- [ ] Không có arbitrary Tailwind values (ví dụ `p-[17px]`)
- [ ] Responsive classes present (sm:, md:, lg: nếu cần)
- [ ] Shadow classes dùng Tailwind (shadow-sm, shadow-md, etc.)
- [ ] Transitions dùng Tailwind hoặc .transition-smooth class
- [ ] Tất cả spacing dùng Tailwind scale (px-4, py-6, gap-2, etc.)
- [ ] State modifiers present (hover:, focus:, disabled:, active:)
- [ ] Design tokens từ design_tokens.ts được import nếu cần dynamic styling

---

## 🚀 Quy Trình Bắt Đầu Một Component Mới

1. **Xác định Layout Structure** → Dùng Tailwind flex/grid
2. **Áp dụng Colors & Typography** → Dùng Tailwind color + text-* classes
3. **Thêm Spacing** → Dùng Tailwind px/py/gap classes
4. **Thêm Responsive** → Thêm sm:, md:, lg: variants
5. **Thêm States** → Thêm hover:, focus:, disabled:, active:
6. **Test thực tế** → Kiểm tra trên mobile, tablet, desktop

---

## 📚 Tham Khảo

- **Design Tokens:** `src/configs/design_tokens.ts`
- **Base Styles:** `src/styles/globals.css`
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Pinterest Design System:** https://pinterest.design (inspiration)

---

**Cập nhật lần cuối:** 2026-05-10  
**Và chơi:** AG-04 (WebFrontendAgent)
