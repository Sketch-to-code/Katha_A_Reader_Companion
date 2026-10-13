import { createContext, useContext, useRef, useCallback } from 'react';

// Frontend half of the Observer pattern described in the design doc: the
// progress bar, resume-reading card, and bookmarks panel all subscribe to
// the same bus instead of BookViewer importing and calling each of them
// directly.
const ReadingEventContext = createContext(null);

export function ReadingEventProvider({ children }) {
  const listeners = useRef(new Map());

  const subscribe = useCallback((event, callback) => {
    if (!listeners.current.has(event)) listeners.current.set(event, new Set());
    listeners.current.get(event).add(callback);
    return () => listeners.current.get(event)?.delete(callback);
  }, []);

  const publish = useCallback((event, payload) => {
    listeners.current.get(event)?.forEach((callback) => callback(payload));
  }, []);

  return (
    <ReadingEventContext.Provider value={{ subscribe, publish }}>
      {children}
    </ReadingEventContext.Provider>
  );
}

export function useReadingEvents() {
  const ctx = useContext(ReadingEventContext);
  if (!ctx) throw new Error('useReadingEvents must be used within ReadingEventProvider');
  return ctx;
}
