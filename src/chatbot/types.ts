/** Shapes the chat API returns. Must match meta-agent/chatbot/types.ts. */
export type Sender = 'customer' | 'bot' | 'staff';

export interface Option {
  id: string;
  label: string;
}

export interface ContactDetails {
  name: string;
  phone: string;
  address: string;
}

/** Extra UI shown under a bot message (instead of plain buttons). */
export type MessageUi =
  | { type: 'calendar' }
  | { type: 'contact_form'; prefill?: Partial<ContactDetails>; errors?: Partial<Record<keyof ContactDetails, string>> };

export interface PublicThread {
  rev: number;
  conversation: { state: string; bot_paused: boolean } | null;
  messages: { id: string; sender: Sender; text: string; options: Option[]; ui?: MessageUi }[];
}

export type ChatEntry = 'measure';
