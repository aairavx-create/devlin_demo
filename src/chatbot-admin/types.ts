/** What GET /api/chatbot/admin returns. Must match meta-agent/chatbot/admin.ts. */
export type Sender = 'customer' | 'bot' | 'staff';
export type RequestType = 'callback' | 'fitter_referral' | 'flooring_guidance';
export type RequestStatus = 'new' | 'contacted' | 'closed';

export interface SlotCalendarData {
  today: string;
  bookableUntil: string;
  closedWeekdays: number[];
  blockedDates: string[];
  days: Record<string, { label: string; slots: { id: string; time: string; state: 'free' | 'blocked' | 'booked'; bookedBy: string[] }[] }>;
}

export interface AdminData {
  rev: number;
  kpis: { chats: number; leads: number; bookings: number; openRequests: number; waiting: number };
  conversations: {
    id: string;
    name: string;
    phone: string;
    address: string;
    state: string;
    bot_paused: boolean;
    needs_staff: boolean;
    last_activity: string;
    messages: { id: string; sender: Sender; text: string; created_at: string }[];
  }[];
  leads: { id: string; name: string; phone: string; address: string; status: 'Needs staff' | 'Booked' | 'Request' | 'New lead'; created_at: string }[];
  bookings: {
    id: string;
    name: string;
    phone: string;
    address: string;
    when: string;
    sortKey: string;
    slotId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    source: 'chat' | 'staff';
    status: 'confirmed' | 'cancelled';
    created_at: string;
  }[];
  requests: { id: string; type: RequestType; name: string; phone: string; message: string; best_time: string; status: RequestStatus; created_at: string }[];
  calendar: SlotCalendarData;
}
