/**
 * @file FormInput.tsx
 * @layer components (Layer 3)
 * @description Reusable form input component with label and validation.
 *              SỬA: trước đây dùng Tailwind red-500/red-600 hardcode cho CẢ
 *              2 trạng thái (focus bình thường VÀ có lỗi) — không phân biệt
 *              được "đang gõ bình thường" với "đang báo lỗi", đồng thời
 *              không khớp brand color hiện tại (đã đổi sang xanh #0078D7).
 *              Nay: focus bình thường → --color-brand-primary (xanh); có
 *              lỗi → --color-semantic-error (đỏ, đúng ngữ nghĩa "error").
 * @owner AG-04
 */

import React from 'react';

interface FormInputProps {
    label: string;
    type?: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    autoComplete?: string;
}

/**
 * FormInput: Styled input field with label
 */
export function FormInput({
    label,
    type = 'text',
    name,
    value,
    onChange,
    placeholder,
    error,
    disabled = false,
    required = false,
    autoComplete,
}: FormInputProps): React.ReactElement {
    const [isFocused, setIsFocused] = React.useState(false);

    const borderColor = error
        ? 'var(--color-semantic-error)'
        : isFocused
            ? 'var(--color-brand-primary)'
            : 'var(--color-border-light)';

    const ringColor = error
        ? 'rgba(239, 68, 68, 0.1)'  // --color-semantic-error (#ef4444) ở alpha 0.1
        : 'rgba(0, 120, 215, 0.1)'; // --color-brand-primary (#0078D7) ở alpha 0.1

    return (
        <div className="flex flex-col" style={{ gap: 'var(--spacing-sm)' }}>
            <label
                htmlFor={name}
                style={{
                    display: 'block',
                    fontSize: 'var(--text-ui-label-size)',
                    fontWeight: 'var(--text-ui-label-weight)',
                    color: 'var(--color-text-primary)',
                }}
            >
                {label}
                {required && (
                    <span style={{ color: 'var(--color-semantic-error)', marginLeft: 'var(--spacing-xs)' }}>
                        *
                    </span>
                )}
            </label>

            <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                className="w-full"
                style={{
                    padding: 'var(--spacing-md) var(--spacing-base)',
                    fontSize: 'var(--text-body-base-size)',
                    fontWeight: 'var(--font-weight-normal)',
                    borderRadius: 'var(--radius-base)',
                    border: `1px solid ${borderColor}`,
                    outline: 'none',
                    boxShadow: isFocused || error ? `0 0 0 3px ${ringColor}` : 'none',
                    color: 'var(--color-text-primary)',
                    backgroundColor: disabled ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                    cursor: disabled ? 'not-allowed' : 'text',
                    transition: `border-color var(--duration-normal) var(--easing-in-out), box-shadow var(--duration-normal) var(--easing-in-out)`,
                }}
            />

            {error && (
                <p
                    style={{
                        fontSize: 'var(--text-body-sm-size)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-semantic-error)',
                    }}
                >
                    {error}
                </p>
            )}
        </div>
    );
}