import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

export function useNotes(documentId) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/notes', { params: documentId ? { documentId } : {} });
      setNotes(data.notes || []);
    } catch (err) {
      const message = err.response?.data?.error || 'Could not load your notes.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const addNote = useCallback(
    async (page, highlightedText, body, noteDocumentId = documentId) => {
      const { data } = await apiClient.post('/notes', {
        documentId: noteDocumentId,
        page,
        highlightedText,
        body,
      });
      setNotes((prev) => [...prev, data]);
      return data;
    },
    [documentId]
  );

  const updateNote = useCallback(async (id, patch) => {
    const { data } = await apiClient.patch(`/notes/${id}`, patch);
    setNotes((prev) => prev.map((note) => (note._id === id ? data : note)));
    return data;
  }, []);

  const removeNote = useCallback(async (id) => {
    const existing = notes.find((note) => note._id === id);
    setNotes((prev) => prev.filter((note) => note._id !== id));
    try {
      await apiClient.delete(`/notes/${id}`);
    } catch (err) {
      if (existing) setNotes((prev) => [...prev, existing]);
      setError(err.response?.data?.error || 'Could not delete this note.');
      throw err;
    }
  }, [notes]);

  return { notes, loading, error, addNote, updateNote, removeNote, refresh };
}
