import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { BACKGROUND_MUSIC_OPTIONS, useBackgroundMusic } from '../../context/BackgroundMusicContext';

const THEMES = [
  { key: 'light', label: 'Light', bg: '#f4f2ec', fg: '#211d17' },
  { key: 'sepia', label: 'Sepia', bg: '#e7ddc3', fg: '#3b2f22' },
  { key: 'dark', label: 'Dark', bg: '#14161f', fg: '#ede6d6' },
];

export default function SettingsPanel() {
  const { theme, setTheme, readingMode, setReadingMode } = useTheme();
  const { user, logout } = useAuth();
  const { music, setMusicTheme, volume, setMusicVolume, playbackError } = useBackgroundMusic();

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 24, marginBottom: 24 }}>
        Settings
      </h2>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Theme</h3>
        <div style={{ display: 'flex', gap: 14 }}>
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              style={{
                width: 96,
                border: theme === t.key ? '2px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: 10,
                padding: 0,
                overflow: 'hidden',
                background: 'var(--bg-elevated)',
              }}
            >
              <div style={{ height: 52, background: t.bg }} />
              <p style={{ fontSize: 12.5, padding: '8px 0', margin: 0, color: t.key === theme ? 'var(--gold)' : 'var(--text)' }}>
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Reading mode</h3>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, width: 220, overflow: 'hidden' }}>
          {['leisure', 'academic'].map((mode) => (
            <button
              key={mode}
              onClick={() => setReadingMode(mode)}
              style={{
                flex: 1,
                padding: '9px 0',
                fontSize: 13,
                border: 'none',
                textTransform: 'capitalize',
                background: readingMode === mode ? 'var(--accent)' : 'transparent',
                color: readingMode === mode ? 'var(--accent-text)' : 'var(--text)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32, maxWidth: 360 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Background Music</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <select
            id="katha-background-music"
            value={music}
            onChange={(event) => setMusicTheme(event.target.value)}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              borderRadius: 8,
              padding: '9px 10px',
              font: 'inherit',
              fontSize: 13,
            }}
          >
            {BACKGROUND_MUSIC_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {music === '40 Hz Binaural Beats' && (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Headphones are needed to hear the separate left and right tones.
            </span>
          )}
          <label style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
            <span>Volume</span>
            <span>{Math.round(volume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => setMusicVolume(event.target.value)}
              aria-label="Background music volume"
              style={{ gridColumn: '1 / -1', width: '100%', accentColor: 'var(--gold)' }}
            />
          </label>
          {playbackError && (
            <span role="alert" style={{ color: '#9e3d37', fontSize: 12 }}>{playbackError}</span>
          )}
        </div>
      </section>

      <section style={{ borderTop: '1px solid var(--border)', paddingTop: 20, maxWidth: 360 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Account</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px' }}>{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            padding: '8px 12px',
            fontSize: 13,
          }}
        >
          Sign out
        </button>
      </section>
    </div>
  );
}
