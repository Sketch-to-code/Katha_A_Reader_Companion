import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useNotes } from '../../hooks/useNotes';
import ConfirmModal from '../Common/ConfirmModal';

const fieldStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 13.5,
  outline: 'none',
  transition: 'border-color 0.15s ease',
};

export default function NotesPanel() {
  const { notes, loading, error, addNote, removeNote } = useNotes();
  const [books, setBooks] = useState([]);
  const [documentId, setDocumentId] = useState('');
  const [page, setPage] = useState('1');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  // Confirmation modal state
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    apiClient
      .get('/documents')
      .then(({ data }) => {
        const documents = data.documents || [];
        setBooks(documents);
        setDocumentId(documents[0]?._id || '');
      })
      .catch((err) => setActionError(err.response?.data?.error || 'Could not load your books.'));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const booksById = useMemo(() => new Map(books.map((book) => [book._id, book])), [books]);
  const filtered = notes.filter((note) =>
    `${note.body} ${booksById.get(note.documentId)?.title || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const saveNote = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !documentId || !Number.isInteger(Number(page)) || Number(page) < 1) return;
    setPending(true);
    setActionError('');
    setNotice('');
    try {
      await addNote(Number(page), null, draft.trim(), documentId);
      setDraft('');
      setNotice(`Note saved on page ${page}.`);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Could not save this note.');
    } finally {
      setPending(false);
    }
  };

  const requestDeleteNote = (note) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    setActionError('');
    try {
      await removeNote(noteToDelete._id);
      setNoteToDelete(null);
      setNotice('Note deleted successfully.');
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Could not delete this note.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="font-display" style={{ fontSize: 26, marginBottom: 4 }}>
          Notes
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          {notes.length} note{notes.length === 1 ? '' : 's'} across your library
        </p>
      </div>

      {/* Search Bar with Search Icon */}
      <div style={{ position: 'relative', width: 'min(420px, 100%)', marginBottom: 24 }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          placeholder="Search your notes or book titles..."
          aria-label="Search notes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{
            ...fieldStyle,
            width: '100%',
            boxSizing: 'border-box',
            paddingLeft: 36,
            paddingRight: query ? 32 : 12,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            title="Clear search"
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 14,
              cursor: 'pointer',
              padding: 2,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Note Creation Form */}
      <form
        onSubmit={saveNote}
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
          maxWidth: 720,
          flexWrap: 'wrap',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 14,
        }}
      >
        <select
          aria-label="Book for note"
          value={documentId}
          onChange={(event) => setDocumentId(event.target.value)}
          style={{ ...fieldStyle, minWidth: 190, flex: '1 1 190px' }}
          disabled={!books.length}
        >
          {books.length ? (
            books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.title}
              </option>
            ))
          ) : (
            <option value="">Upload a PDF first</option>
          )}
        </select>
        <input
          aria-label="Page number"
          type="number"
          min="1"
          placeholder="Page"
          value={page}
          onChange={(event) => setPage(event.target.value)}
          style={{ ...fieldStyle, width: 85 }}
        />
        <input
          placeholder="Write a note for this page..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          style={{ ...fieldStyle, flex: '2 1 230px' }}
        />
        <button
          type="submit"
          disabled={pending || !books.length || !draft.trim()}
          style={{
            padding: '10px 18px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: pending || !books.length || !draft.trim() ? 'not-allowed' : 'pointer',
            opacity: pending || !books.length || !draft.trim() ? 0.6 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {pending ? 'Saving...' : 'Add note'}
        </button>
      </form>

      {/* Feedback Messages */}
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

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your notes...</p>}
      {!loading && !filtered.length && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {query ? `No notes matching "${query}".` : 'No notes found. Write your first note above.'}
        </p>
      )}

      {/* Notes List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
        {filtered.map((note) => {
          const bookTitle = booksById.get(note.documentId)?.title || 'Book';
          return (
            <div
              key={note._id}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px 18px',
                boxShadow: 'var(--shadow)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {note.body}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      background: 'var(--accent-soft)',
                      color: 'var(--accent)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    Page {note.page}
                  </span>
                  <span
                    title={bookTitle}
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      maxWidth: 260,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {bookTitle}
                  </span>
                </div>

                {/* Red Trash Icon for Note Deletion */}
                <button
                  type="button"
                  onClick={() => requestDeleteNote(note)}
                  aria-label="Delete note"
                  title="Delete note"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    padding: '4px 6px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    width="15"
                    height="15"
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
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Note Deletion */}
      <ConfirmModal
        isOpen={Boolean(noteToDelete)}
        title="Delete note"
        message={`Are you sure you want to delete this note from page ${noteToDelete?.page}? This action cannot be undone.`}
        confirmText="Delete Note"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={confirmDeleteNote}
        onCancel={() => !isDeleting && setNoteToDelete(null)}
      />
    </div>
  );
}
