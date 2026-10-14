import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBookmarks } from '../../hooks/useBookmarks';

export default function BookmarksPanel() {
  const { bookmarks, loading, error, removeBookmark } = useBookmarks();
  const [books, setBooks] = useState([]);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    apiClient.get('/documents')
      .then(({ data }) => setBooks(data.documents || []))
      .catch((err) => setActionError(err.response?.data?.error || 'Could not load your books.'));
  }, []);

  const booksById = useMemo(() => new Map(books.map((book) => [book._id, book])), [books]);
  const deleteBookmark = async (id) => {
    setActionError('');
    try {
      await removeBookmark(id);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Could not remove this bookmark.');
    }
  };

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 24, marginBottom: 20 }}>Bookmarks</h2>
      {(error || actionError) && <p role="alert" style={{ color: '#9e3d37', fontSize: 13 }}>{actionError || error}</p>}
      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your bookmarks...</p>}
      {!loading && bookmarks.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          No bookmarks yet. Open a book and tap "Bookmark this page" while reading.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        {bookmarks.map((bookmark) => {
          const book = booksById.get(bookmark.documentId);
          return (
            <div
              key={bookmark._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
              }}
            >
              <div style={{ width: 32, height: 44, background: book?.coverColor || '#555', borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                {book ? (
                  <Link to={`/read/${book._id}?page=${bookmark.page}`} style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
                    {book.title}
                  </Link>
                ) : <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Book</p>}
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                  Page {bookmark.page} · {new Date(bookmark.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => deleteBookmark(bookmark._id)}
                aria-label="Remove bookmark"
                title="Remove bookmark"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer' }}
              >
                🗑
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
