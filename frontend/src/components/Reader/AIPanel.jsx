import { useEffect, useRef, useState } from 'react';
import { useAIAssistant } from '../../hooks/useAIAssistant';

const TRANSLATION_LANGUAGES = ['Tamil', 'Spanish', 'French', 'Hindi', 'Arabic'];

export default function AIPanel({ documentId, selectedText, onClose }) {
  const { assist, askDocument, pending, error } = useAIAssistant();
  const [question, setQuestion] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Tamil');
  const [narrationStatus, setNarrationStatus] = useState('idle');
  const [passage, setPassage] = useState(selectedText || '');
  const mountedRef = useRef(false);
  const utteranceRef = useRef(null);
  const narrationRequestRef = useRef(0);
  const narrationActiveRef = useRef(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'I can summarize this passage, explain the key idea, or read it aloud.' },
  ]);

  useEffect(() => {
    if (selectedText) setPassage(selectedText);
  }, [selectedText]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      narrationRequestRef.current += 1;
      narrationActiveRef.current = false;
      utteranceRef.current = null;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const runAssist = async (mode, prompt = '') => {
    const context = passage.trim();
    if (!context && !(mode === 'ask' && documentId)) {
      setMessages((current) => [...current, { from: 'bot', text: 'Paste a passage from your PDF above so I can answer from its context.' }]);
      return;
    }

    let narrationRequestId;
    if (mode === 'narrate') {
      if (narrationActiveRef.current) {
        return;
      }
      if (!('speechSynthesis' in window)) {
        setMessages((current) => [...current, {
          from: 'bot',
          text: 'Narration is not supported by this browser.',
        }]);
        return;
      }
      narrationActiveRef.current = true;
      narrationRequestId = ++narrationRequestRef.current;
      utteranceRef.current = null;
      window.speechSynthesis.cancel();
      setNarrationStatus('loading');
    }

    const label = mode === 'ask' ? prompt : mode[0].toUpperCase() + mode.slice(1);
    setMessages((current) => [...current, { from: 'user', text: label }]);

    try {
      const data = mode === 'ask' && !context
        ? await askDocument(documentId, prompt)
        : await assist(context, mode, prompt, targetLanguage);
      if (!mountedRef.current || (
        mode === 'narrate' && narrationRequestId !== narrationRequestRef.current
      )) return;
      const text = formatAssistantResult(data.result);
      setMessages((current) => [
        ...current,
        { from: 'bot', text },
        ...(data.notificationError ? [{ from: 'bot', text: `Email notification could not be delivered: ${data.notificationError}` }] : []),
      ]);

      if (mode === 'narrate') {
        const transcript = data.result?.transcript || context;
        const utterance = new SpeechSynthesisUtterance(transcript);
        utteranceRef.current = utterance;
        utterance.onstart = () => {
          if (utteranceRef.current === utterance) setNarrationStatus('playing');
        };
        utterance.onend = () => {
          if (utteranceRef.current === utterance) {
            utteranceRef.current = null;
            narrationActiveRef.current = false;
            setNarrationStatus('finished');
          }
        };
        utterance.onerror = () => {
          if (utteranceRef.current === utterance) {
            utteranceRef.current = null;
            narrationActiveRef.current = false;
            setNarrationStatus('finished');
            setMessages((current) => [...current, {
              from: 'bot',
              text: 'Narration could not be played by this browser.',
            }]);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      if (!mountedRef.current || (
        mode === 'narrate' && narrationRequestId !== narrationRequestRef.current
      )) return;
      if (mode === 'narrate') {
        narrationActiveRef.current = false;
        setNarrationStatus('idle');
      }
      setMessages((current) => [
        ...current,
        { from: 'bot', text: err.response?.data?.error || 'The AI assistant could not respond just now.' },
      ]);
    }
  };

  const pauseNarration = () => {
    if (narrationStatus !== 'playing') return;
    window.speechSynthesis.pause();
    setNarrationStatus('paused');
  };

  const resumeNarration = () => {
    if (narrationStatus !== 'paused') return;
    window.speechSynthesis.resume();
    setNarrationStatus('playing');
  };

  const stopNarration = () => {
    narrationRequestRef.current += 1;
    narrationActiveRef.current = false;
    utteranceRef.current = null;
    window.speechSynthesis?.cancel();
    setNarrationStatus('idle');
  };

  const sendQuestion = () => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    setQuestion('');
    runAssist('ask', trimmed);
  };

  return (
    <aside
      style={{
        width: 'min(420px, calc(100vw - 32px))',
        marginTop: 18,
        marginLeft: 'auto',
        marginRight: 'auto',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 16px 36px rgba(12, 16, 20, 0.18)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, rgba(212, 180, 89, 0.12), rgba(120, 171, 255, 0.08))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: pending ? '#d4b459' : '#43b581',
              boxShadow: pending ? '0 0 0 4px rgba(212, 180, 89, 0.12)' : '0 0 0 4px rgba(67, 181, 129, 0.12)',
            }}
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Academic AI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {pending ? 'Searching your book...' : 'Ask anything about this book'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 18,
            cursor: 'pointer',
            lineHeight: 1,
          }}
          aria-label="Close AI panel"
        >
          x
        </button>
      </div>

      <label
        style={{
          display: 'grid',
          gap: 6,
          padding: '10px 14px',
          fontSize: 11.5,
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        Passage from your PDF
        <textarea
          value={passage}
          onChange={(event) => setPassage(event.target.value)}
          placeholder="Paste a passage here to ground your questions in the book..."
          rows={3}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
            border: '1px solid var(--border)',
            borderRadius: 8,
            background: 'var(--bg)',
            color: 'var(--text)',
            padding: '8px 10px',
            font: 'inherit',
          }}
        />
      </label>

      <div style={{ padding: '14px', display: 'grid', gap: 10, maxHeight: 220, overflow: 'auto' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              maxWidth: '78%',
              marginLeft: msg.from === 'bot' ? 0 : 'auto',
              padding: '10px 12px',
              borderRadius: 12,
              whiteSpace: 'pre-wrap',
              background: msg.from === 'bot' ? 'rgba(122, 142, 175, 0.08)' : 'var(--accent)',
              color: msg.from === 'bot' ? 'var(--text)' : 'var(--accent-text)',
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            {msg.text}
          </div>
        ))}
        {error && (
          <div style={{ fontSize: 11.5, color: '#b24848' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 14px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {[
            ['Summarize', 'summarize'],
            ['Explain', 'explain'],
            ['Narrate', 'narrate'],
          ].map(([action, mode]) => (
            <button
              key={action}
              onClick={() => runAssist(mode)}
              disabled={pending || (
                mode === 'narrate' && ['loading', 'playing', 'paused'].includes(narrationStatus)
              )}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                borderRadius: 999,
                padding: '7px 8px',
                fontSize: 11,
                cursor: pending ? 'wait' : 'pointer',
              }}
            >
              {action}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label htmlFor="katha-translation-language" style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>
              Translate to
            </label>
            <select
              id="katha-translation-language"
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              style={{
                flex: 1,
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                borderRadius: 8,
                padding: '7px 9px',
                font: 'inherit',
                fontSize: 12,
              }}
            >
              {TRANSLATION_LANGUAGES.map((language) => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => runAssist('translate')}
              disabled={pending || !passage.trim()}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                borderRadius: 999,
                padding: '7px 11px',
                fontSize: 11,
                cursor: pending ? 'wait' : 'pointer',
                opacity: pending || !passage.trim() ? 0.65 : 1,
              }}
            >
              Translate
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>Narration</span>
            <span aria-live="polite" style={{ flex: 1, color: 'var(--text-muted)', fontSize: 11 }}>
              {narrationStatus === 'loading'
                ? 'Preparing'
                : narrationStatus === 'playing'
                  ? 'Playing'
                  : narrationStatus === 'paused'
                    ? 'Paused'
                    : narrationStatus === 'finished'
                      ? 'Finished'
                      : 'Idle'}
            </span>
            {narrationStatus === 'playing' && (
              <button type="button" onClick={pauseNarration} style={playbackButtonStyle}>Pause</button>
            )}
            {narrationStatus === 'paused' && (
              <button type="button" onClick={resumeNarration} style={playbackButtonStyle}>Resume</button>
            )}
            {['loading', 'playing', 'paused'].includes(narrationStatus) && (
              <button type="button" onClick={stopNarration} style={playbackButtonStyle}>Stop</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendQuestion();
            }}
            placeholder="Ask a question about the whole book..."
            style={{
              flex: 1,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              borderRadius: 999,
              padding: '10px 12px',
              fontSize: 12,
            }}
          />
          <button
            onClick={sendQuestion}
            disabled={pending || !question.trim()}
            style={{
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--accent-text)',
              borderRadius: 999,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: pending ? 'wait' : 'pointer',
              opacity: pending || !question.trim() ? 0.65 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
}

const playbackButtonStyle = {
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  borderRadius: 999,
  padding: '6px 9px',
  fontSize: 10.5,
  cursor: 'pointer',
};

function formatAssistantResult(result) {
  if (!result || typeof result === 'string') return result || '';
  if (result.transcript) return `${result.transcript}\n\nEstimated listening time: ${result.durationSec}s`;
  if (result.audioUrl) return `Narration ready: ${result.audioUrl}`;
  return JSON.stringify(result, null, 2);
}
