import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const THEMES = [
  { key: 'dark', label: 'Dark', bg: '#14161f', fg: '#ede6d6' },
  { key: 'sepia', label: 'Sepia', bg: '#e7ddc3', fg: '#3b2f22' },
  { key: 'light', label: 'Light', bg: '#f4f2ec', fg: '#211d17' },
];

export default function SettingsPanel() {
  const { theme, setTheme, readingMode, setReadingMode } = useTheme();
  const { user, updateProfile, changePassword, logout } = useAuth();
  const toast = useToast();

  // Profile Form State
  const [username, setUsername] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const clean = username.trim();
    if (!clean) {
      setProfileError('Username cannot be empty.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileStatus('');
    try {
      await updateProfile({ name: clean });
      setProfileStatus('Profile updated successfully.');
      toast.success('Username updated.');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not update username.';
      setProfileError(msg);
      toast.error(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordStatus('');
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordStatus('Password changed successfully.');
      toast.success('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not change password.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, paddingBottom: 40 }}>
      <h2 className="font-display" style={{ fontSize: 26, marginBottom: 28 }}>
        Account & Settings
      </h2>

      {/* Account Profile Section */}
      <section
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Profile Information
        </h3>

        <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: 14, maxWidth: 440 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setProfileError('');
                setProfileStatus('');
              }}
              placeholder="Your name"
              maxLength={100}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
            Email
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                ...inputStyle,
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                cursor: 'not-allowed',
                opacity: 0.8,
              }}
            />
          </label>

          {profileError && (
            <div role="alert" style={{ color: '#ef4444', fontSize: 12.5 }}>
              {profileError}
            </div>
          )}
          {profileStatus && (
            <div role="status" style={{ color: '#43b581', fontSize: 12.5 }}>
              ✓ {profileStatus}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={profileSaving || !username.trim() || username.trim() === user?.name}
              style={{
                ...buttonStyle,
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                opacity: profileSaving || !username.trim() || username.trim() === user?.name ? 0.6 : 1,
              }}
            >
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Change Password Section */}
      <section
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Security & Password
        </h3>

        <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: 14, maxWidth: 440 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
            Current Password
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordError('');
                setPasswordStatus('');
              }}
              placeholder="Enter your current password"
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
            New Password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError('');
                setPasswordStatus('');
              }}
              placeholder="At least 8 characters"
              minLength={8}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--text)' }}>
            Confirm New Password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
                setPasswordStatus('');
              }}
              placeholder="Re-enter new password"
              minLength={8}
              required
              style={inputStyle}
            />
          </label>

          {passwordError && (
            <div role="alert" style={{ color: '#ef4444', fontSize: 12.5 }}>
              {passwordError}
            </div>
          )}
          {passwordStatus && (
            <div role="status" style={{ color: '#43b581', fontSize: 12.5 }}>
              ✓ {passwordStatus}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
              style={{
                ...buttonStyle,
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                opacity: passwordSaving || !currentPassword || !newPassword || !confirmPassword ? 0.6 : 1,
              }}
            >
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Theme Appearance Section */}
      <section
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Appearance
        </h3>
        <div style={{ display: 'flex', gap: 14 }}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTheme(t.key);
                toast.info(`Theme set to ${t.label}.`);
              }}
              style={{
                width: 96,
                border: theme === t.key ? '2px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 0,
                overflow: 'hidden',
                background: 'var(--bg-shelf)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ height: 50, background: t.bg }} />
              <p style={{ fontSize: 12.5, padding: '8px 0', margin: 0, color: t.key === theme ? 'var(--gold)' : 'var(--text)' }}>
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Reading Mode Section */}
      <section
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
          Default Reading Mode
        </h3>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)', width: 220, overflow: 'hidden' }}>
          {['leisure', 'academic'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setReadingMode(mode);
                toast.info(`Reading mode set to ${mode}.`);
              }}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 13,
                border: 'none',
                textTransform: 'capitalize',
                background: readingMode === mode ? 'var(--accent)' : 'transparent',
                color: readingMode === mode ? 'var(--accent-text)' : 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {/* Sign Out Section */}
      <section style={{ padding: '8px 4px' }}>
        <button
          type="button"
          onClick={logout}
          style={{
            ...buttonStyle,
            border: '1px solid #ef4444',
            color: '#ef4444',
            background: 'transparent',
          }}
        >
          Sign out of Katha
        </button>
      </section>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg)',
  color: 'var(--text)',
  padding: '9px 12px',
  fontSize: 13.5,
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

const buttonStyle = {
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '9px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
