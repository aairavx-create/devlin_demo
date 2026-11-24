/** Loads the chatbot dashboard data (polling) and runs staff actions. Shared by the chats and bookings pages. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminData } from './types';

export type Act = (action: string, extra?: Record<string, unknown>) => Promise<string | null>;

export function useAdminData(apiBase: string, apiKey: string, intervalMs = 3000) {
  const endpoint = `${apiBase.replace(/\/$/, '')}/api/chatbot/admin`;
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'x-api-key': apiKey }), [apiKey]);
  const [data, setData] = useState<AdminData | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized: check the API key.' : `Request failed (${res.status})`);
      const next: AdminData = await res.json();
      setData((prev) => (prev && prev.rev === next.rev ? prev : next));
      setFailed(null);
    } catch (e: any) {
      setFailed(e.message === 'Failed to fetch' ? 'Could not reach the agent backend.' : e.message);
    }
    setNow(Date.now());
  }, [endpoint, headers]);

  // Poll for changes. Production: a WebSocket or server-sent events.
  useEffect(() => {
    void load();
    const timer = setInterval(load, intervalMs);
    return () => clearInterval(timer);
  }, [load, intervalMs]);

  /** Runs a staff action. Resolves to an error message, or null when it worked. */
  const act: Act = useCallback(
    async (action, extra = {}) => {
      try {
        const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify({ action, ...extra }) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return body.error || `Request failed (${res.status})`;
        setData(body);
        return null;
      } catch {
        return 'Could not reach the agent backend.';
      }
    },
    [endpoint, headers],
  );

  return { data, failed, now, act, reload: load };
}

export function timeAgo(iso: string, now: number): string {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
