import { MOCK_PAGE_TEXT } from '../../mock/library';

// Strategy: continuous-scroll fallback, kept for users who prefer it or
// for accessibility, per the design document's fallback rationale.
export default function ScrollRenderer({ zoom, onSelectText }) {
  return (
    <div
      onMouseUp={() => {
        const sel = window.getSelection()?.toString();
        if (sel) onSelectText?.(sel);
      }}
      style={{
        maxWidth: 560,
        margin: '0 auto',
        background: 'var(--bg-elevated)',
        borderRadius: 6,
        padding: '48px 56px',
        boxShadow: 'var(--shadow)',
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: `${15.5 * zoom}px`,
        lineHeight: 1.85,
      }}
    >
      <p>{MOCK_PAGE_TEXT.left}</p>
      <p>{MOCK_PAGE_TEXT.right}</p>
      <p>{MOCK_PAGE_TEXT.left}</p>
    </div>
  );
}
