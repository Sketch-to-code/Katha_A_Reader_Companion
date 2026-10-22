import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function darkenHex(hex, percent = 25) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '#161924';
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  if (Number.isNaN(num)) return '#161924';
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - percent / 100)));
  const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - percent / 100)));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function BookCard({ book, onDelete, isDeleting }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const progress = book.pageCount ? Math.round((book.lastPageRead / book.pageCount) * 100) : 0;
  const baseColor = book.coverColor || '#2f3b52';
  const gradientEnd = darkenHex(baseColor, 35);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 154,
      }}
    >
      {/* Book Cover Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/read/${book._id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/read/${book._id}`);
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: 154,
          height: 216,
          borderRadius: '3px 6px 6px 3px',
          background: `linear-gradient(145deg, ${baseColor} 0%, ${gradientEnd} 100%)`,
          boxShadow: isHovered
            ? '0 12px 28px rgba(0, 0, 0, 0.45), inset -4px 0 8px rgba(0, 0, 0, 0.35)'
            : 'var(--shadow), 0 6px 16px rgba(0, 0, 0, 0.25), inset -4px 0 8px rgba(0, 0, 0, 0.3)',
          transform: isHovered ? 'translateY(-4px)' : 'none',
          transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          outline: 'none',
        }}
      >
        {/* Book spine lighting / fold effect */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 14,
            background:
              'linear-gradient(to right, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.12) 35%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)',
            borderRight: '1px solid rgba(0, 0, 0, 0.25)',
            pointerEvents: 'none',
          }}
        />

        {/* Embossed inner border frame */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 8,
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Elegant top ribbon bookmark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            right: 24,
            width: 14,
            height: 32,
            background: 'var(--accent, #c15a52)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.35)',
            pointerEvents: 'none',
          }}
        />

        {/* Premium Book Emblem Icon */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            userSelect: 'none',
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 64 64"
            fill="none"
            style={{
              filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4))',
              transition: 'transform 0.2s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {/* Left page cover */}
            <path
              d="M8 14C8 10.6863 10.6863 8 14 8H30C31.1046 8 32 8.89543 32 10V52C32 50.8 30.5 49.5 28 49.5H14C10.6863 49.5 8 51 8 53V14Z"
              fill="rgba(255, 255, 255, 0.08)"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="2"
            />
            {/* Right page cover */}
            <path
              d="M56 14C56 10.6863 53.3137 8 50 8H34C32.8954 8 32 8.89543 32 10V52C32 50.8 33.5 49.5 36 49.5H50C53.3137 49.5 56 51 56 53V14Z"
              fill="rgba(255, 255, 255, 0.08)"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="2"
            />
            {/* Left page lines */}
            <line x1="13" y1="17" x2="27" y2="17" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="24" x2="27" y2="24" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="31" x2="25" y2="31" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="38" x2="22" y2="38" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="2" strokeLinecap="round" />
            {/* Right page lines */}
            <line x1="51" y1="17" x2="37" y2="17" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="51" y1="24" x2="37" y2="24" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="51" y1="31" x2="39" y2="31" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="2" strokeLinecap="round" />
            <line x1="51" y1="38" x2="42" y2="38" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="2" strokeLinecap="round" />
            {/* Center ribbon bookmark detail */}
            <path
              d="M32 9V36L35 32L38 36V9H32Z"
              fill="var(--gold, #c9a227)"
              opacity="0.95"
            />
          </svg>
        </div>

        {/* Circular Progress Ring */}
        {progress > 0 && (
          <div
            title={`Reading progress: ${progress}%`}
            style={{
              position: 'absolute',
              top: 8,
              left: 18,
              background: 'rgba(0, 0, 0, 0.45)',
              borderRadius: '50%',
              padding: 2,
              backdropFilter: 'blur(2px)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 30 30">
              <circle cx="15" cy="15" r="11" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" />
              <circle
                cx="15"
                cy="15"
                r="11"
                fill="none"
                stroke="var(--gold, #c9a227)"
                strokeWidth="3"
                strokeDasharray={`${(progress / 100) * 69.1} 69.1`}
                strokeLinecap="round"
                transform="rotate(-90 15 15)"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Book details & Red Trash Icon under the book card */}
      <div
        style={{
          marginTop: 10,
          width: 154,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Book Title with hover tooltip displaying complete name */}
          <h3
            title={book.title}
            onClick={() => navigate(`/read/${book._id}`)}
            style={{
              margin: 0,
              fontSize: 13.5,
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              lineHeight: 1.3,
            }}
          >
            {book.title}
          </h3>
          <p
            title={book.author}
            style={{
              margin: '3px 0 0',
              fontSize: 12,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {book.author && book.author !== 'Unknown author'
              ? book.author
              : book.pageCount
              ? `${book.pageCount} pages`
              : 'PDF'}
          </p>
        </div>

        {/* Red Trash Icon for Book Removal */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(book);
            }}
            disabled={isDeleting}
            title={`Remove "${book.title}" from library`}
            aria-label={`Remove "${book.title}"`}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 5px',
              cursor: isDeleting ? 'wait' : 'pointer',
              color: '#ef4444',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s ease, transform 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.14)';
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isDeleting ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
