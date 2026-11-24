import { AGENT_URL } from '../api';
import { ChatsDashboard } from '../chatbot-admin';

const API_KEY = (import.meta.env.VITE_AGENT_API_KEY as string) || '';

export default function ChatsPage() {
  return (
    <section>
      <header className="page-head">
        <h1>Website chats</h1>
        <p className="muted">Chats from the website chatbot. Take over a chat to reply as staff, follow up requests and manage measuring slots.</p>
      </header>
      <ChatsDashboard apiBase={AGENT_URL} apiKey={API_KEY} websiteUrl="/?chat=open" />
    </section>
  );
}
