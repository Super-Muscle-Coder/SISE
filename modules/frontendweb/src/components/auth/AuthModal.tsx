/**
 * @file AuthModal.tsx
 * @layer components (Layer 2)
 * @description Modal nổi chứa LoginForm/SignupForm — hiển thị đè lên
 *              LandingPage khi URL là /login hoặc /register (đọc bởi
 *              LandingPage.tsx qua useLocation(), truyền mode xuống đây).
 *              Component thuần: nhận mode + onClose + onSwitchMode qua
 *              props, KHÔNG tự đọc URL/tự điều hướng — đúng ranh giới
 *              Nhóm B (giao diện thuần túy).
 * @owner AG-04
 */

import React from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export type AuthModalMode = 'login' | 'register';

interface AuthModalProps {
    mode: AuthModalMode;
    onClose: () => void;
    onSwitchMode: (mode: AuthModalMode) => void;
}

export function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps): React.ReactElement {
    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'var(--color-overlay-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-lg)',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--spacing-xl)',
                    position: 'relative',
                }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-base)',
                        right: 'var(--spacing-base)',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-heading-h4-size)',
                        cursor: 'pointer',
                        lineHeight: 1,
                        padding: 'var(--spacing-xs)',
                    }}
                >
                    ×
                </button>

                {mode === 'login' ? <LoginForm /> : <SignupForm />}

                <p
                    style={{
                        marginTop: 'var(--spacing-lg)',
                        textAlign: 'center',
                        fontSize: 'var(--text-body-sm-size)',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    {mode === 'login' ? (
                        <>
                            Chưa có tài khoản?{' '}
                            <button
                                type="button"
                                onClick={() => onSwitchMode('register')}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--color-brand-primary)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Đăng ký
                            </button>
                        </>
                    ) : (
                        <>
                            Đã có tài khoản?{' '}
                            <button
                                type="button"
                                onClick={() => onSwitchMode('login')}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    color: 'var(--color-brand-primary)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    cursor: 'pointer',
                                    padding: 0,
                                }}
                            >
                                Đăng nhập
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}