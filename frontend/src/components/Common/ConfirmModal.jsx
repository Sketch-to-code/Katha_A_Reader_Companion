import { useEffect, useRef } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm deletion',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus cancel button by default for safety against accidental enter
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0, 0, 0, 0.68)',
        backdropFilter: 'blur(5px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        animation: 'kathaFadeIn 0.18s ease-out',
      }}
    >
      <div
        style={{
          width: 'min(440px, 100%)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '24px 26px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45), 0 8px 16px rgba(0, 0, 0, 0.25)',
          animation: 'kathaScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Destructive Warning Badge */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: isDestructive ? 'rgba(239, 68, 68, 0.12)' : 'var(--accent-soft)',
              border: `1px solid ${isDestructive ? 'rgba(239, 68, 68, 0.28)' : 'var(--border)'}`,
              color: isDestructive ? '#ef4444' : 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="confirm-modal-title"
              className="font-display"
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--text)',
                margin: '0 0 8px',
              }}
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              style={{
                fontSize: 13.5,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 24,
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '9px 16px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              background: isDestructive ? '#dc2626' : 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.75 : 1,
              boxShadow: isDestructive
                ? '0 2px 10px rgba(220, 38, 38, 0.35)'
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
              transition: 'background 0.15s ease, opacity 0.15s ease',
            }}
          >
            {isLoading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

