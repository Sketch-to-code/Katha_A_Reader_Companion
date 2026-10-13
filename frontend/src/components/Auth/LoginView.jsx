import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginView() {
  const { loginWithPassword, registerUser } = useAuth();

  // Mode: 'signin' | 'create' | 'forgot'
  const [mode, setMode] = useState('signin');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  // Incorrect credentials state for indication & popup
  const [isCredentialError, setIsCredentialError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTitle, setToastTitle] = useState('');

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [showToast]);

  const triggerToast = (title, message) => {
    setToastTitle(title);
    setToastMessage(message);
    setShowToast(true);
  };

  const clearErrors = () => {
    setError('');
    setIsCredentialError(false);
    setShowToast(false);
    setStatus('');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    clearErrors();
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    if (isCredentialError || error) {
      clearErrors();
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    clearErrors();

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      if (mode === 'create') {
        // Streamlined Supabase user registration (single step)
        await registerUser({ name: cleanName, email: cleanEmail, password });
      } else if (mode === 'forgot') {
        setStatus('To reset your password, please sign in with your email and password, then update it under Settings.');
      } else {
        // Standard Sign In with Supabase credentials (Email & Password)
        await loginWithPassword({ email: cleanEmail, password });
      }
    } catch (err) {
      const statusRes = err.response?.status;
      const serverMessage = err.response?.data?.error || '';

      if (mode === 'signin' && (statusRes === 401 || serverMessage.toLowerCase().includes('invalid email or password'))) {
        setIsCredentialError(true);
        const msg = 'The credentials you entered are incorrect. Please verify your email and password.';
        setError(msg);
        triggerToast('Incorrect Credentials', msg);
      } else if (mode === 'create' && statusRes === 409) {
        const msg = 'An account with that email already exists. Please sign in instead.';
        setError(msg);
        triggerToast('Account Already Exists', msg);
      } else {
        const msg = serverMessage || 'Could not complete your request. Please try again.';
        setError(msg);
        triggerToast('Authentication Error', msg);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(circle at top, var(--bg-elevated), var(--bg))',
        position: 'relative',
      }}
    >
      {/* Floating Popup / Toast Notification for incorrect credentials & errors */}
      {showToast && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(440px, calc(100vw - 32px))',
            background: 'var(--bg-elevated)',
            border: isCredentialError ? '2px solid #dc2626' : '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            boxShadow: isCredentialError
              ? '0 12px 36px rgba(220, 38, 38, 0.25), 0 4px 14px rgba(0, 0, 0, 0.12)'
              : '0 12px 32px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: isCredentialError ? '#fee2e2' : 'var(--accent-soft)',
              color: isCredentialError ? '#dc2626' : 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: 15,
            }}
          >
            !
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: isCredentialError ? '#dc2626' : 'var(--text)',
                marginBottom: 2,
              }}
            >
              {toastTitle}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {toastMessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label="Dismiss alert"
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>
      )}

      <form
        onSubmit={submit}
        style={{
          width: 'min(420px, 100%)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 18px 48px rgba(59, 47, 34, 0.16)',
          padding: 28,
        }}
      >
        <h1 className="font-display" style={{ fontSize: 30, marginBottom: 8 }}>
          Welcome to Katha
        </h1>

        {/* Tab switch between Sign In and Create New User */}
        {mode !== 'forgot' && (
          <div
            style={{
              display: 'flex',
              background: 'var(--bg)',
              padding: 3,
              borderRadius: 'var(--radius-md)',
              margin: '16px 0 20px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: mode === 'signin' ? 600 : 400,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: mode === 'signin' ? 'var(--bg-elevated)' : 'transparent',
                color: mode === 'signin' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: mode === 'signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('create')}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: mode === 'create' ? 600 : 400,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: mode === 'create' ? 'var(--bg-elevated)' : 'transparent',
                color: mode === 'create' ? 'var(--text)' : 'var(--text-muted)',
                boxShadow: mode === 'create' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Create New User
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 20px' }}>
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Description */}
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
          {mode === 'forgot'
            ? 'Enter your registered email address to check your account or update your password in Settings.'
            : mode === 'create'
            ? 'Enter your name, email address, and a password of at least eight characters to create your account.'
            : 'Enter your email address and password to sign in to your Katha library.'}
        </p>

        {/* Visual Callout for Incorrect Credentials or other errors */}
        {isCredentialError && (
          <div
            role="alert"
            style={{
              background: '#fee2e2',
              border: '1.5px solid #dc2626',
              borderRadius: 8,
              padding: '12px 14px',
              color: '#991b1b',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>
              <strong>Incorrect credentials:</strong> The email or password entered does not match an existing account.
            </span>
          </div>
        )}

        {error && !isCredentialError && (
          <div
            role="alert"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '10px 14px',
              color: 'var(--text)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
            {mode === 'create' && error.includes('already exists') && (
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                style={{
                  marginTop: 8,
                  background: 'var(--accent)',
                  color: 'var(--accent-text)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'block',
                }}
              >
                Switch to Sign In
              </button>
            )}
          </div>
        )}

        {status && (
          <p role="status" style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
            {status}
          </p>
        )}

        {/* Create New User Fields (per USER_GUIDE.md) */}
        {mode === 'create' && (
          <>
            <label style={labelStyle}>
              Name
              <input
                autoComplete="name"
                required
                maxLength={100}
                placeholder="Your full name"
                value={name}
                onChange={handleInputChange(setName)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Email
              <input
                autoComplete="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={handleInputChange(setEmail)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Password
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={200}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  style={{
                    ...inputStyle,
                    paddingRight: 40,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Must be at least 8 characters.
              </span>
            </label>
          </>
        )}

        {/* Sign In Fields */}
        {mode === 'signin' && (
          <>
            <label style={labelStyle}>
              Email
              <input
                autoComplete="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={handleInputChange(setEmail)}
                style={{
                  ...inputStyle,
                  borderColor: isCredentialError ? '#dc2626' : 'var(--border)',
                  background: isCredentialError ? '#fff5f5' : 'var(--bg)',
                }}
              />
            </label>

            <label style={labelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => handleModeChange('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Your password"
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  style={{
                    ...inputStyle,
                    paddingRight: 40,
                    borderColor: isCredentialError ? '#dc2626' : 'var(--border)',
                    background: isCredentialError ? '#fff5f5' : 'var(--bg)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
          </>
        )}

        {/* Forgot Password Fields */}
        {mode === 'forgot' && (
          <label style={labelStyle}>
            Registered Email
            <input
              autoComplete="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={handleInputChange(setEmail)}
              style={inputStyle}
            />
          </label>
        )}

        {/* Main Submit Button */}
        <button
          disabled={
            pending ||
            (mode === 'create' && (!name.trim() || !email.trim() || password.length < 8)) ||
            (mode === 'signin' && (!email.trim() || !password)) ||
            (mode === 'forgot' && !email.trim())
          }
          style={{
            width: '100%',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '11px 14px',
            fontSize: 14,
            fontWeight: 600,
            opacity: pending ? 0.7 : 1,
            marginTop: 6,
            transition: 'opacity 0.2s ease',
          }}
        >
          {pending
            ? 'One moment...'
            : mode === 'create'
            ? 'Create Account'
            : mode === 'forgot'
            ? 'Check Account'
            : 'Sign In'}
        </button>

        {/* Forgot Password sub-link to return to sign in */}
        {mode === 'forgot' && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              style={{
                ...textButton,
                color: 'var(--accent)',
                fontWeight: 600,
                padding: 0,
                fontSize: 13,
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Additional options and switch links */}
        {mode === 'signin' && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('create')}
                style={{
                  ...textButton,
                  color: 'var(--accent)',
                  fontWeight: 600,
                  padding: 0,
                  fontSize: 13,
                }}
              >
                Create a new user
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => handleModeChange('signin')}
              style={{
                ...textButton,
                color: 'var(--accent)',
                fontWeight: 600,
                padding: 0,
                fontSize: 13,
              }}
            >
              Sign In
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'grid',
  gap: 6,
  color: 'var(--text)',
  fontSize: 13,
  marginBottom: 14,
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg)',
  color: 'var(--text)',
  padding: '10px 12px',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
};

const textButton = {
  border: 'none',
  background: 'none',
  color: 'var(--text-muted)',
  padding: 4,
  fontSize: 12,
  cursor: 'pointer',
};
