import { useNavigate } from 'react-router-dom';

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const progress = book.pageCount ? Math.round((book.lastPageRead / book.pageCount) * 100) : 0;

  return (
    <button
      onClick={() => navigate(`/read/${book._id}`)}
      style={{
        textAlign: 'left',
        background: 'none',
        border: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: 150,
      }}
    >
      <div
        style={{
          width: 150,
          height: 210,
          borderRadius: 3,
          background: book.coverColor,
          boxShadow: 'var(--shadow), inset -6px 0 10px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'flex-end',
          padding: 14,
          position: 'relative',
        }}
      >
        <span
          className="font-display"
          style={{ color: '#f4f2ec', fontSize: 15, lineHeight: 1.25, fontWeight: 500 }}
        >
          {book.title}
        </span>
        {progress > 0 && (
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            style={{ position: 'absolute', top: 10, right: 10 }}
          >
            <circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
            <circle
              cx="15"
              cy="15"
              r="12"
              fill="none"
              stroke="#f4f2ec"
              strokeWidth="3"
              strokeDasharray={`${(progress / 100) * 75.4} 75.4`}
              strokeLinecap="round"
              transform="rotate(-90 15 15)"
            />
          </svg>
        )}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500 }}>{book.title}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{book.author}</p>
      </div>
    </button>
  );
}
