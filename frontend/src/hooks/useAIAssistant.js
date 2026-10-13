import { useCallback, useState } from 'react';
import apiClient from '../api/apiClient';

export function useAIAssistant() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const request = useCallback(async (path, payload) => {
    setPending(true);
    setError(null);
    setResponse(null);
    try {
      const { data } = await apiClient.post(path, payload);
      setResponse(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'The AI assistant could not respond just now.';
      setError(message);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);

  const assist = useCallback(
    (text, mode, question = '', targetLanguage) =>
      request('/ai/assist', {
        text,
        mode,
        question,
        ...(targetLanguage ? { targetLanguage } : {}),
      }),
    [request]
  );
  const askDocument = useCallback(
    (documentId, question) => request('/ai/document-chat', { documentId, question }),
    [request]
  );

  return { assist, askDocument, pending, error, response, clear: () => setResponse(null) };
}
