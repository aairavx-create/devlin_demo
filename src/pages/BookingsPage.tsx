import { AGENT_URL } from '../api';
import { BookingsDashboard } from '../chatbot-admin';

const API_KEY = (import.meta.env.VITE_AGENT_API_KEY as string) || '';

export default function BookingsPage() {
  return (
    <section>
      <header className="page-head">
        <h1>Bookings & slots</h1>
        <p className="muted">Measuring visits booked through the website chatbot or by staff. Book, reschedule or cancel visits, and open or block measuring slots.</p>
      </header>
      <BookingsDashboard apiBase={AGENT_URL} apiKey={API_KEY} />
    </section>
  );
}
