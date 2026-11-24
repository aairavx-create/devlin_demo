/**
 * Website chat widget: a self-contained React component.
 *
 *   <ChatWidget apiBase="http://localhost:4000" businessName="Devlin Carpets & Flooring" />
 *
 * It keeps a session ID in the browser (so the chat survives a refresh) and talks only to
 * `${apiBase}/api/widget/chat` on the meta-agent backend. Open it from anywhere on the page:
 *   openChat()            → open the chat
 *   openChat('measure')   → open it straight at Request to Measure
 * Links work too: ?chat=open and ?chat=measure.
 */
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import ChatCalendar from './ChatCalendar';
import DetailsForm from './DetailsForm';
import type { ChatEntry, ContactDetails, PublicThread } from './types';
import './chatbot.css';

export type ChatWidgetProps = {
  /** Base URL of the meta-agent backend, e.g. http://localhost:4000 */
  apiBase: string;
  /** Shown in the chat header and start screen */
  businessName: string;
  /** Brand colour for the launcher, header and buttons (any CSS colour) */
  accentColor?: string;
  /** Text on the start screen */
  intro?: string;
  /** localStorage prefix; change it if two sites share a domain */
  storageKey?: string;
};

const OPEN_EVENT = 'open-chat';

/** Opens the chat from anywhere: buttons, banners, links. */
export function openChat(entry?: ChatEntry) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: entry ? { entry } : null }));
}

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage blocked */
    }
  },
  del: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* storage blocked */
    }
  },
};

function makeId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ChatWidget({
  apiBase,
  businessName,
  accentColor,
  intro = 'Book a measurement, ask about fitters and flooring, or talk to our team.',
  storageKey = 'site_chat',
}: Readonly<ChatWidgetProps>) {
  const endpoint = `${apiBase.replace(/\/$/, '')}/api/widget/chat`;
  const SID_KEY = `${storageKey}_session`;
  const SEEN_KEY = `${storageKey}_seen`;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<PublicThread | null>(null);
  const [consent, setConsent] = useState(false);
  const [human, setHuman] = useState(false);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [seen, setSeen] = useState(0);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pendingEntry = useRef<ChatEntry | null>(null); // flow to open once the visitor presses Start chat

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { res, data: await res.json().catch(() => ({})) };
    },
    [endpoint],
  );

  /** Jump straight to a flow, e.g. from a Request to Measure button. */
  const enter = useCallback(
    async (entry: ChatEntry) => {
      const sid = sessionIdRef.current;
      if (!sid) {
        pendingEntry.current = entry; // no chat yet: apply it when they press Start chat
        return;
      }
      try {
        const { res, data } = await post({ action: 'start', sessionId: sid, consent: true, entry });
        if (res.ok) setThread(data);
      } catch {
        setError('Connection problem. Please try again.');
      }
    },
    [post],
  );

  // Restore the chat from this browser, and honour ?chat=open / ?chat=measure.
  useEffect(() => {
    const sid = store.get(SID_KEY);
    sessionIdRef.current = sid;
    setSessionId(sid);
    setSeen(Number(store.get(SEEN_KEY) ?? 0));
    const chat = new URLSearchParams(window.location.search).get('chat');
    if (chat === 'open') setOpen(true);
    if (chat === 'measure') {
      setOpen(true);
      void enter('measure');
    }
  }, [enter, SID_KEY, SEEN_KEY]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      setOpen(true);
      const entry = (e as CustomEvent<{ entry?: ChatEntry } | null>).detail?.entry;
      if (entry === 'measure') void enter(entry);
      else pendingEntry.current = null;
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [enter]);

  const forget = useCallback(() => {
    store.del(SID_KEY);
    store.del(SEEN_KEY);
    pendingEntry.current = null;
    sessionIdRef.current = null;
    setSessionId(null);
    setThread(null);
    setSeen(0);
    setConsent(false);
    setHuman(false);
  }, [SID_KEY, SEEN_KEY]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${endpoint}?sessionId=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const t: PublicThread = await res.json();
      if (!t.conversation) return forget(); // chat was removed (demo reset)
      setThread((prev) => (prev && prev.messages.length === t.messages.length && prev.conversation?.bot_paused === t.conversation?.bot_paused ? prev : t));
    } catch {
      /* offline: try again on the next tick */
    }
  }, [sessionId, forget, endpoint]);

  // Poll for staff replies. Production: a WebSocket or server-sent events.
  useEffect(() => {
    if (!sessionId) return;
    void refresh();
    const timer = setInterval(refresh, open ? 2500 : 8000);
    return () => clearInterval(timer);
  }, [sessionId, open, refresh]);

  const messages = thread?.messages ?? [];
  const paused = !!thread?.conversation?.bot_paused;
  const outCount = messages.filter((m) => m.sender !== 'customer').length;
  const unread = open ? 0 : Math.max(0, outCount - seen);

  useEffect(() => {
    if (open && outCount !== seen) {
      setSeen(outCount);
      store.set(SEEN_KEY, String(outCount));
    }
  }, [open, outCount, seen, SEEN_KEY]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending, typing, open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => (sessionId ? inputRef.current : consentRef.current)?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, sessionId]);

  async function start() {
    const id = makeId();
    setError('');
    try {
      const { res, data } = await post({ action: 'start', sessionId: id, consent: true, entry: pendingEntry.current ?? undefined });
      if (!res.ok) return setError(data.error || 'Could not start the chat.');
      pendingEntry.current = null;
      store.set(SID_KEY, id);
      sessionIdRef.current = id;
      setSessionId(id);
      setThread(data);
    } catch {
      setError('Connection problem. Please try again.');
    }
  }

  async function send(text: string, optionId?: string, form?: ContactDetails) {
    text = text.trim();
    if (!text || typing || pending !== null || !sessionId) return;
    setPending(text);
    setTyping(!paused);
    setError('');
    const started = Date.now();
    try {
      const { res, data } = await post({ sessionId, text, optionId, form, clientMsgId: makeId() });
      const wait = (paused ? 0 : 500) - (Date.now() - started); // short pause so the bot feels natural
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (!res.ok) setError(data.error || 'Something went wrong.');
      else setThread(data);
    } catch {
      setError('Connection problem. Please try again.');
    } finally {
      setPending(null);
      setTyping(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = input;
    setInput('');
    void send(v);
  }

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  const last = messages[messages.length - 1];
  const active = !typing && pending === null && !paused && last?.sender === 'bot';
  const busy = typing || pending !== null;
  const ui = active ? last.ui : undefined;
  // With a calendar, the date options are shown as the calendar, not as buttons.
  const options = active ? last.options.filter((o) => !(ui?.type === 'calendar' && o.id.startsWith('date_'))) : [];

  const style = accentColor ? ({ '--cb-accent': accentColor } as CSSProperties) : undefined;

  return (
    <div className={`cb-root${open ? ' cb-is-open' : ''}${paused ? ' cb-staff-mode' : ''}`} style={style}>
      <button
        ref={launcherRef}
        className="cb-launcher"
        type="button"
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        onClick={() => {
          if (!open) pendingEntry.current = null; // plain open: normal greeting
          setOpen((o) => !o);
        }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" />
          <circle cx="9" cy="11" r="1.3" fill="var(--cb-accent)" />
          <circle cx="12.5" cy="11" r="1.3" fill="var(--cb-accent)" />
          <circle cx="16" cy="11" r="1.3" fill="var(--cb-accent)" />
        </svg>
        {unread > 0 && <span className="cb-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <section className="cb-panel" role="dialog" aria-label={`Chat with ${businessName}`} onKeyDown={onKeyDown}>
          <header className="cb-header">
            <div>
              <div className="cb-title">{businessName}</div>
              <div className="cb-status">
                <span className="cb-dot" />
                <span>{paused ? 'Chatting with our team' : 'Assistant online'}</span>
              </div>
            </div>
            <div className="cb-actions">
              {sessionId && (
                <button
                  className="cb-icon"
                  type="button"
                  title="Start a new chat"
                  aria-label="Start a new chat"
                  onClick={() => confirm('Start a new chat? This chat stays saved for our team.') && forget()}
                >
                  &#8635;
                </button>
              )}
              <button className="cb-icon" type="button" title="Close" aria-label="Close chat" onClick={close}>
                &times;
              </button>
            </div>
          </header>

          {!sessionId ? (
            <div className="cb-start">
              <p className="cb-start-title">Hi there!</p>
              <p>{intro}</p>
              <label className="cb-check">
                <input ref={consentRef} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree to the privacy notice: my details are used only to handle my enquiry.</span>
              </label>
              <label className="cb-check">
                <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} />
                <span>
                  I&apos;m not a robot <small>(stand-in for a captcha such as Cloudflare Turnstile)</small>
                </span>
              </label>
              <button className="cb-start-btn" type="button" disabled={!consent || !human} onClick={start}>
                Start chat
              </button>
              {error && (
                <div className="cb-error" role="alert">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="cb-body" ref={bodyRef} aria-live="polite">
                {messages.map((m) => (
                  <div key={m.id} className={`cb-msg cb-${m.sender === 'customer' ? 'me' : m.sender}`}>
                    {m.sender === 'staff' && <div className="cb-from">Staff</div>}
                    <div className="cb-bubble">{m.text}</div>
                  </div>
                ))}
                {ui?.type === 'calendar' && last && <ChatCalendar key={last.id} options={last.options} busy={busy} onPick={(o) => void send(o.label, o.id)} />}
                {ui?.type === 'contact_form' && last && (
                  <DetailsForm key={last.id} ui={ui} busy={busy} onSubmit={(d) => void send(`${d.name}\n${d.phone}\n${d.address}`, undefined, d)} />
                )}
                {pending !== null && (
                  <div className="cb-msg cb-me">
                    <div className="cb-bubble">{pending}</div>
                  </div>
                )}
                {typing && (
                  <div className="cb-msg cb-bot">
                    <div className="cb-bubble cb-typing" aria-label="Assistant is typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>

              {options.length > 0 && (
                <div className="cb-options">
                  {options.map((o) => (
                    <button key={o.id} type="button" className="cb-opt" onClick={() => send(o.label, o.id)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="cb-error" role="alert">
                  {error}
                </div>
              )}

              <form className="cb-form" onSubmit={onSubmit}>
                <input
                  ref={inputRef}
                  className="cb-input"
                  type="text"
                  placeholder="Type a message…"
                  aria-label="Message"
                  autoComplete="off"
                  maxLength={1000}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button className="cb-send" type="submit" aria-label="Send" disabled={!input.trim()}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="currentColor" d="M3 20l18-8L3 4v6l12 2-12 2z" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
