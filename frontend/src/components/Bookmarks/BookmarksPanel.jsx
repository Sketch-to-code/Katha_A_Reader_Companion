import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBookmarks } from '../../hooks/useBookmarks';
import ConfirmModal from '../Common/ConfirmModal';

export default function BookmarksPanel() {
  const { bookmarks, loading, error, removeBookmark } = useBookmarks();
  const [books, setBooks] = useState([]);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  // Confirmation modal state
  const [bookmarkToDelete, setBookmarkToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/documents')
      .then(({ data }) => setBooks(data.documents || []))
      .catch((err) => setActionError(err.response?.data?.error || 'Could not load your books.'));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const booksById = useMemo(() => new Map(books.map((book) => [book._id, book])), [books]);

  const requestDeleteBookmark = (bookmark) => {
    setBookmarkToDelete(bookmark);
  };

  const confirmDeleteBookmark = async () => {
    if (!bookmarkToDelete) return;
    setIsDeleting(true);
    setActionError('');
    try {
      await removeBookmark(bookmarkToDelete._id);
      setBookmarkToDelete(null);
      setNotice('Bookmark removed successfully.');
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Could not remove this bookmark.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 className="font-display" style={{ fontSize: 26, marginBottom: 4 }}>
          Bookmarks
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          {bookmarks.length} saved page{bookmarks.length === 1 ? '' : 's'} across your books
        </p>
      </div>

      {notice && (
        <div
          role="status"
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            color: '#22c55e',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13.5,
            marginBottom: 16,
            maxWidth: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{notice}</span>
        </div>
      )}

      {(error || actionError) && (
        <p role="alert" style={{ color: '#ef4444', fontSize: 13.5, marginBottom: 16 }}>
          {actionError || error}
        </p>
      )}

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your bookmarks...</p>}
      {!loading && bookmarks.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          No bookmarks yet. Open any book and select "Bookmark page" to save your spot.
        </p>
      )}

      {/* Bookmarks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        {bookmarks.map((bookmark) => {
          const book = booksById.get(bookmark.documentId);
          return (
            <div
              key={bookmark._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 18px',
                boxShadow: 'var(--shadow)',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Mini Book Icon Thumbnail */}
              <div
                style={{
                  width: 36,
                  height: 48,
                  background: book?.coverColor || '#3c4a5e',
                  borderRadius: '2px 4px 4px 2px',
                  flexShrink: 0,
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 6,
                    width: 6,
                    height: 14,
                    background: 'var(--accent, #c15a52)',
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)',
                  }}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 10, fontWeight: 700 }}>
                  p.{bookmark.page}
                </span>
              </div>

              {/* Book Title & Page Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {book ? (
                  <Link
                    to={`/read/${book._id}?page=${bookmark.page}`}
                    title={book.title}
                    style={{
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: 14.5,
                      fontWeight: 600,
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {book.title}
                  </Link>
                ) : (
                  <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>Book</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      padding: '1px 7px',
                      borderRadius: 4,
                    }}
                  >
                    Page {bookmark.page}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Saved on {new Date(bookmark.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Red Trash Icon for Bookmark Deletion */}
              <button
                type="button"
                onClick={() => requestDeleteBookmark(bookmark)}
                aria-label="Remove bookmark"
                title="Remove bookmark"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
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
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Bookmark Deletion */}
      <ConfirmModal
        isOpen={Boolean(bookmarkToDelete)}
        title="Remove bookmark"
        message={`Are you sure you want to remove the bookmark for "${
          booksById.get(bookmarkToDelete?.documentId)?.title || 'this book'
        }" on page ${bookmarkToDelete?.page}?`}
        confirmText="Remove Bookmark"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={confirmDeleteBookmark}
        onCancel={() => !isDeleting && setBookmarkToDelete(null)}
      />
    </div>
  );
}
