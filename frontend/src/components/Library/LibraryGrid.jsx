import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { uploadPdfToSupabase } from '../../api/supabaseStorage';
import BookCard from './BookCard';

import ConfirmModal from '../Common/ConfirmModal';

export default function LibraryGrid() {
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const requestDeleteBook = (book) => {
    setBookToDelete(book);
  };

  const confirmDeleteBook = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      await apiClient.delete(`/documents/${encodeURIComponent(bookToDelete._id)}`);
      setBooks((current) => current.filter((item) => item._id !== bookToDelete._id));
      setBookToDelete(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove this PDF from your library.');
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBooks = books.filter((book) => {
    if (!normalizedQuery) return true;
    const matchTitle = book.title?.toLowerCase().includes(normalizedQuery);
    const matchAuthor = book.author?.toLowerCase().includes(normalizedQuery);
    return matchTitle || matchAuthor;
  });

  const resume = [...books]
    .filter((book) => book.lastOpenedAt)
    .sort((a, b) => new Date(b.lastOpenedAt) - new Date(a.lastOpenedAt))[0];

  return (
    <div>
      {/* Header with Title on Left & Search Bar on Top Right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h2 className="font-display" style={{ fontSize: 26, marginBottom: 4 }}>
            Your library
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
            {books.length} book{books.length === 1 ? '' : 's'} on the shelf
            {normalizedQuery && ` • ${filteredBooks.length} matching "${searchQuery}"`}
          </p>
        </div>

        {/* Top-Right Search Bar */}
        <div style={{ position: 'relative', width: 'min(300px, 100%)' }}>
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
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books by name..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 34px 9px 36px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 13.5,
              outline: 'none',
              boxShadow: 'var(--shadow)',
              transition: 'border-color 0.15s ease',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
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
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Upload button and errors */}
      <div style={{ marginBottom: 26, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            borderRadius: 8,
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '9px 16px',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: uploading ? 'wait' : 'pointer',
            opacity: uploading ? 0.75 : 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            transition: 'opacity 0.15s ease',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'Uploading PDF...' : 'Upload PDF'}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={uploadBook}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        {error && <span role="alert" style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>{error}</span>}
      </div>

      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Gathering your books...</p>}
      {!loading && !books.length && !error && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Your shelf is waiting. Upload a PDF to begin.</p>
      )}

      {/* Resume Banner (hidden during active search) */}
      {resume && !normalizedQuery && (
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
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 40,
              height: 56,
              background: resume.coverColor || '#333',
              borderRadius: 3,
              flexShrink: 0,
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>Resume reading</p>
            <p className="font-display" style={{ margin: '2px 0 0', fontSize: 16 }}>
              {resume.title}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>
              Page {resume.lastPageRead} of {resume.pageCount}
            </p>
          </div>
        </button>
      )}

      {/* Search No Results State */}
      {!loading && books.length > 0 && filteredBooks.length === 0 && (
        <div style={{ padding: '28px 0', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: 15, margin: '0 0 10px' }}>
            No books found matching <strong>"{searchQuery}"</strong>.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--accent)',
              padding: '6px 12px',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Clear search
          </button>
        </div>
      )}

      {/* Book Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        {filteredBooks.map((book) => (
          <BookCard
            key={book._id}
            book={book}
            onDelete={requestDeleteBook}
            isDeleting={isDeleting && bookToDelete?._id === book._id}
          />
        ))}
      </div>

      {/* Modern Confirmation Modal for Book Deletion */}
      <ConfirmModal
        isOpen={Boolean(bookToDelete)}
        title="Remove from library"
        message={`Are you sure you want to remove "${bookToDelete?.title}" from your Katha library? Its associated bookmarks and notes will also be deleted. This action cannot be undone.`}
        confirmText="Remove Book"
        cancelText="Keep Book"
        isLoading={isDeleting}
        onConfirm={confirmDeleteBook}
        onCancel={() => !isDeleting && setBookToDelete(null)}
      />
    </div>
  );
}
