import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginView() {
  const { requestLogin, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    setError('');
    setStatus('');
    try {
      if (!codeSent) {
        await requestLogin({ name: name.trim(), email: email.trim(), password });
        setCodeSent(true);
        setStatus('Your six-digit sign-in code is on its way to your inbox.');
      } else {
        await login({ email: email.trim(), code: code.trim() });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start your reading session.');
    } finally {
      setPending(false);
    }
  };

  const resendCode = async () => {
    setPending(true);
    setError('');
    setStatus('');
    try {
      await requestLogin({ name: name.trim(), email: email.trim(), password });
      setStatus('A fresh sign-in code has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send a new sign-in code.');
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
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: 'min(420px, 100%)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: '0 18px 48px rgba(59, 47, 34, 0.16)',
          padding: 28,
        }}
      >
        <h1 className="font-display" style={{ fontSize: 30, marginBottom: 8 }}>
          Welcome to Katha
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
          {codeSent
            ? `Enter the six-digit sign-in code sent to ${email}.`
            : 'Create an account or sign in with your email to open your library, notes, bookmarks, and study assistant.'}
        </p>

        {!codeSent && (
          <>
            <label style={labelStyle}>
              Name
              <input
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Email
              <input
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Password
              <input
                autoComplete="new-password"
                type="password"
                required
                minLength={8}
                maxLength={200}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
              />
            </label>
          </>
        )}

        {codeSent && (
          <label style={labelStyle}>
            Sign-in code
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...inputStyle, letterSpacing: 5, fontSize: 20 }}
            />
          </label>
        )}

        {status && <p role="status" style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 14px' }}>{status}</p>}
        {error && <p role="alert" style={{ color: '#9e3d37', fontSize: 13, margin: '0 0 14px' }}>{error}</p>}

        <button
          disabled={pending || (!codeSent && (!name.trim() || !email.trim() || password.length < 8)) || (codeSent && code.length !== 6)}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: 8,
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '11px 14px',
            fontSize: 14,
            fontWeight: 600,
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'One moment...' : codeSent ? 'Verify and enter library' : 'Send sign-in code'}
        </button>

        {codeSent && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button type="button" onClick={resendCode} disabled={pending} style={textButton}>
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { setCodeSent(false); setCode(''); setPassword(''); setStatus(''); setError(''); }}
              style={textButton}
            >
              Change email
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
  borderRadius: 8,
  background: 'var(--bg)',
  color: 'var(--text)',
  padding: '10px 12px',
  fontSize: 14,
};

const textButton = {
  border: 'none',
  background: 'none',
  color: 'var(--text-muted)',
  padding: 4,
  fontSize: 12,
  cursor: 'pointer',
};
