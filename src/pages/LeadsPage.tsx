import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Lead, type LeadStatus } from '../api';
import { Alert, PageSelect, RequireAccount, Spinner } from '../components/ui';

// Layout and workflow follow the Lead Management app (C:\Aairavx\Lead_managment\frontend\web).

type Resp = {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  statuses: ('ALL' | LeadStatus)[];
  statusCounts: Record<string, number>;
  forms: { id: string; name?: string; count: number }[];
};
type SyncResp = { pages: { pageId: string; pageName?: string; forms: number; leads: number; error?: string }[]; retried: number };

const STATUSES: LeadStatus[] = ['NEW', 'WORKING', 'UNQUALIFIED', 'QUALIFIED', 'CLOSE', 'INVALID'];
const FOLLOW_TYPES = ['CALL', 'WHATSAPP', 'EMAIL', 'VISIT'];

// Same mapping as LeadsService.getTierByStatus in the Lead Management backend.
function tierOf(status?: string) {
  switch (status) {
    case 'QUALIFIED':
      return 'hot';
    case 'UNQUALIFIED':
      return 'warm';
    case 'CLOSE':
      return 'close';
    case 'INVALID':
      return 'invalid';
    default:
      return 'cold';
  }
}

const when = (value?: string, withTime = true) =>
  value
    ? new Date(value).toLocaleString(undefined, withTime ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { weekday: 'short', day: 'numeric', month: 'short' })
    : '-';

function sourceOf(l: Lead) {
  if (l.platform === 'ig') return { label: 'Instagram', cls: 'src-ig' };
  if (l.platform === 'fb') return { label: 'Facebook', cls: 'src-fb' };
  return { label: 'Meta', cls: '' };
}

function toLocalInput(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function downloadCsv(rows: Lead[]) {
  const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r.fields ?? {}))));
  const head = ['received', 'name', 'email', 'phone', 'status', 'tier', 'follow_up', 'page', 'form', 'campaign', 'ad', 'platform', ...keys];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.createdTime, r.fullName, r.email, r.phone, r.status, tierOf(r.status), r.followUp?.at, r.pageName, r.formName, r.campaignName, r.adName, r.platform, ...keys.map((k) => r.fields?.[k])]
      .map(esc)
      .join(','),
  );
  const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `meta-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------------- Reachout menu ----------------

function ReachoutMenu({ lead, anchor, onClose }: { lead: Lead; anchor: HTMLElement; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const digits = lead.phone?.replace(/[^\d]/g, '');

  useEffect(() => {
    const menu = ref.current!;
    const rect = anchor.getBoundingClientRect();
    const fitsBelow = rect.bottom + menu.offsetHeight + 8 <= window.innerHeight;
    setPos({
      top: fitsBelow ? rect.bottom + 4 : Math.max(8, rect.top - menu.offsetHeight - 4),
      left: Math.max(8, rect.right - menu.offsetWidth),
    });
    menu.querySelector<HTMLElement>('a')?.focus();

    const onDoc = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node) && !anchor.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      const items = [...menu.querySelectorAll<HTMLElement>('a')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'Escape') {
        onClose();
        anchor.focus();
      } else if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        items[(i + 1) % items.length].focus();
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length].focus();
      }
    };
    const close = () => onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [anchor, onClose]);

  const links: [string, string | undefined][] = [
    ['Call', lead.phone ? `tel:${lead.phone}` : undefined],
    ['WhatsApp', digits ? `https://wa.me/${digits}` : undefined],
    ['SMS', lead.phone ? `sms:${lead.phone}` : undefined],
    ['Email', lead.email ? `mailto:${lead.email}` : undefined],
  ];

  return (
    <div ref={ref} className="reach-menu" role="menu" aria-label="Reachout options" style={pos}>
      {links.map(([label, href]) =>
        href ? (
          <a key={label} role="menuitem" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" onClick={onClose}>
            {label}
          </a>
        ) : (
          <span key={label} aria-disabled="true">
            {label} (no {label === 'Email' ? 'email' : 'phone'})
          </span>
        ),
      )}
    </div>
  );
}

// ---------------- Drawer ----------------

function LeadDrawer({ lead, onClose, onSaved }: { lead: Lead; onClose: () => void; onSaved: (l: Lead) => void }) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [followAt, setFollowAt] = useState(toLocalInput(lead.followUp?.at));
  const [followType, setFollowType] = useState(lead.followUp?.type ?? 'CALL');
  const [followNotes, setFollowNotes] = useState(lead.followUp?.notes ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setStatus(lead.status);
    setFollowAt(toLocalInput(lead.followUp?.at));
    setFollowType(lead.followUp?.type ?? 'CALL');
    setFollowNotes(lead.followUp?.notes ?? '');
    setError('');
  }, [lead]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function save(body: object) {
    setBusy(true);
    setError('');
    try {
      const r = await api<{ lead: Lead }>(`/api/leads/${lead._id}`, { method: 'PATCH', body: JSON.stringify(body) });
      onSaved(r.lead);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const src = sourceOf(lead);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Lead details">
        <button ref={closeRef} className="btn close" onClick={onClose}>
          Close
        </button>
        <h2>{lead.fullName || 'Unnamed lead'}</h2>
        <div className="muted">{[lead.phone, lead.email].filter(Boolean).join(' · ') || 'No contact details'}</div>
        <div className="form-error" role="alert">
          {error || (lead.fetchStatus !== 'fetched' && `Lead details not fetched yet: ${lead.fetchError ?? lead.fetchStatus}`)}
        </div>

        <section>
          <h3>Form answers</h3>
          {Object.keys(lead.fields ?? {}).length ? (
            <dl>
              {Object.entries(lead.fields).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k.replace(/_/g, ' ')}</dt>
                  <dd>{v || '-'}</dd>
                </div>
              ))}
              {lead.consents?.map((c) => (
                <div key={c.checkbox_key} style={{ display: 'contents' }}>
                  <dt>Consent: {c.checkbox_key}</dt>
                  <dd>{c.is_checked === '1' ? 'Yes' : 'No'}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="muted small">No answers stored.</div>
          )}
        </section>

        <section>
          <h3>Source</h3>
          <dl>
            <dt>Platform</dt>
            <dd className={`src ${src.cls}`}>{src.label}</dd>
            <dt>Page</dt>
            <dd>{lead.pageName ?? lead.pageId ?? '-'}</dd>
            <dt>Form</dt>
            <dd>{lead.formName ?? lead.formId ?? '-'}</dd>
            <dt>Campaign</dt>
            <dd>{lead.campaignName ?? (lead.isOrganic ? 'Organic' : '-')}</dd>
            <dt>Ad set</dt>
            <dd>{lead.adsetName ?? '-'}</dd>
            <dt>Ad</dt>
            <dd>{lead.adName ?? lead.adId ?? '-'}</dd>
            <dt>Received</dt>
            <dd>{when(lead.createdTime)}</dd>
            <dt>Arrived via</dt>
            <dd>{lead.source === 'webhook' ? 'Webhook (instant)' : 'Sync'}</dd>
            <dt>Lead ID</dt>
            <dd className="mono">{lead.leadgenId}</dd>
          </dl>
        </section>

        <section>
          <h3>Status</h3>
          <div className="row">
            <label className="field">
              <span>Lead status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary" disabled={busy || status === lead.status} onClick={() => save({ status })}>
              Update
            </button>
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>
            Tier: <span className={`tier tier-${tierOf(lead.status)}`}>{tierOf(lead.status)}</span>
          </div>
          {lead.statusHistory?.length ? (
            <ul className="history" style={{ marginTop: 6 }}>
              {[...lead.statusHistory].reverse().map((h, i) => (
                <li key={i}>
                  {h.status} · {when(h.at)}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <h3>Follow-up</h3>
          <div className="muted small" style={{ marginBottom: 8 }}>
            Next: {lead.followUp?.at ? `${when(lead.followUp.at)} · ${lead.followUp.type}` : 'none'}
            {lead.followUp?.notes && ` · ${lead.followUp.notes}`}
          </div>
          <div className="row">
            <label className="field">
              <span>Date and time</span>
              <input type="datetime-local" value={followAt} onChange={(e) => setFollowAt(e.target.value)} />
            </label>
            <label className="field">
              <span>Type</span>
              <select value={followType} onChange={(e) => setFollowType(e.target.value)}>
                {FOLLOW_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field" style={{ marginTop: 8 }}>
            <span>Notes</span>
            <input value={followNotes} onChange={(e) => setFollowNotes(e.target.value)} />
          </label>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button
              className="btn"
              disabled={busy}
              onClick={() => {
                if (!followAt) return setError('Choose a date and time for the follow-up.');
                void save({ followUp: { at: new Date(followAt).toISOString(), type: followType, notes: followNotes } });
              }}
            >
              Schedule follow-up
            </button>
            {lead.followUp?.at && (
              <button className="btn" disabled={busy} onClick={() => save({ followUp: null })}>
                Clear
              </button>
            )}
          </div>
        </section>
      </aside>
    </>
  );
}

// ---------------- Page ----------------

function Leads() {
  const [status, setStatus] = useState<string>('ALL');
  const [pageId, setPageId] = useState('all');
  const [formId, setFormId] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openLead, setOpenLead] = useState<Lead | null>(null);
  const [menu, setMenu] = useState<{ lead: Lead; anchor: HTMLElement } | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const r = await api<Resp>('/api/leads', { query: { status, pageId, formId, search: q, page, pageSize: 25 } });
      if (id === reqId.current) setData(r);
    } catch (e: any) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [status, pageId, formId, q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function sync() {
    setSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const r = await api<SyncResp>('/api/leads/sync', { method: 'POST', body: JSON.stringify({ pageId: pageId === 'all' ? undefined : pageId }) });
      const total = r.pages.reduce((s, p) => s + p.leads, 0);
      const failed = r.pages.filter((p) => p.error);
      setNotice(
        `Fetched ${total} leads from ${r.pages.length} page(s).` +
          (r.retried ? ` Retried ${r.retried} webhook lead(s).` : '') +
          (failed.length ? ` Failed: ${failed.map((p) => `${p.pageName ?? p.pageId} (${p.error})`).join('; ')}` : ''),
      );
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  const onSaved = (updated: Lead) => {
    setData((d) => (d ? { ...d, items: d.items.map((l) => (l._id === updated._id ? { ...l, ...updated } : l)) } : d));
    setOpenLead((o) => (o && o._id === updated._id ? { ...o, ...updated } : o));
    void load(); // refresh tab counts / filtered view
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const tabs = data?.statuses ?? ['ALL', ...STATUSES];
  const now = Date.now();

  return (
    <>
      <div className="lm-toolbar">
        <div className="lm-tabs" role="tablist" aria-label="Lead status">
          {tabs.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={status === s}
              className={status === s ? 'active' : ''}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s} ({data?.statusCounts?.[s] ?? 0})
            </button>
          ))}
        </div>
        <input className="lm-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, campaign" aria-label="Search leads" />
      </div>

      <div className="lm-filters">
        <PageSelect value={pageId} onChange={(v) => { setPageId(v); setFormId(''); setPage(1); }} />
        <label className="field">
          <span>Form</span>
          <select value={formId} onChange={(e) => { setFormId(e.target.value); setPage(1); }}>
            <option value="">All forms</option>
            {data?.forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name ?? f.id} ({f.count})
              </option>
            ))}
          </select>
        </label>
        <div className="spacer" />
        <button className="btn" onClick={() => data && downloadCsv(data.items)} disabled={!data?.items.length}>
          Export CSV
        </button>
        <button className="btn btn-primary" onClick={sync} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync from Meta'}
        </button>
      </div>

      {notice && <Alert kind="success" onClose={() => setNotice(null)}>{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {loading && !data ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="table lm-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Form</th>
                <th>Campaign</th>
                <th>Source</th>
                <th>Status</th>
                <th>Tier</th>
                <th>Received</th>
                <th>Follow-up</th>
                <th className="reach">Reachout</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((l) => {
                const src = sourceOf(l);
                const overdue = l.followUp?.at && Date.parse(l.followUp.at) < now;
                return (
                  <tr
                    key={l._id}
                    tabIndex={0}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('[data-reachout]')) setOpenLead(l);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.target === e.currentTarget && setOpenLead(l)}
                  >
                    <td>
                      {l.fullName || <span className="muted">Unnamed</span>}
                      <div className="sub">{l.phone || '-'}</div>
                    </td>
                    <td>{l.email || '-'}</td>
                    <td>
                      {l.formName ?? l.formId ?? '-'}
                      <div className="sub">{l.pageName}</div>
                    </td>
                    <td>
                      {l.campaignName ?? (l.isOrganic ? 'Organic' : '-')}
                      <div className="sub">{l.adName}</div>
                    </td>
                    <td className={`src ${src.cls}`}>{src.label}</td>
                    <td>
                      <span className={`lm-badge st-${l.status}`}>{l.status}</span>
                      {l.fetchStatus !== 'fetched' && <div className="sub text-bad">{l.fetchStatus}</div>}
                    </td>
                    <td className={`tier tier-${tierOf(l.status)}`}>{tierOf(l.status)}</td>
                    <td>{when(l.createdTime)}</td>
                    <td className={overdue ? 'overdue' : ''}>
                      {l.followUp?.at ? (
                        <>
                          {when(l.followUp.at)}
                          <div className="sub">{l.followUp.type}</div>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="reach">
                      <button
                        type="button"
                        className="btn"
                        data-reachout
                        aria-haspopup="menu"
                        aria-expanded={menu?.lead._id === l._id}
                        onClick={(e) => {
                          const anchor = e.currentTarget;
                          setMenu((m) => (m?.lead._id === l._id ? null : { lead: l, anchor }));
                        }}
                      >
                        Reachout
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data && data.items.length === 0 && (
            <div className="empty" style={{ border: 0 }}>
              {data.statusCounts.ALL === 0 && !q ? 'No leads yet. Click “Sync from Meta” to pull instant-form leads.' : 'No leads match this view.'}
            </div>
          )}
        </div>
      )}

      {data && data.total > data.pageSize && (
        <div className="pager">
          <span className="muted">
            {data.total} leads · page {data.page} of {pages}
          </span>
          <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      )}

      {menu && <ReachoutMenu lead={menu.lead} anchor={menu.anchor} onClose={() => setMenu(null)} />}
      {openLead && <LeadDrawer lead={openLead} onClose={() => setOpenLead(null)} onSaved={onSaved} />}
    </>
  );
}

export default function LeadsPage() {
  return (
    <section>
      <header className="page-head">
        <h1>Meta Leads</h1>
        <p className="muted">Instant-form leads from Facebook and Instagram. Click a lead to update its status or schedule a follow-up.</p>
      </header>
      <RequireAccount>
        <Leads />
      </RequireAccount>
    </section>
  );
}
