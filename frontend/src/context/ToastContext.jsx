import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});

  const removeToast = useCallback((id) => {
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, message, type };

    setToasts((current) => [...current, newToast]);

    timerRefs.current[id] = setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, [removeToast]);

  const toast = {
    show: (msg, type = 'info') => addToast(msg, type),
    success: (msg) => addToast(msg, 'success'),
    info: (msg) => addToast(msg, 'info'),
    error: (msg) => addToast(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Floating Toast Notification Container */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 9999,
          pointerEvents: 'none',
          maxWidth: 'min(420px, calc(100vw - 32px))',
        }}
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className="katha-toast-item"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-elevated)',
              border: item.type === 'error'
                ? '1px solid #ef4444'
                : item.type === 'success'
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.28)',
              color: 'var(--text)',
              fontSize: 13.5,
              animation: 'kathaToastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 'bold',
                background: item.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : item.type === 'success'
                    ? 'rgba(67, 181, 129, 0.18)'
                    : 'rgba(212, 180, 89, 0.18)',
                color: item.type === 'error'
                  ? '#ef4444'
                  : item.type === 'success'
                    ? '#43b581'
                    : 'var(--accent)',
              }}
            >
              {item.type === 'error' ? '!' : item.type === 'success' ? '✓' : 'ℹ'}
            </div>
            <div style={{ flex: 1, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {item.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              aria-label="Close notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 16,
                padding: '2px 4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

