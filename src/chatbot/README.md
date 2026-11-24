# Chat widget (copy this folder)

A self-contained React chat widget for the meta-agent chatbot: guided menu, measuring bookings with a calendar, call-back and fitter requests, and staff takeover.

## Add it to another React project

1. Copy this whole `chatbot/` folder into the project, for example `src/chatbot/`.
2. Install the one dependency: `npm install react-day-picker@9.14.0`
3. Render it once, near the root of the page or layout:

```tsx
import { ChatWidget, openChat } from './chatbot';

<ChatWidget
  apiBase="http://localhost:4000"          // meta-agent backend
  businessName="Devlin Carpets & Flooring"
  accentColor="#2f5d50"                    // optional brand colour
/>

// Anywhere else on the page:
<button onClick={() => openChat('measure')}>Request to Measure</button>
```

4. On the backend, add the site's origin to `CORS_ORIGINS` in `meta-agent/.env.local` (comma-separated), for example `http://localhost:5173,https://www.example.co.uk`.

Links also work: `?chat=open` opens the chat and `?chat=measure` opens it at Request to Measure.

## Files

| File | What it does |
|---|---|
| `ChatWidget.tsx` | Launcher, panel, messages, options, polling. Props: `apiBase`, `businessName`, `accentColor`, `intro`, `storageKey` |
| `ChatCalendar.tsx` | Calendar for "Book directly" (only days with free slots) |
| `DetailsForm.tsx` | One form for name, phone and address |
| `chatbot.css` | Styles; every class starts with `cb-` so they don't clash with the site |
| `types.ts` | API types (match `meta-agent/chatbot/types.ts`) |

The bot's wording, slot times and opening days live on the server in `meta-agent/chatbot/config.ts`.
