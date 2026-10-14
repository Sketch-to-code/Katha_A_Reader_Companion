import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { uploadPdfToSupabase } from '../../api/supabaseStorage';
import BookCard from './BookCard';

export default function LibraryGrid() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get('/documents')
      .then(({ data }) => setBooks(data.documents || []))
      .catch((err) => setError(err.response?.data?.error || 'Could not load your library.'))
      .finally(() => setLoading(false));
  }, []);

  const uploadBook = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadPdfToSupabase(file);
      const title = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      const { data } = await apiClient.post('/documents', {
        title,
        author: 'Unknown author',
        fileUrl: uploaded.storagePath,
        storagePath: uploaded.storagePath,
        pageCount: 1,
      });
      setBooks((current) => [data, ...current.filter((book) => book._id !== data._id)]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not upload this PDF.');
    } finally {
      setUploading(false);
    }
  };

  const deleteBook = async (book) => {
    if (!window.confirm(`Remove "${book.title}" from your Katha library?`)) return;

    setDeletingId(book._id);
    setError('');
    try {
      await apiClient.delete(`/documents/${encodeURIComponent(book._id)}`);
      setBooks((current) => current.filter((item) => item._id !== book._id));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove this PDF from your library.');
    } finally {
      setDeletingId(null);
    }
  };

  const resume = [...books]
    .filter((book) => book.lastOpenedAt)
    .sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt))[0];

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 24, marginBottom: 4 }}>
        Your library
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '0 0 28px' }}>
        {books.length} book{books.length === 1 ? '' : 's'} on the shelf
      </p>

      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '9px 14px',
            fontSize: 13.5,
            fontWeight: 600,
            opacity: uploading ? 0.75 : 1,
          }}
        >
          {uploading ? 'Uploading...' : 'Upload PDF'}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={uploadBook}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {error && <span role="alert" style={{ color: '#9e3d37', fontSize: 13 }}>{error}</span>}
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Gathering your books...</p>}
      {!loading && !books.length && !error && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your shelf is waiting. Upload a PDF to begin.</p>
      )}

      {resume && (
        <button
          onClick={() => navigate(`/read/${resume._id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            border: 'none',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 32,
            width: '100%',
            maxWidth: 460,
          }}
        >
          <div style={{ width: 40, height: 56, background: resume.coverColor || '#333', borderRadius: 2, flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>Resume reading</p>
            <p className="font-display" style={{ margin: '2px 0 0', fontSize: 16 }}>{resume.title}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>
              Page {resume.lastPageRead} of {resume.pageCount}
            </p>
          </div>
        </button>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        {books.map((book) => (
          <div key={book._id}>
            <BookCard book={book} />
            <button
              type="button"
              onClick={() => deleteBook(book)}
              disabled={deletingId === book._id}
              style={{
                marginTop: 8,
                padding: '5px 8px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--bg)',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: deletingId === book._id ? 'wait' : 'pointer',
              }}
            >
              {deletingId === book._id ? 'Removing...' : 'Remove from Katha'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
