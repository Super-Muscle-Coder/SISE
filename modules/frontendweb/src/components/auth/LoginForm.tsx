/**
 * @file LoginForm.tsx
 * @layer components (Layer 2)
 * @description Form đăng nhập — quản lý TRỌN VẸN 1 chức năng rõ ràng
 *              (khác AuthForm/FormInput/SubmitButton cũ — 3 mảnh rời không
 *              tự thân có ý nghĩa, đã bị thay thế hoàn toàn bởi
 *              LoginForm/SignupForm). Gọi trực tiếp useLogin() +
 *              validateAuthForm() từ auth_services.ts — KHÔNG tự viết lại
 *              logic validate/gọi API.
 *              KHÔNG tự navigate() sau khi thành công — scaffold_routers.ts
 *              (SessionNavigationHandler) đã tự động điều hướng khi nghe
 *              sự kiện sessionStarted do useLogin() dispatch.
 * @owner AG-04
 */

import React from 'react';
import { useLogin, validateAuthForm } from '@/services/auth_services';
import { FormSubmitButton } from '@/components/auth/FormSubmitButton';

export function LoginForm(): React.ReactElement {
    const { isLoading, error, login } = useLogin();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateAuthForm('login', { username, password });
        setFieldErrors(validation.errors);
        if (!validation.isValid) return;

        await login({ username, password });
        // Không tự navigate — SessionNavigationHandler lo việc điều hướng
        // khi nghe sự kiện sessionStarted (dispatch bên trong useLogin()).
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
                Log In
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <label
                    htmlFor="login-username"
                    style={{
                        fontSize: 'var(--text-ui-label-size)',
                        fontWeight: 'var(--text-ui-label-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Username
                </label>
                <input
                    id="login-username"
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
                    htmlFor="login-password"
                    style={{
                        fontSize: 'var(--text-ui-label-size)',
                        fontWeight: 'var(--text-ui-label-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Password
                </label>
                <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
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

            <FormSubmitButton isLoading={isLoading} loadingText="Logging in...">
                Log In
            </FormSubmitButton>
        </form>
    );
}