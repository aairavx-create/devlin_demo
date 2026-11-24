/**
 * Website chats dashboard: KPIs, live inbox with staff takeover, requests and leads.
 * Bookings and measuring slots live in BookingsDashboard.
 * Ported from website-chatbot-dashboard/components/Dashboard.tsx.
 *
 *   <ChatsDashboard apiBase="http://localhost:4000" apiKey="..." />
 *
 * Talks to `${apiBase}/api/chatbot/admin` (protected by the x-api-key header).
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { RequestStatus, RequestType } from './types';
import { timeAgo, useAdminData } from './useAdminData';
import './chatbot-admin.css';

const REQUEST_LABEL: Record<RequestType, string> = {
  callback: 'Call back (measure)',
  fitter_referral: 'Fitter referral',
  flooring_guidance: 'Flooring guidance',
};

const STEP_LABEL: Record<string, string> = {
  MENU: 'Main menu',
  DONE: 'Finished',
  MEASURE_MENU: 'Measure: choosing',
  MEASURE_REQUEST: 'Measure: typing request',
  MEASURE_ANSWERED: 'Measure: answered',
  CALLBACK_PHONE: 'Call back: phone',
  CALLBACK_TIME: 'Call back: best time',
  PICK_DATE: 'Booking: day',
  PICK_SLOT: 'Booking: time',
  GET_DETAILS: 'Booking: details form',
  CONFIRM: 'Booking: confirming',
  FAC_MENU: 'Facilitation: choosing',
  FAC_FITTER: 'Facilitation: fitter info',
  FAC_MESSAGE: 'Facilitation: message',
  FAC_PHONE: 'Facilitation: phone',
};


type Tab = 'inbox' | 'requests' | 'leads';

export default function ChatsDashboard({ apiBase, apiKey, websiteUrl }: Readonly<{ apiBase: string; apiKey: string; websiteUrl?: string }>) {
  const { data, failed, now, act: run } = useAdminData(apiBase, apiKey);
  const [tab, setTab] = useState<Tab>('inbox');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setError(await run(action, extra));
  }

  const conv = useMemo(() => {
    if (!data) return null;
    return data.conversations.find((c) => c.id === selected) ?? data.conversations[0] ?? null;
  }, [data, selected]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv?.id, conv?.messages.length, tab]);

  async function sendReply(e: FormEvent) {
    e.preventDefault();
    if (!conv || !reply.trim()) return;
    const text = reply;
    setReply('');
    await act('reply', { id: conv.id, text });
  }

  if (!data) {
    return <div className="ca">{failed ? <div className="alert alert-error">{failed}</div> : <div className="spinner-row"><span className="spinner" /> Loading…</div>}</div>;
  }

  const k = data.kpis;
  const kpis: [string, number, boolean][] = [
    ['Chats started', k.chats, false],
    ['Leads captured', k.leads, false],
    ['Measurement bookings', k.bookings, false],
    ['New requests', k.openRequests, k.openRequests > 0],
    ['Waiting for staff', k.waiting, k.waiting > 0],
  ];
  const tabs: [Tab, string, number?][] = [
    ['inbox', 'Live inbox', k.waiting || undefined],
    ['requests', 'Requests', k.openRequests || undefined],
    ['leads', 'Leads'],
  ];

  return (
    <div className="ca">
      {failed && <div className="alert alert-warn">{failed} Retrying…</div>}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="btn-link" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="kpis">
        {kpis.map(([label, value, warn]) => (
          <div key={label} className={`kpi${warn ? ' warn' : ''}`}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="lm-toolbar">
        <div className="lm-tabs" role="tablist" aria-label="Chat dashboard sections">
          {tabs.map(([id, label, count]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
              {count ? ` (${count})` : ''}
            </button>
          ))}
        </div>
        <div className="btn-row" style={{ marginLeft: 'auto' }}>
          {websiteUrl && (
            <a className="btn" href={websiteUrl} target="_blank" rel="noreferrer">
              Open website chat
            </a>
          )}
          <button className="btn ghost" type="button" onClick={() => confirm('Reset all chatbot data back to the samples?') && act('reset')}>
            Reset demo data
          </button>
        </div>
      </div>

      {tab === 'inbox' && (
        <section className="card">
          <div className="card-head">
            <h3>Live inbox</h3>
            <span className="muted small">Take over a chat to pause the bot and reply as staff</span>
          </div>
          <div className="inbox">
            <ul className="conv-list">
              {data.conversations.length === 0 && <li className="inbox-empty">No chats yet</li>}
              {data.conversations.map((c) => {
                const lastMsg = c.messages[c.messages.length - 1];
                return (
                  <li key={c.id}>
                    <button type="button" className={`conv${conv?.id === c.id ? ' active' : ''}`} onClick={() => setSelected(c.id)}>
                      <div className="conv-top">
                        <strong>{c.name}</strong>
                        {c.needs_staff ? (
                          <span className="pill warn">Needs reply</span>
                        ) : c.bot_paused ? (
                          <span className="pill info">Staff</span>
                        ) : c.state === 'DONE' ? (
                          <span className="pill good">Done</span>
                        ) : (
                          <span className="pill">Bot</span>
                        )}
                      </div>
                      <div className="conv-snippet">
                        {lastMsg ? `${lastMsg.sender === 'bot' ? 'Bot: ' : lastMsg.sender === 'staff' ? 'You: ' : ''}${lastMsg.text.split('\n')[0]}` : ''}
                      </div>
                      <div className="conv-time">{timeAgo(c.last_activity, now)}</div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="thread">
              {!conv ? (
                <div className="inbox-empty">Select a chat</div>
              ) : (
                <>
                  <div className="th-head">
                    <div>
                      <div className="th-name">{conv.name}</div>
                      <div className="muted small">
                        {conv.phone || 'No phone yet'}
                        {conv.address ? ` · ${conv.address}` : ''} · {STEP_LABEL[conv.state] ?? conv.state}
                      </div>
                    </div>
                    <button type="button" className={`btn${conv.bot_paused ? '' : ' primary'}`} onClick={() => act(conv.bot_paused ? 'handback' : 'takeover', { id: conv.id })}>
                      {conv.bot_paused ? 'Hand back to bot' : 'Take over chat'}
                    </button>
                  </div>
                  <div className="th-msgs" ref={threadRef} aria-live="polite">
                    {conv.messages.map((m) => (
                      <div key={m.id} className={`tm tm-${m.sender}`}>
                        <div className="tm-from">
                          {m.sender === 'customer' ? conv.name : m.sender === 'staff' ? 'Staff' : 'Bot'} · {timeAgo(m.created_at, now)}
                        </div>
                        <div className="tm-text">{m.text}</div>
                      </div>
                    ))}
                  </div>
                  <form className="th-form" onSubmit={sendReply}>
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={conv.bot_paused ? 'Reply as staff…' : 'Replying takes over from the bot…'}
                      aria-label="Staff reply"
                      maxLength={1000}
                    />
                    <button className="btn primary" type="submit" disabled={!reply.trim()}>
                      Send
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'requests' && (
        <section className="card">
          <div className="card-head">
            <h3>Requests</h3>
            <span className="muted small">Call-backs, fitter referrals and flooring guidance from the chat</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Message</th>
                  <th>Best time</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {data.requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      No requests yet
                    </td>
                  </tr>
                )}
                {data.requests.map((r) => (
                  <tr key={r.id} className={r.status === 'closed' ? 'dim' : ''}>
                    <td>
                      <span className={`pill ${r.type === 'callback' ? 'info' : r.type === 'fitter_referral' ? 'violet' : 'good'}`}>{REQUEST_LABEL[r.type]}</span>
                    </td>
                    <td>{r.name}</td>
                    <td className="nowrap">{r.phone ? <a href={`tel:${r.phone}`}>{r.phone}</a> : '—'}</td>
                    <td className="msg-cell">{r.message || '—'}</td>
                    <td>{r.best_time || '—'}</td>
                    <td>
                      <select
                        className={`status-select ${r.status}`}
                        value={r.status}
                        aria-label={`Status for ${r.name}`}
                        onChange={(e) => act('requestStatus', { id: r.id, status: e.target.value as RequestStatus })}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="nowrap muted">{timeAgo(r.created_at, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'leads' && (
        <section className="card">
          <div className="card-head">
            <h3>Leads</h3>
            <span className="muted small">Everyone who left a phone number in the chat</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      No leads yet
                    </td>
                  </tr>
                )}
                {data.leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.name}
                      {l.address && <div className="muted small">{l.address}</div>}
                    </td>
                    <td className="nowrap">
                      <a href={`tel:${l.phone}`}>{l.phone}</a>
                    </td>
                    <td>
                      <span className={`pill ${l.status === 'Needs staff' ? 'warn' : l.status === 'Booked' ? 'good' : 'info'}`}>{l.status}</span>
                    </td>
                    <td className="nowrap muted">{timeAgo(l.created_at, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
