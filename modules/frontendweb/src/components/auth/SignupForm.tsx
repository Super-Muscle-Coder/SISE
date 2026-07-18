/**
 * @file SignupForm.tsx
 * @layer components (Layer 2)
 * @description Form đăng ký. Gọi useRegister() (đã auto-login sẵn bên
 *              trong, xem auth_services.ts Nhóm 1) + validateAuthForm().
 *              SAU KHI đăng ký thành công: tự động gọi
 *              mediaAdapter.createAlbum('Default') 1 lần — tạo album mặc
 *              định cho user mới, KHÔNG đụng Backend (đã CLOSED), hoàn
 *              toàn xử lý ở tầng UI theo đúng quyết định Project Owner.
 *              KHÔNG tự navigate() — SessionNavigationHandler
 *              (scaffold_routers.ts) tự động điều hướng khi nghe sự kiện
 *              sessionStarted do useRegister() dispatch (bên trong bước
 *              auto-login).
 * @owner AG-04
 */

import React from 'react';
import { useRegister, validateAuthForm } from '@/services/auth_services';
import { mediaAdapter } from '@/adapters/media_adapters';
import { FormSubmitButton } from '@/components/auth/FormSubmitButton';

export function SignupForm(): React.ReactElement {
    const { isLoading, error, register } = useRegister();
    const [username, setUsername] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateAuthForm('register', { username, email, password });
        setFieldErrors(validation.errors);
        if (!validation.isValid) return;

        const result = await register({ username, email, password });

        // Tạo album mặc định — CHỈ khi register (kèm auto-login) thành
        // công thật sự. Không throw nếu createAlbum lỗi (không chặn luồng
        // đăng ký chỉ vì bước phụ này thất bại) — chỉ log cảnh báo.
        if (result.success) {
            try {
                await mediaAdapter.createAlbum('Default');
            } catch (albumError) {
                console.warn('Failed to create default album:', albumError);
            }
        }
        // Không tự navigate — SessionNavigationHandler lo việc điều hướng.
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-base)',
            }}
        >
            <h2
                style={{
                    fontSize: 'var(--text-heading-h2-size)',
                    fontWeight: 'var(--text-heading-h2-weight)',
                    lineHeight: 'var(--text-heading-h2-line)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-lg)',
                }}
            >
                Sign Up
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label
                    htmlFor="signup-username"
                    style={{
                        fontSize: 'var(--text-ui-label-size)',
                        fontWeight: 'var(--text-ui-label-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Username
                </label>
                <input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 'var(--spacing-md) var(--spacing-base)',
                        fontSize: 'var(--text-body-base-size)',
                        borderRadius: 'var(--radius-base)',
                        border: `1px solid ${fieldErrors.username ? 'var(--color-semantic-error)' : 'var(--color-border-light)'}`,
                        outline: 'none',
                        color: 'var(--color-text-primary)',
                        backgroundColor: isLoading ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                    }}
                />
                {fieldErrors.username && (
                    <p style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--color-semantic-error)', margin: 0 }}>
                        {fieldErrors.username}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label
                    htmlFor="signup-email"
                    style={{
                        fontSize: 'var(--text-ui-label-size)',
                        fontWeight: 'var(--text-ui-label-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Email
                </label>
                <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 'var(--spacing-md) var(--spacing-base)',
                        fontSize: 'var(--text-body-base-size)',
                        borderRadius: 'var(--radius-base)',
                        border: `1px solid ${fieldErrors.email ? 'var(--color-semantic-error)' : 'var(--color-border-light)'}`,
                        outline: 'none',
                        color: 'var(--color-text-primary)',
                        backgroundColor: isLoading ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                    }}
                />
                {fieldErrors.email && (
                    <p style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--color-semantic-error)', margin: 0 }}>
                        {fieldErrors.email}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label
                    htmlFor="signup-password"
                    style={{
                        fontSize: 'var(--text-ui-label-size)',
                        fontWeight: 'var(--text-ui-label-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Password
                </label>
                <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="new-password"
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 'var(--spacing-md) var(--spacing-base)',
                        fontSize: 'var(--text-body-base-size)',
                        borderRadius: 'var(--radius-base)',
                        border: `1px solid ${fieldErrors.password ? 'var(--color-semantic-error)' : 'var(--color-border-light)'}`,
                        outline: 'none',
                        color: 'var(--color-text-primary)',
                        backgroundColor: isLoading ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                    }}
                />
                {fieldErrors.password && (
                    <p style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--color-semantic-error)', margin: 0 }}>
                        {fieldErrors.password}
                    </p>
                )}
            </div>

            {error && (
                <p style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--color-semantic-error)', margin: 0 }}>
                    {error}
                </p>
            )}

            <FormSubmitButton isLoading={isLoading} loadingText="Signing up...">
                Sign Up
            </FormSubmitButton>
        </form>
    );
}