
/**
 * Admin calendar for measuring slots (react-day-picker).
 * Click a day to manage it; click a second day to select a range; "Whole week" selects Mon to Sun.
 * Then block or reopen the selected days. A single day also lists its time slots to block one by one.
 */
import { useMemo, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { enGB } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import type { SlotCalendarData } from './types';
import './chatbot-admin.css';

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const label = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function datesBetween(from: Date, to: Date): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(toYmd(d));
  return out;
}

type Act = (action: string, extra?: Record<string, unknown>) => Promise<void>;

export default function SlotCalendar({ data, act }: Readonly<{ data: SlotCalendarData; act: Act }>) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [busy, setBusy] = useState(false);

  const blocked = useMemo(() => new Set(data.blockedDates), [data.blockedDates]);
  const firstMonth = fromYmd(data.today);
  const lastMonth = new Date(firstMonth.getFullYear() + 1, firstMonth.getMonth(), 1);
  const isClosed = (d: Date) => data.closedWeekdays.includes(d.getDay());
  const dayOf = (d: Date) => data.days[toYmd(d)];

  // Selected open days (closed weekdays such as Sunday are skipped).
  const from = range?.from;
  const to = range?.to ?? range?.from;
  const selected = from && to ? datesBetween(from, to).filter(d => !isClosed(fromYmd(d)) && d > data.today) : [];
  const single = selected.length === 1 ? selected[0] : null;
  const allBlocked = selected.length > 0 && selected.every(d => blocked.has(d));
  const bookingsIn = selected.flatMap(d => data.days[d]?.slots.flatMap(s => s.bookedBy) ?? []);

  async function run(action: string, extra: Record<string, unknown>) {
    setBusy(true);
    try {
      await act(action, extra);
    } finally {
      setBusy(false);
    }
  }

  function blockSelected() {
    const blocking = !allBlocked;
    if (
      blocking &&
      bookingsIn.length &&
      !confirm(
        `${bookingsIn.length} booking(s) fall on these days and will stay booked:\n\n${bookingsIn.join('\n')}\n\nContact the customers or cancel them under Measurement bookings. Block the days anyway?`
      )
    )
      return;
    void run('blockDays', { dates: selected, blocked: blocking });
  }

  function selectWeek() {
    if (!from) return;
    const monday = addDays(from, -((from.getDay() + 6) % 7));
    setRange({ from: monday, to: addDays(monday, 6) });
  }

  const singleDay = single ? data.days[single] : undefined;
  const selectionTitle = !from
    ? ''
    : single || (to && toYmd(from) === toYmd(to))
      ? label(from)
      : `${label(from)} to ${label(to!)} · ${selected.length} open day${selected.length === 1 ? '' : 's'}`;

  return (
    <div className="slot-cal">
      <div className="adm-calendar">
        <DayPicker
          mode="range"
          locale={enGB}
          weekStartsOn={1}
          numberOfMonths={2}
          startMonth={firstMonth}
          endMonth={lastMonth}
          selected={range}
          onSelect={setRange}
          disabled={d => toYmd(d) <= data.today || isClosed(d)}
          modifiers={{
            dayBlocked: d => blocked.has(toYmd(d)),
            partBlocked: d => !blocked.has(toYmd(d)) && !!dayOf(d)?.slots.some(s => s.state === 'blocked'),
            hasBooking: d => !!dayOf(d)?.slots.some(s => s.state === 'booked'),
            full: d => !blocked.has(toYmd(d)) && !!dayOf(d) && dayOf(d).slots.every(s => s.state === 'booked')
          }}
          modifiersClassNames={{ dayBlocked: 'd-blocked', partBlocked: 'd-part', hasBooking: 'd-booked', full: 'd-full' }}
        />
        <div className="cal-legend" aria-hidden="true">
          <span><i className="sw sw-open" /> Open</span>
          <span><i className="sw sw-booked" /> Has bookings</span>
          <span><i className="sw sw-full" /> Fully booked</span>
          <span><i className="sw sw-part" /> Some slots blocked</span>
          <span><i className="sw sw-blocked" /> Day blocked</span>
        </div>
      </div>

      <div className="slot-panel">
        {!from ? (
          <>
            <h3>Manage availability</h3>
            <p className="muted small">
              Click a day to manage it, or click a start and an end day to select a range. Then block it (holiday, staff off) or reopen it.
            </p>
            <p className="muted small">
              Customers can book up to <strong>{label(fromYmd(data.bookableUntil))}</strong>. Days further ahead can be blocked now and stay closed when they open for booking.
            </p>
          </>
        ) : (
          <>
            <h3>{selectionTitle}</h3>
            {selected.length === 0 ? (
              <p className="muted small">No open days in this selection.</p>
            ) : (
              <div className="panel-actions">
                <button type="button" className={`btn ${allBlocked ? 'primary' : 'danger'}`} disabled={busy} onClick={blockSelected}>
                  {allBlocked ? `Reopen ${selected.length > 1 ? `${selected.length} days` : 'day'}` : `Block ${selected.length > 1 ? `${selected.length} days` : 'whole day'}`}
                </button>
                <button type="button" className="btn" onClick={selectWeek} disabled={busy}>
                  Whole week
                </button>
                <button type="button" className="btn ghost" onClick={() => setRange(undefined)}>
                  Clear
                </button>
              </div>
            )}

            {bookingsIn.length > 0 && (
              <div className="panel-note warn">
                <strong>{bookingsIn.length} booking{bookingsIn.length === 1 ? '' : 's'} in this selection:</strong>
                <ul>{bookingsIn.map(b => <li key={b}>{b}</li>)}</ul>
              </div>
            )}

            {single && singleDay && (
              <div className="day-slots">
                <h4>Time slots</h4>
                {blocked.has(single) && <p className="muted small">The whole day is blocked. Reopen it to manage single slots.</p>}
                <ul>
                  {singleDay.slots.map(s => (
                    <li key={s.id}>
                      <span className="slot-time">{s.time}</span>
                      {s.state === 'booked' ? (
                        <span className="pill info" title={s.bookedBy.join(', ')}>Booked: {s.bookedBy.join(', ')}</span>
                      ) : (
                        <button
                          type="button"
                          className={`slot ${s.state}`}
                          disabled={busy || blocked.has(single)}
                          onClick={() => void run('toggleSlot', { id: s.id })}
                          aria-label={`${s.state === 'blocked' ? 'Reopen' : 'Block'} ${s.time}`}
                        >
                          {s.state === 'blocked' ? 'Blocked · reopen' : 'Free · block'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {single && !singleDay && (
              <p className="muted small">This day isn&apos;t open for booking yet. Blocking it now keeps it closed later.</p>
            )}
          </>
        )}

        {data.blockedDates.length > 0 && (
          <div className="blocked-list">
            <h4>Blocked days</h4>
            <div className="chips">
              {data.blockedDates.map(d => (
                <span key={d} className="chip">
                  {label(fromYmd(d))}
                  <button
                    type="button"
                    aria-label={`Reopen ${label(fromYmd(d))}`}
                    title="Reopen"
                    disabled={busy}
                    onClick={() => void run('blockDays', { dates: [d], blocked: false })}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
