/**
 * Measuring bookings and slots: upcoming/past/cancelled visits, book a visit for a customer,
 * reschedule or cancel, and the slot calendar (block days, weeks, ranges or single slots).
 *
 *   <BookingsDashboard apiBase="http://localhost:4000" apiKey="..." />
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import SlotCalendar from './SlotCalendar';
import type { AdminData, SlotCalendarData } from './types';
import { useAdminData, type Act } from './useAdminData';
import './chatbot-admin.css';

type Booking = AdminData['bookings'][number];
type View = 'upcoming' | 'today' | 'past' | 'cancelled' | 'all';

const pad = (n: number) => String(n).padStart(2, '0');
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Days that still have a free slot (not blocked), with those free slots. */
function freeDays(cal: SlotCalendarData) {
  const blocked = new Set(cal.blockedDates);
  return Object.entries(cal.days)
    .filter(([date]) => !blocked.has(date))
    .map(([date, day]) => ({ date, label: day.label, slots: day.slots.filter((s) => s.state === 'free') }))
    .filter((d) => d.slots.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Day + time selects, showing only free slots. */
function SlotPicker({ cal, value, onChange }: Readonly<{ cal: SlotCalendarData; value: string; onChange: (slotId: string) => void }>) {
  const days = useMemo(() => freeDays(cal), [cal]);
  const [date, setDate] = useState(() => days.find((d) => d.slots.some((s) => s.id === value))?.date ?? days[0]?.date ?? '');
  const day = days.find((d) => d.date === date);

  useEffect(() => {
    // Keep a valid time selected when the day changes or a slot gets taken.
    if (day && !day.slots.some((s) => s.id === value)) onChange(day.slots[0]?.id ?? '');
  }, [day, value, onChange]);

  if (!days.length) return <p className="muted small">No free measuring slots in the booking window. Reopen days under Measuring slots.</p>;

  return (
    <div className="row">
      <label className="field">
        <span>Day</span>
        <select value={date} onChange={(e) => setDate(e.target.value)}>
          {days.map((d) => (
            <option key={d.date} value={d.date}>
              {d.label} ({d.slots.length} free)
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Time</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {day?.slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.time}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Modal({ title, onClose, children }: Readonly<{ title: string; onClose: () => void; children: React.ReactNode }>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="ca-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ca-modal card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="card-head">
          <h3>{title}</h3>
          <button type="button" className="btn-link" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NewBooking({ cal, act, onDone }: Readonly<{ cal: SlotCalendarData; act: Act; onDone: (ref: string) => void }>) {
  const [slotId, setSlotId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await act('createBooking', { slotId, name, phone, address });
    setBusy(false);
    if (err) setError(err);
    else onDone(name);
  }

  return (
    <form onSubmit={submit} className="ca-form">
      <SlotPicker cal={cal} value={slotId} onChange={setSlotId} />
      <label className="field">
        <span>Customer name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="off" />
      </label>
      <label className="field">
        <span>Phone number</span>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900123" maxLength={30} required />
      </label>
      <label className="field">
        <span>Full address, including postcode</span>
        <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} required />
      </label>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="btn-row">
        <button className="btn primary" type="submit" disabled={busy || !slotId}>
          {busy ? 'Booking…' : 'Book visit'}
        </button>
      </div>
    </form>
  );
}

function Reschedule({ booking, cal, act, onDone }: Readonly<{ booking: Booking; cal: SlotCalendarData; act: Act; onDone: () => void }>) {
  const [slotId, setSlotId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await act('rescheduleBooking', { id: booking.id, slotId });
    setBusy(false);
    if (err) setError(err);
    else onDone();
  }

  return (
    <form onSubmit={submit} className="ca-form">
      <p className="muted">
        {booking.name} · currently <strong>{booking.when}</strong>
      </p>
      <SlotPicker cal={cal} value={slotId} onChange={setSlotId} />
      {error && <div className="alert alert-error">{error}</div>}
      <div className="btn-row">
        <button className="btn primary" type="submit" disabled={busy || !slotId}>
          {busy ? 'Saving…' : 'Move booking'}
        </button>
      </div>
    </form>
  );
}

export default function BookingsDashboard({ apiBase, apiKey }: Readonly<{ apiBase: string; apiKey: string }>) {
  const { data, failed, act } = useAdminData(apiBase, apiKey, 5000);
  const [view, setView] = useState<View>('upcoming');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ type: 'new' } | { type: 'move'; booking: Booking } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) {
    return <div className="ca">{failed ? <div className="alert alert-error">{failed}</div> : <div className="spinner-row"><span className="spinner" /> Loading…</div>}</div>;
  }

  const today = data.calendar.today || todayLocal();
  const weekEnd = (() => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();
  const confirmed = data.bookings.filter((b) => b.status === 'confirmed');
  const upcoming = confirmed.filter((b) => b.date >= today);
  const freeNextWeek = freeDays(data.calendar)
    .filter((d) => d.date <= weekEnd)
    .reduce((n, d) => n + d.slots.length, 0);

  const counts: Record<View, number> = {
    upcoming: upcoming.length,
    today: confirmed.filter((b) => b.date === today).length,
    past: confirmed.filter((b) => b.date < today).length,
    cancelled: data.bookings.filter((b) => b.status === 'cancelled').length,
    all: data.bookings.length,
  };
  const q = search.trim().toLowerCase();
  const rows = data.bookings
    .filter((b) => {
      if (view === 'upcoming') return b.status === 'confirmed' && b.date >= today;
      if (view === 'today') return b.status === 'confirmed' && b.date === today;
      if (view === 'past') return b.status === 'confirmed' && b.date < today;
      if (view === 'cancelled') return b.status === 'cancelled';
      return true;
    })
    .filter((b) => !q || [b.id, b.name, b.phone, b.address].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (view === 'past' ? b.sortKey.localeCompare(a.sortKey) : a.sortKey.localeCompare(b.sortKey)));

  async function cancel(b: Booking) {
    if (!confirm(`Cancel booking ${b.id} for ${b.name}? The slot becomes free again.`)) return;
    const err = await act('cancelBooking', { id: b.id });
    if (err) setError(err);
    else setNotice(`Booking ${b.id} cancelled.`);
  }

  const views: [View, string][] = [
    ['upcoming', 'Upcoming'],
    ['today', 'Today'],
    ['past', 'Past'],
    ['cancelled', 'Cancelled'],
    ['all', 'All'],
  ];

  return (
    <div className="ca">
      {failed && <div className="alert alert-warn">{failed} Retrying…</div>}
      {notice && (
        <div className="alert alert-success">
          {notice}
          <button className="btn-link" onClick={() => setNotice(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          {error}
          <button className="btn-link" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <div className="kpis">
        <div className="kpi">
          <span>Upcoming visits</span>
          <strong>{upcoming.length}</strong>
        </div>
        <div className="kpi">
          <span>Next 7 days</span>
          <strong>{upcoming.filter((b) => b.date <= weekEnd).length}</strong>
        </div>
        <div className="kpi">
          <span>Free slots next 7 days</span>
          <strong>{freeNextWeek}</strong>
        </div>
        <div className="kpi">
          <span>Blocked days</span>
          <strong>{data.calendar.blockedDates.length}</strong>
        </div>
      </div>

      <section className="card">
        <div className="lm-toolbar">
          <div className="lm-tabs" role="tablist" aria-label="Bookings view">
            {views.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={view === id} className={view === id ? 'active' : ''} onClick={() => setView(id)}>
                {label} ({counts[id]})
              </button>
            ))}
          </div>
          <input className="lm-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ref, name, phone, address" aria-label="Search bookings" />
          <button className="btn primary" type="button" onClick={() => setModal({ type: 'new' })}>
            + Book a visit
          </button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Visit</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Booked via</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No bookings in this view
                  </td>
                </tr>
              )}
              {rows.map((b) => (
                <tr key={b.id} className={b.status === 'cancelled' ? 'dim' : ''}>
                  <td className="nowrap">
                    <strong>{b.id}</strong>
                  </td>
                  <td className="nowrap">
                    {b.when}
                    {b.date === today && b.status === 'confirmed' && <span className="pill warn" style={{ marginLeft: 6 }}>Today</span>}
                  </td>
                  <td>
                    {b.name}
                    <div className="muted small nowrap">{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : '—'}</div>
                  </td>
                  <td className="msg-cell">{b.address}</td>
                  <td>
                    <span className={`pill ${b.source === 'staff' ? 'violet' : 'info'}`}>{b.source === 'staff' ? 'Staff' : 'Chatbot'}</span>
                  </td>
                  <td>
                    <span className={`pill ${b.status === 'confirmed' ? (b.date < today ? '' : 'good') : ''}`}>{b.status === 'confirmed' ? (b.date < today ? 'completed' : 'confirmed') : 'cancelled'}</span>
                  </td>
                  <td className="nowrap">
                    {b.status === 'confirmed' && b.date >= today && (
                      <div className="btn-row">
                        <button type="button" className="btn small" onClick={() => setModal({ type: 'move', booking: b })}>
                          Reschedule
                        </button>
                        <button type="button" className="btn small" onClick={() => cancel(b)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Measuring slots</h3>
          <span className="muted small">Block a day, a week or any range (holidays, staff off), or single time slots</span>
        </div>
        <SlotCalendar
          data={data.calendar}
          act={async (action, extra) => {
            const err = await act(action, extra);
            if (err) setError(err);
          }}
        />
      </section>

      {modal?.type === 'new' && (
        <Modal title="Book a measuring visit" onClose={() => setModal(null)}>
          <NewBooking
            cal={data.calendar}
            act={act}
            onDone={(name) => {
              setModal(null);
              setView('upcoming');
              setNotice(`Visit booked for ${name}.`);
            }}
          />
        </Modal>
      )}
      {modal?.type === 'move' && (
        <Modal title={`Reschedule ${modal.booking.id}`} onClose={() => setModal(null)}>
          <Reschedule
            booking={modal.booking}
            cal={data.calendar}
            act={act}
            onDone={() => {
              setNotice(`Booking ${modal.booking.id} moved.`);
              setModal(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
