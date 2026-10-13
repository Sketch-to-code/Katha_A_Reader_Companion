import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNotes } from '../../hooks/useNotes';
import AIPanel from './AIPanel';

export default function BookViewer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get('page'));
  const [book, setBook] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [page, setPage] = useState(1);
  const [readingMode, setReadingMode] = useState('leisure');
  const [zoom, setZoom] = useState(1);
  const [selectedText, setSelectedText] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sessionStarted = useRef(Date.now());
  const { bookmarks, addBookmark } = useBookmarks(id);
  const { addNote } = useNotes(id);
  const isBookmarked = bookmarks.some((bookmark) => Number(bookmark.page) === page);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient.get('/documents')
      .then(async ({ data }) => {
        const document = (data.documents || []).find((item) => item._id === id);
        if (!document) throw new Error('This book is not in your library.');
        const { data: file } = await apiClient.get(`/documents/${id}/file-url`);
        if (!cancelled) {
          setBook(document);
          setPage(Number.isInteger(requestedPage) && requestedPage > 0
            ? Math.min(requestedPage, document.pageCount || requestedPage)
            : Math.max(1, document.lastPageRead || 1));
          setFileUrl(file.fileUrl);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || err.message || 'Could not open this PDF.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, requestedPage]);

  const goToPage = async (nextPage) => {
    const target = Math.max(1, Math.min(nextPage, book?.pageCount || nextPage));
    if (target === page || pending) return;
    setPending(true);
    setError('');
    try {
      await apiClient.patch(`/documents/${id}/progress`, { page: target });
      setPage(target);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your reading progress.');
    } finally {
      setPending(false);
    }
  };

  const saveBookmark = async () => {
    setError('');
    try {
      await addBookmark(page);
      setNotice(`Page ${page} bookmarked.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this bookmark.');
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    setError('');
    try {
      const note = await addNote(page, selectedText || null, noteDraft.trim());
      setNoteDraft('');
      setNotice(note.notificationError
        ? `Note saved, but its email notification could not be delivered: ${note.notificationError}`
        : `Note saved on page ${page}.`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not save this note.');
    }
  };

  const finishSession = async () => {
    setError('');
    const durationMinutes = Math.max(1, Math.ceil((Date.now() - sessionStarted.current) / 60000));
    try {
      await apiClient.post(`/documents/${id}/complete-session`, { durationMinutes });
      sessionStarted.current = Date.now();
      setNotice('Study session completed. A session summary has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send the study-session notification.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 className="font-display" style={{ fontSize: 23, margin: 0 }}>{book?.title || 'Your book'}</h2>
          {book?.author && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{book.author}</span>}
        </div>
        <button type="button" onClick={() => setReadingMode('leisure')} style={modeButton(readingMode === 'leisure')}>
          Reading
        </button>
        <button type="button" onClick={() => setReadingMode('academic')} style={modeButton(readingMode === 'academic')}>
          Study with AI
        </button>
        <button
          type="button"
          onClick={saveBookmark}
          disabled={isBookmarked}
          style={{ ...modeButton(isBookmarked), padding: '8px 12px' }}
        >
          {isBookmarked ? '★ Bookmarked' : '☆ Bookmark page'}
        </button>
      </div>

      {error && <p role="alert" style={{ color: '#9e3d37', fontSize: 13 }}>{error}</p>}
      {notice && <p role="status" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{notice}</p>}
      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Opening your PDF...</p>}

      {!loading && fileUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              width: '100%',
              height: 'min(72vh, 860px)',
              minHeight: 480,
              overflow: 'hidden',
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <iframe
              key={`${fileUrl}-${page}`}
              title={`${book?.title || 'PDF'} page ${page}`}
              src={`${fileUrl}#page=${page}&toolbar=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 0,
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                background: 'var(--bg-elevated)',
              }}
            />
          </div>

          <div
            aria-label="PDF page navigation"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '18px 12px 22px',
              margin: '0 auto',
              boxSizing: 'border-box',
              flexWrap: 'wrap',
            }}
          >
            <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1 || pending} style={navButton}>
              ← Previous page
            </button>
            <span style={{ minWidth: 72, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page}{book?.pageCount ? ` of ${book.pageCount}` : ''}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={pending || (book?.pageCount > 0 && page >= book.pageCount)}
              style={navButton}
            >
              Next page →
            </button>
          </div>
        </div>
      )}

      {!loading && readingMode === 'academic' && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 20px' }}>
          <AIPanel documentId={id} selectedText={selectedText} onClose={() => setReadingMode('leisure')} />
        </div>
      )}

      {!loading && book && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', margin: '4px auto 20px', maxWidth: 760 }}>
          <form onSubmit={saveNote} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
            <input
              aria-label={`Add a note on page ${page}`}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder={`Add a note on page ${page}...`}
              style={noteInput}
            />
            <button type="submit" disabled={!noteDraft.trim()} style={navButton}>Save note</button>
          </form>
          <button type="button" onClick={finishSession} style={navButton}>Finish study session</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        <button type="button" onClick={() => setZoom((value) => Math.max(0.8, value - 0.1))} style={zoomButton} aria-label="Zoom out">−</button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))} style={zoomButton} aria-label="Zoom in">+</button>
      </div>
    </div>
  );
}

const navButton = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  padding: '9px 16px',
  fontSize: 13,
  cursor: 'pointer',
};

const zoomButton = { ...navButton, width: 34, height: 34, padding: 0, fontSize: 16 };
const noteInput = {
  minWidth: 0,
  flex: 1,
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  padding: '9px 12px',
  fontSize: 13,
};

function modeButton(active) {
  return {
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: active ? 'var(--accent)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent-text)' : 'var(--text)',
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
  };
}
