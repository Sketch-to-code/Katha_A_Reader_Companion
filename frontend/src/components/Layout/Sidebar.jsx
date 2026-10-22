import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BACKGROUND_MUSIC_OPTIONS, useBackgroundMusic } from '../../context/BackgroundMusicContext';

function LibraryIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}

function ReaderIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function BookmarkIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function NotesIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function SettingsIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Library', icon: '☰', Icon: LibraryIcon },
  { to: '/read/doc-1', label: 'Reader', icon: '▤', Icon: ReaderIcon },
  { to: '/bookmarks', label: 'Bookmarks', icon: '⌸', Icon: BookmarkIcon },
  { to: '/notes', label: 'Notes', icon: '✎', Icon: NotesIcon },
  { to: '/settings', label: 'Settings', icon: '⚙', Icon: SettingsIcon },
];

export default function Sidebar() {
  const [readerPath, setReaderPath] = useState('');
  const [manualCollapsed, setManualCollapsed] = useState(false);
  const [studyModeActive, setStudyModeActive] = useState(
    () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-study-mode') === 'true'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    music,
    setMusicTheme,
    volume,
    setMusicVolume,
    isPlaying,
    togglePlay,
    uploadCustomAudio,
    customAudioName,
    playbackError,
  } = useBackgroundMusic();

  // Watch for data-study-mode attribute changes on documentElement
  useEffect(() => {
    const checkStudy = () => {
      setStudyModeActive(document.documentElement.getAttribute('data-study-mode') === 'true');
    };
    checkStudy();
    const observer = new MutationObserver(checkStudy);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-study-mode'],
    });
    return () => observer.disconnect();
  }, []);

  // Determine if collapsed (either manually collapsed or auto-collapsed by study mode)
  const isCollapsed = manualCollapsed || studyModeActive;

  const handleExpand = () => {
    setManualCollapsed(false);
    setStudyModeActive(false);
    document.documentElement.removeAttribute('data-study-mode');
  };

  const handleToggle = () => {
    if (isCollapsed) {
      handleExpand();
    } else {
      setManualCollapsed(true);
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  useEffect(() => {
    apiClient.get('/documents')
      .then(({ data }) => {
        const book = data.documents?.find((document) => document.lastOpenedAt) || data.documents?.[0];
        if (book) setReaderPath(`/read/${book._id}`);
      })
      .catch(() => setReaderPath(''));
  }, []);

  const navItems = NAV_ITEMS.filter((item) => item.label !== 'Reader' || readerPath);

  // User initial
  const userInitial = (
    user?.name?.[0] ||
    user?.email?.[0] ||
    'U'
  ).toUpperCase();

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCustomAudio(file);
      e.target.value = '';
    }
  };

  return (
    <aside
      className={`katha-sidebar ${isCollapsed ? 'katha-sidebar-collapsed' : ''}`}
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        flexShrink: 0,
        width: isCollapsed ? 68 : 236,
        borderRight: '1px solid var(--border)',
        borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
        background: 'var(--bg-shelf)',
        display: 'flex',
        flexDirection: 'column',
        padding: isCollapsed ? '24px 8px' : '24px 16px',
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), padding 0.28s ease, box-shadow 0.28s ease',
        boxSizing: 'border-box',
        overflow: 'hidden',
        boxShadow: isCollapsed
          ? '2px 0 8px rgba(0, 0, 0, 0.12)'
          : '6px 0 24px rgba(0, 0, 0, 0.28), 1px 0 3px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Sidebar Header: Custom Katha Branding Icon + Toggle Arrow */}
      <div
        className="sidebar-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          marginBottom: 26,
          paddingLeft: isCollapsed ? 0 : 4,
          gap: 8,
        }}
      >
        {isCollapsed ? (
          // Collapsed: Clickable aesthetic Katha branding icon to expand
          <button
            type="button"
            onClick={handleExpand}
            title="Click to expand Katha sidebar"
            aria-label="Click to expand Katha sidebar"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(193, 90, 82, 0.22) 0%, rgba(201, 162, 39, 0.2) 100%)',
                border: '1px solid rgba(201, 162, 39, 0.45)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(193, 90, 82, 0.25)"/>
                <path d="M12 7l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3 1-2z" fill="var(--gold)"/>
              </svg>
            </div>
          </button>
        ) : (
          // Expanded view: Katha logo, brand text and collapse arrow
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, rgba(193, 90, 82, 0.22) 0%, rgba(201, 162, 39, 0.2) 100%)',
                  border: '1px solid rgba(201, 162, 39, 0.45)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="rgba(193, 90, 82, 0.25)"/>
                  <path d="M12 7l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3 1-2z" fill="var(--gold)"/>
                </svg>
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <h1 className="font-display sidebar-title" style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Katha
                </h1>
                <p className="sidebar-subtitle" style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', whiteSpace: 'nowrap' }}>
                  A reader's companion
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 11,
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
            >
              ◀
            </button>
          </>
        )}
      </div>

      {/* Main Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.label === 'Reader' ? readerPath : item.to}
            title={item.label}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 12,
              padding: isCollapsed ? '10px 0' : '10px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              textDecoration: 'none',
              color: isActive ? 'var(--accent-text)' : 'var(--text)',
              background: isActive ? 'var(--accent)' : 'transparent',
              transition: 'background 0.15s ease',
              whiteSpace: 'nowrap',
            })}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                flexShrink: 0,
              }}
            >
              {item.Icon ? <item.Icon size={18} /> : item.icon}
            </span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Background Audio Player Widget (Always accessible in sidebar) */}
      {isCollapsed ? (
        // Collapsed View: Aesthetic Music Icon with Play state pulse, clicking slides out full sidebar
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '16px 0' }}>
          <button
            type="button"
            onClick={handleExpand}
            title={`Soundscape: ${music} (${isPlaying ? 'Playing' : 'Paused'}) - Click to expand`}
            aria-label="Click to expand soundscape player"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              border: isPlaying ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: isPlaying ? 'rgba(193, 90, 82, 0.2)' : 'var(--bg-elevated)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              boxShadow: isPlaying ? '0 0 14px rgba(193, 90, 82, 0.4)' : 'var(--shadow)',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke={isPlaying ? 'var(--accent)' : 'var(--text)'} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" fill={isPlaying ? 'var(--accent)' : 'var(--bg)'} stroke={isPlaying ? 'var(--accent)' : 'var(--text)'} strokeWidth="1.5"/>
              {isPlaying && (
                <path d="M9 13v-2m3 3v-4m3 3v-2" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/>
              )}
            </svg>
            {isPlaying && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#43b581',
                  boxShadow: '0 0 6px #43b581',
                }}
              />
            )}
          </button>
        </div>
      ) : (
        // Expanded View: Full Audio Player
        <div
          className="katha-sidebar-audio"
          style={{
            margin: '18px 0',
            padding: '14px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow)',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                Soundscape
              </span>
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  border: 'none',
                  background: isPlaying ? 'var(--accent)' : 'var(--bg)',
                  color: isPlaying ? 'var(--accent-text)' : 'var(--text)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                {isPlaying ? '⏸ Pause' : '▶ Start'}
              </button>
            </div>

            {/* Track Selector */}
            <select
              value={music}
              onChange={(e) => setMusicTheme(e.target.value)}
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                fontSize: 11.5,
                font: 'inherit',
                cursor: 'pointer',
              }}
            >
              {BACKGROUND_MUSIC_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Custom Audio' && customAudioName ? `Custom: ${customAudioName.slice(0, 16)}...` : opt}
                </option>
              ))}
            </select>

            {/* Custom Audio File Upload */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,audio/*"
                onChange={handleAudioUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 8px',
                  fontSize: 10.5,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {customAudioName ? `📁 ${customAudioName.slice(0, 14)}...` : '+ Upload Audio'}
              </button>
            </div>

            {/* Volume Control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setMusicVolume(e.target.value)}
                aria-label="Soundscape volume"
                style={{ flex: 1, minWidth: 0, accentColor: 'var(--accent)', height: 4 }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
                {Math.round(volume * 100)}%
              </span>
            </div>

            {playbackError && (
              <span style={{ fontSize: 10, color: '#ef4444', lineHeight: 1.2 }}>
                {playbackError}
              </span>
            )}
          </div>
        </div>
      )}

      {/* User Profile Avatar & Dropdown Menu */}
      <div ref={menuRef} style={{ position: 'relative', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          title={user?.name || user?.email || 'User Account'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: 10,
            padding: isCollapsed ? 4 : '8px 10px',
            borderRadius: 'var(--radius-md)',
            background: menuOpen ? 'var(--bg-elevated)' : 'transparent',
            border: '1px solid transparent',
            borderColor: menuOpen ? 'var(--border)' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.15s ease',
          }}
        >
          {/* Circular Avatar with Initial */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c15a52 0%, #c9a227 100%)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 15,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {userInitial}
          </div>

          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.name || 'Reader'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {user?.email}
              </div>
            </div>
          )}
        </button>

        {/* Dropdown Popup Menu */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              width: 220,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              padding: '10px 8px',
              zIndex: 1000,
              animation: 'kathaToastIn 0.2s ease',
            }}
          >
            <div style={{ padding: '6px 8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {user?.name || 'Reader'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {user?.email}
              </div>
            </div>

            {/* Theme Selector */}
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Appearance
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'dark', label: 'Dark' },
                  { key: 'sepia', label: 'Sepia' },
                  { key: 'light', label: 'Light' },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTheme(t.key)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: 11,
                      borderRadius: 'var(--radius-sm)',
                      border: theme === t.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: theme === t.key ? 'var(--accent)' : 'var(--bg)',
                      color: theme === t.key ? 'var(--accent-text)' : 'var(--text)',
                      cursor: 'pointer',
                      fontWeight: theme === t.key ? 600 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

            {/* Settings Link */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate('/settings');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 12.5,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ⚙ Account & Settings
            </button>

            {/* Sign Out */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'transparent',
                color: '#ef4444',
                fontSize: 12.5,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
