/**
 * @file FormInput.tsx
 * @layer components (Layer 3)
 * @description Reusable form input component with label and validation
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
 * 
 * Features:
 * - Label
 * - Input with focus states
 * - Error message display
 * - Loading/disabled state
 * - Auto-complete support
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
    return (
        <div className="space-y-2">
            <label
                htmlFor={name}
                className="block text-sm font-medium text-zinc-900"
            >
                {label}
                {required && <span className="text-red-600 ml-1">*</span>}
            </label>

            <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                className={`
                    w-full px-4 py-3 border rounded-md text-base font-normal
                    placeholder-zinc-500
                    focus:outline-none focus:ring-1 transition-smooth
                    disabled:bg-zinc-100 disabled:cursor-not-allowed
                    ${error
                        ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
                        : 'border-zinc-200 focus:border-red-600 focus:ring-red-600'
                    }
                `}
            />

            {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
            )}
        </div>
    );
}