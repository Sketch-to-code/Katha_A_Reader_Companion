import { MOCK_PAGE_TEXT } from '../../mock/library';

// Strategy: renders the "immersive book" experience - a two-page spread.
// Swapped out for ScrollRenderer at runtime by BookViewer, never via
// conditional branching inside either component.
export default function FlipbookRenderer({ zoom, onSelectText, page }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        background: '#00000010',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        transition: 'transform 0.15s ease',
      }}
    >
      {['left', 'right'].map((side) => (
        <div
          key={side}
          onMouseUp={() => {
            const sel = window.getSelection()?.toString();
            if (sel) onSelectText?.(sel);
          }}
          style={{
            width: 340,
            minHeight: 460,
            background: 'var(--bg-elevated)',
            padding: '40px 32px',
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 15.5,
            lineHeight: 1.8,
            color: 'var(--text)',
          }}
        >
          <p style={{ margin: 0 }}>{MOCK_PAGE_TEXT[side]}</p>
          <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
            {side === 'left' ? page : page + 1}
          </p>
        </div>
      ))}
    </div>
  );
}
