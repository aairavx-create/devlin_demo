# meta-dashboard

React + Vite UI for `../meta-agent`.

```bash
npm install
npm run dev      # http://localhost:5173 (backend must run on :4000)
```

`.env.local`: `VITE_AGENT_URL` (backend URL) and `VITE_AGENT_API_KEY` (same as the backend's `AGENT_API_KEY`).

| Screen | Route | What it shows |
|---|---|---|
| Posts & Reels | `/content` | FB posts + reels and IG media across pages, filter by page/platform/type, likes/comments/shares/saves/reach |
| Leads | `/leads` | Leads stored in Mongo, filter/search/paginate, expand for all answers, sync from Meta, CSV export |
| Ads | `/ads` | Ads per ad account with spend, impressions, reach, clicks, CTR, CPC and leads for a date range |
| Linked pages | `/pages` | Connect main account, sync pages, subscribe lead webhooks and see how to link more pages |
