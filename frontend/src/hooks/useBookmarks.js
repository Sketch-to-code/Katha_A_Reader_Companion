import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useReadingEvents } from '../context/ReadingEventContext';

export function useBookmarks(documentId) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { publish } = useReadingEvents();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/bookmarks', { params: documentId ? { documentId } : {} });
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      const message = err.response?.data?.error || 'Could not load your bookmarks.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const addBookmark = useCallback(
    async (page, thumbnailUrl) => {
      const { data } = await apiClient.post('/bookmarks', { documentId, page, thumbnailUrl });
      setBookmarks((prev) => [...prev, data]);
      publish('bookmark:created', { documentId, page });
      return data;
    },
    [documentId, publish]
  );

  const removeBookmark = useCallback(async (id) => {
    const previous = bookmarks;
    setBookmarks((current) => current.filter((bookmark) => bookmark._id !== id));
    try {
      await apiClient.delete(`/bookmarks/${id}`);
    } catch (err) {
      setBookmarks(previous);
      setError(err.response?.data?.error || 'Could not remove this bookmark.');
      throw err;
    }
  }, [bookmarks]);

  return { bookmarks, loading, error, addBookmark, removeBookmark, refresh };
}
