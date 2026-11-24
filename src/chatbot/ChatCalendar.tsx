/**
 * Calendar shown in the chat for "Book directly" (react-day-picker).
 * Only days that still have a free measuring slot can be picked; the bot sends those days
 * as options, so the server stays in charge of availability.
 */
import { DayPicker } from 'react-day-picker';
import { enGB } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import type { Option } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ChatCalendar({ options, onPick, busy }: Readonly<{ options: Option[]; onPick: (option: Option) => void; busy: boolean }>) {
  const byDate = new Map(options.filter((o) => o.id.startsWith('date_')).map((o) => [o.id.slice(5), o]));
  const dates = Array.from(byDate.keys()).sort();
  if (!dates.length) return null;

  const first = fromYmd(dates[0]);
  const last = fromYmd(dates[dates.length - 1]);

  return (
    <div className="cb-calendar">
      <DayPicker
        mode="single"
        locale={enGB}
        weekStartsOn={1}
        defaultMonth={first}
        startMonth={first}
        endMonth={last}
        disabled={(day) => busy || !byDate.has(toYmd(day))}
        modifiers={{ available: (day) => byDate.has(toYmd(day)) }}
        modifiersClassNames={{ available: 'cb-day-available' }}
        onSelect={(day) => {
          const option = day && byDate.get(toYmd(day));
          if (option) onPick(option);
        }}
        footer={<p className="cb-cal-note">Highlighted days have free measuring slots.</p>}
      />
    </div>
  );
}
