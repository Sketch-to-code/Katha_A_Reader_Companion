import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../api/apiClient';
import { useNotes } from '../../hooks/useNotes';

const fieldStyle = {
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  fontSize: 13.5,
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

  useEffect(() => {
    apiClient.get('/documents')
      .then(({ data }) => {
        const documents = data.documents || [];
        setBooks(documents);
        setDocumentId(documents[0]?._id || '');
      })
      .catch((err) => setActionError(err.response?.data?.error || 'Could not load your books.'));
  }, []);

  const booksById = useMemo(() => new Map(books.map((book) => [book._id, book])), [books]);
  const filtered = notes.filter((note) =>
    `${note.body} ${booksById.get(note.documentId)?.title || ''}`.toLowerCase().includes(query.toLowerCase())
  );

  const saveNote = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !documentId || !Number.isInteger(Number(page)) || Number(page) < 1) return;
    setPending(true);
    setActionError('');
    try {
      const note = await addNote(Number(page), null, draft.trim(), documentId);
      setDraft('');
      if (note.notificationError) {
        setActionError(`Note saved, but its email notification could not be delivered: ${note.notificationError}`);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Could not save this note.');
    } finally {
      setPending(false);
    }
  };

  const deleteNote = async (id) => {
    setActionError('');
    try {
      await removeNote(id);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Could not delete this note.');
    }
  };

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 24, marginBottom: 16 }}>Notes</h2>

      <input
        placeholder="Search your notes..."
        aria-label="Search notes"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        style={{ ...fieldStyle, width: '100%', maxWidth: 420, marginBottom: 20 }}
      />

      <form onSubmit={saveNote} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 700, flexWrap: 'wrap' }}>
        <select
          aria-label="Book for note"
          value={documentId}
          onChange={(event) => setDocumentId(event.target.value)}
          style={{ ...fieldStyle, minWidth: 190, flex: '1 1 190px' }}
          disabled={!books.length}
        >
          {books.length ? books.map((book) => (
            <option key={book._id} value={book._id}>{book.title}</option>
          )) : <option value="">Upload a PDF first</option>}
        </select>
        <input
          aria-label="Page number"
          type="number"
          min="1"
          value={page}
          onChange={(event) => setPage(event.target.value)}
          style={{ ...fieldStyle, width: 90 }}
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
            padding: '9px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            fontSize: 13.5,
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? 'Saving...' : 'Add note'}
        </button>
      </form>

      {(error || actionError) && (
        <p role="alert" style={{ color: '#9e3d37', fontSize: 13 }}>{actionError || error}</p>
      )}
      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your notes...</p>}
      {!loading && !filtered.length && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No notes found.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
        {filtered.map((note) => (
          <div
            key={note._id}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '12px 16px',
            }}
          >
            <p style={{ margin: 0, fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{note.body}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {booksById.get(note.documentId)?.title || 'Book'} · Page {note.page}
              </span>
              <button
                type="button"
                onClick={() => deleteNote(note._id)}
                aria-label="Delete note"
                title="Delete note"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer' }}
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
