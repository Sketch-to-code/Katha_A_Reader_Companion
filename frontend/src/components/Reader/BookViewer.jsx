import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import apiClient from '../../api/apiClient';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useNotes } from '../../hooks/useNotes';
import { useToast } from '../../context/ToastContext';
import AIPanel from './AIPanel';

// Point PDF.js worker at the bundled copy (Vite will copy it to /assets)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// ─── CSS injected once for the text layer ────────────────────────────────────
const TEXT_LAYER_STYLE_ID = 'katha-pdf-text-layer-style';
if (!document.getElementById(TEXT_LAYER_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = TEXT_LAYER_STYLE_ID;
  style.textContent = `
    .katha-text-layer {
      position: absolute;
      inset: 0;
      overflow: hidden;
      line-height: 1;
      /* pointer-events is set via inline style; spans inherit from here.
         scroll mode: this div = none  → spans inherit none  → events pass through to scroll container
         select mode: this div = auto  → spans inherit auto  → click/drag selects text */
    }
    .katha-text-layer > span {
      color: transparent;
      position: absolute;
      white-space: pre;
      cursor: text;
      transform-origin: 0% 0%;
      /* NO pointer-events override — inherits from parent */
    }
    .katha-text-layer ::selection {
      background: rgba(59, 130, 246, 0.35);
      color: transparent;
    }
  `;
  document.head.appendChild(style);
}

// ─── Single-page canvas + text layer ─────────────────────────────────────────
function PdfPage({ pdf, pageNumber, containerWidth, textSelectMode, onHeightChange }) {
  const wrapperRef    = useRef(null);
  const canvasRef     = useRef(null);
  const textLayerRef  = useRef(null);
  const renderTaskRef = useRef(null);
  const textRenderRef = useRef(null);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !textLayerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const page     = await pdf.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const scale    = containerWidth > 0 ? containerWidth / viewport.width : 1;
        const scaled   = page.getViewport({ scale });

        if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
        if (textRenderRef.current) { textRenderRef.current.cancel?.(); textRenderRef.current = null; }

        // ── Canvas ──────────────────────────────────────────────────────────
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width  = scaled.width;
        canvas.height = scaled.height;
        // Report the real CSS height now — VirtualPageList uses this to align
        // placeholder slots so scrollIntoView(initialPage) lands correctly.
        onHeightChange?.(scaled.height);

        const renderTask = page.render({ canvasContext: ctx, viewport: scaled });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
        if (cancelled) return;

        // ── Text layer (pdfjs v4+ TextLayer class) ──────────────────────────
        const textLayerDiv = textLayerRef.current;
        if (!textLayerDiv) return;
        textLayerDiv.replaceChildren();
        textLayerDiv.style.width  = scaled.width + 'px';
        textLayerDiv.style.height = scaled.height + 'px';

        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: page.streamTextContent(),
          container:         textLayerDiv,
          viewport:          scaled,
        });
        textRenderRef.current = textLayer;
        await textLayer.render();
        textRenderRef.current = null;

      } catch (err) {
        if (err && err.name !== 'RenderingCancelledException') {
          console.warn('PDF page ' + pageNumber + ' render error:', err);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) { renderTaskRef.current.cancel(); renderTaskRef.current = null; }
      if (textRenderRef.current) { textRenderRef.current.cancel?.(); textRenderRef.current = null; }
    };
  }, [pdf, pageNumber, containerWidth]); // onHeightChange intentionally omitted (stable ref)

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'block', width: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
      {/*
        pointerEvents on this div flows down to spans via CSS inheritance:
          scroll mode  (default) → 'none' → spans don't intercept events → outer scroll works
          select mode            → 'auto' → spans receive events → text is selectable
      */}
      <div
        ref={textLayerRef}
        className="katha-text-layer"
        aria-hidden="true"
        style={{ pointerEvents: textSelectMode ? 'auto' : 'none' }}
      />
    </div>
  );
}

// ─── Virtualized page list ────────────────────────────────────────────────────
const RENDER_BUFFER = 1; // pages above/below the visible page to keep rendered

const VirtualPageList = forwardRef(function VirtualPageList(
  { pdf, totalPages, onPageChange, initialPage, containerWidth, textSelectMode },
  ref
) {
  const slotRefs     = useRef([]);
  const containerRef = useRef(null);
  const pageRef      = useRef(initialPage);

  // ── Stable slot heights ──────────────────────────────────────────────────
  // Root cause of "starts from wrong page":
  //   scrollIntoView runs before canvases have rendered → slots have 0 height →
  //   scroll lands at the wrong position.
  // Fix: ALL slots (rendered + placeholder) share the same minHeight, seeded
  //   from the first real canvas render. Once we know the real height, we
  //   scroll to initialPage — at that point the layout is stable.
  const [pageHeight, setPageHeight]  = useState(900); // safe default
  const hasScrolledToInitial         = useRef(false);

  // Only the initialPage's PdfPage calls this back
  const onHeightChange = useCallback((h) => {
    if (h > 50) setPageHeight(h);
  }, []);

  // Scroll to initialPage once real height is known (pageHeight changes from default)
  useEffect(() => {
    if (hasScrolledToInitial.current) return;
    if (!containerRef.current) return;
    const slot = slotRefs.current[initialPage - 1];
    if (!slot) return;
    slot.scrollIntoView({ block: 'start' });
    hasScrolledToInitial.current = true;
  }, [pageHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose goToPage to BookViewer
  useImperativeHandle(ref, () => ({
    goToPage(n) {
      const slot = slotRefs.current[n - 1];
      if (slot) slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  }));

  const [visiblePage, setVisiblePage] = useState(initialPage);
  const handlePageChange = useCallback((p) => {
    setVisiblePage(p);
    onPageChange(p);
  }, [onPageChange]);

  // IntersectionObserver — most-visible page wins
  useEffect(() => {
    if (!containerRef.current) return;
    const visibleRatios = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRatios.set(Number(entry.target.dataset.page), entry.intersectionRatio);
        }
        let best = pageRef.current;
        let bestRatio = -1;
        for (const [p, ratio] of visibleRatios) {
          if (ratio > bestRatio) { bestRatio = ratio; best = p; }
        }
        if (best !== pageRef.current) {
          pageRef.current = best;
          handlePageChange(best);
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45,
                    0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
      }
    );
    slotRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [pdf, totalPages, handlePageChange]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px 0',
        boxSizing: 'border-box',
        WebkitOverflowScrolling: 'touch',
        outline: 'none',
      }}
      tabIndex={0}
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const shouldRender = Math.abs(p - visiblePage) <= RENDER_BUFFER;
        return (
          <div
            key={p}
            ref={(el) => { slotRefs.current[p - 1] = el; }}
            data-page={p}
            style={{
              width: '100%',
              marginBottom: 16,
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              // All slots share the same minHeight so the scroll position is
              // consistent before and after canvases render.
              minHeight: pageHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {shouldRender ? (
              <PdfPage
                pdf={pdf}
                pageNumber={p}
                containerWidth={containerWidth}
                textSelectMode={textSelectMode}
                // Only report height from initialPage's canvas — one calibration is enough
                onHeightChange={p === initialPage ? onHeightChange : undefined}
              />
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Page {p}</span>
            )}
          </div>
        );
      })}
    </div>
  );
});

// ─── Main BookViewer ──────────────────────────────────────────────────────────
export default function BookViewer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get('page'));
  const toast = useToast();
  const [book, setBook] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [page, setPage] = useState(1);
  const [readingMode, setReadingMode] = useState('leisure');
  const [selectedText, setSelectedText] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // false = scroll mode (default): spans are transparent to pointer events, scroll works
  // true  = select mode: spans capture pointer events so text can be highlighted
  const [textSelectMode, setTextSelectMode] = useState(false);

  // PDF.js document instance
  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState('');

  const sessionStarted = useRef(Date.now());
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks(id);
  const { addNote } = useNotes(id);
  const currentBookmark = bookmarks.find((bookmark) => Number(bookmark.page) === page);
  const isBookmarked = Boolean(currentBookmark);

  const progressDebounceRef = useRef(null);
  const virtualListRef = useRef(null);

  // Container width for scale calculation
  const cardRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (!cardRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width - 32); // subtract horizontal padding
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Load book metadata & signed URL ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPdf(null);
    setPdfError('');
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

  // ── Load PDF with PDF.js once we have the URL ───────────────────────────────
  useEffect(() => {
    if (!fileUrl) return;
    let task;
    let cancelled = false;
    setPdfError('');
    setPdf(null);

    (async () => {
      try {
        task = pdfjsLib.getDocument({ url: fileUrl, withCredentials: false });
        const doc = await task.promise;
        if (!cancelled) setPdf(doc);
      } catch (err) {
        if (!cancelled) setPdfError(err.message || 'Could not load the PDF.');
      }
    })();

    return () => {
      cancelled = true;
      task?.destroy?.();
    };
  }, [fileUrl]);

  // Synchronize documentElement attribute for sidebar collapse in Study mode
  useEffect(() => {
    if (readingMode === 'academic') {
      document.documentElement.setAttribute('data-study-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-study-mode');
    }
    return () => {
      document.documentElement.removeAttribute('data-study-mode');
    };
  }, [readingMode]);

  const totalPages = Math.max(1, book?.pageCount || pdf?.numPages || 1);

  const goToPage = useCallback((nextPage) => {
    const target = Math.max(1, Math.min(nextPage, totalPages));
    setPage(target);
    virtualListRef.current?.goToPage?.(target);

    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);
    progressDebounceRef.current = setTimeout(async () => {
      try {
        await apiClient.patch(`/documents/${id}/progress`, { page: target });
      } catch (err) {
        console.warn('Could not save progress:', err.message);
      }
    }, 500);
  }, [id, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToPage(page + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPage(page - 1);
      } else if (e.key === 'Escape' && readingMode === 'academic') {
        setReadingMode('leisure');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, goToPage, readingMode, pending]);

  // Capture text selected inside the PDF text layer
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const text = sel.toString().trim();
      if (text) setSelectedText(text);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const handlePageChange = useCallback((detected) => {
    setPage(detected);
    if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current);
    progressDebounceRef.current = setTimeout(async () => {
      try {
        await apiClient.patch(`/documents/${id}/progress`, { page: detected });
      } catch (err) {
        console.warn('Could not save progress:', err.message);
      }
    }, 800);
  }, [id]);

  // Interactive Bookmark Toggle
  const toggleBookmark = async () => {
    setError('');
    try {
      if (isBookmarked && currentBookmark) {
        await removeBookmark(currentBookmark._id);
        const msg = `Bookmark removed from page ${page}.`;
        setNotice(msg);
        toast.info(msg);
      } else {
        await addBookmark(page);
        const msg = `Page ${page} bookmarked.`;
        setNotice(msg);
        toast.success(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not update bookmark.';
      setError(msg);
      toast.error(msg);
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    setError('');
    try {
      await addNote(page, selectedText || null, noteDraft.trim());
      setNoteDraft('');
      const msg = `Note saved on page ${page}.`;
      setNotice(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Could not save this note.';
      setError(msg);
      toast.error(msg);
    }
  };

  const finishSession = async () => {
    setError('');
    const durationMinutes = Math.max(1, Math.ceil((Date.now() - sessionStarted.current) / 60000));
    try {
      await apiClient.post(`/documents/${id}/complete-session`, { durationMinutes });
      sessionStarted.current = Date.now();
      const msg = 'Study session completed. A session summary has been sent to your email.';
      setNotice(msg);
      toast.success(msg);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not send the study-session notification.';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="katha-reader-container">
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 className="font-display" style={{ fontSize: 23, margin: 0 }}>{book?.title || 'Your book'}</h2>
          {book?.author && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{book.author}</span>}
        </div>
        <button type="button" onClick={() => setReadingMode('leisure')} style={modeButton(readingMode === 'leisure')}>
          Reading
        </button>
        <button
          type="button"
          onClick={() => setReadingMode(readingMode === 'academic' ? 'leisure' : 'academic')}
          style={modeButton(readingMode === 'academic')}
        >
          Study with AI
        </button>
        <button
          type="button"
          onClick={toggleBookmark}
          title={isBookmarked ? `Remove bookmark from page ${page}` : `Bookmark page ${page}`}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark page'}
          style={{ ...modeButton(isBookmarked), padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 14, color: isBookmarked ? '#eab308' : 'inherit' }}>{isBookmarked ? '★' : '☆'}</span>
          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark page'}</span>
        </button>
      </div>

      {error && <p role="alert" style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
      {notice && <p role="status" style={{ color: 'var(--text-muted)', fontSize: 13 }}>{notice}</p>}
      {loading && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Opening your PDF...</p>}
      {pdfError && <p role="alert" style={{ color: '#ef4444', fontSize: 13 }}>{pdfError}</p>}

      {!loading && fileUrl && (
        <div className={readingMode === 'academic' ? 'katha-reader-study-active' : 'katha-reader-standard'}>
          <div className="katha-reader-column">

            {/* ── PDF Card ── */}
            <div
              ref={cardRef}
              className="katha-pdf-card"
              style={{
                width: '100%',
                height: 'min(80vh, 900px)',
                minHeight: 520,
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elevated)',
                boxShadow: 'var(--shadow)',
                position: 'relative',
                overflow: 'hidden',
                padding: '0 16px',
                boxSizing: 'border-box',
              }}
            >
              {/* ── Scroll / Select toggle ── */}
              <button
                type="button"
                onClick={() => setTextSelectMode((m) => !m)}
                title={textSelectMode ? 'Switch to scroll mode' : 'Switch to text-select mode'}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 14,
                  zIndex: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-pill)',
                  background: textSelectMode ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: textSelectMode ? 'var(--accent-text)' : 'var(--text-muted)',
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  userSelect: 'none',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                }}
              >
                <span>{textSelectMode ? '✎' : '↕'}</span>
                <span>{textSelectMode ? 'Select text ON' : 'Scroll mode'}</span>
              </button>

              {pdf ? (
                <VirtualPageList
                  ref={virtualListRef}
                  pdf={pdf}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  initialPage={page}
                  containerWidth={containerWidth}
                  textSelectMode={textSelectMode}
                />
              ) : (
                !pdfError && (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: 14,
                  }}>
                    Rendering PDF…
                  </div>
                )
              )}
            </div>

            {/* ── Page indicator ── */}
            <div
              aria-label="PDF page indicator"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 12px 16px',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  padding: '6px 18px',
                  borderRadius: 'var(--radius-pill)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                Page {page}{book?.pageCount ? ` of ${book.pageCount}` : (pdf ? ` of ${pdf.numPages}` : '')}
              </span>
            </div>

            {/* ── Notes bar & session button ── */}
            {book && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  flexWrap: 'wrap',
                  margin: '4px 0 16px',
                  width: '100%',
                  maxWidth: readingMode === 'academic' ? '100%' : 760,
                }}
              >
                <form onSubmit={saveNote} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
                  <input
                    aria-label={`Add a note on page ${page}`}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder={`Add a note on page ${page}...`}
                    style={noteInput}
                  />
                  <button type="submit" disabled={!noteDraft.trim()} style={navButton}>
                    Save note
                  </button>
                </form>
                <button type="button" onClick={finishSession} style={navButton}>
                  Finish study session
                </button>
              </div>
            )}
          </div>

          {/* ── AI Panel (Study mode) ── */}
          {readingMode === 'academic' && (
            <>
              <div className="katha-ai-backdrop" onClick={() => setReadingMode('leisure')} aria-hidden="true" />
              <AIPanel documentId={id} selectedText={selectedText} onClose={() => setReadingMode('leisure')} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

const navButton = {
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  padding: '9px 16px',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'border-color 0.15s ease, background 0.15s ease',
};

const noteInput = {
  minWidth: 0,
  flex: 1,
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-elevated)',
  color: 'var(--text)',
  padding: '9px 12px',
  fontSize: 13,
};

function modeButton(active) {
  return {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-pill)',
    background: active ? 'var(--accent)' : 'var(--bg-elevated)',
    color: active ? 'var(--accent-text)' : 'var(--text)',
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };
}