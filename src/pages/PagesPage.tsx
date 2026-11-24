import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, loginUrl, type AccessRequest, type Page } from '../api';
import { useApp } from '../AppContext';
import { Alert, Empty, Spinner, fmtDate, fmtNum } from '../components/ui';

type Notify = (kind: 'success' | 'error', m: string) => void;

const TASKS: { id: string; label: string; hint: string }[] = [
  { id: 'ADVERTISE', label: 'Advertise', hint: 'Run ads, read leads' },
  { id: 'ANALYZE', label: 'Analyze', hint: 'View insights' },
  { id: 'CREATE_CONTENT', label: 'Create content', hint: 'Publish posts' },
  { id: 'MODERATE', label: 'Moderate', hint: 'Reply to comments and messages' },
  { id: 'MANAGE', label: 'Full control', hint: 'Everything' },
];

const REL_LABEL: Record<Page['relationship'], string> = { personal: 'Your page', owned: 'Business-owned', client: 'Client page' };

function MainAccountCard({ onMessage }: { onMessage: Notify }) {
  const { account, reload, setPages } = useApp();
  const [busy, setBusy] = useState<string | null>(null);

  if (!account) {
    return (
      <div className="card connect-card">
        <h2>Connect your main Facebook account</h2>
        <p className="muted">
          Log in with the Facebook profile that manages your Pages and Business portfolio. Its long-lived token and all page tokens are encrypted and stored in MongoDB.
        </p>
        <a className="btn btn-primary" href={loginUrl}>
          Continue with Facebook
        </a>
      </div>
    );
  }

  const expiresIn = account.tokenExpiresAt ? Math.round((Date.parse(account.tokenExpiresAt) - Date.now()) / 86400000) : null;

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (e: any) {
      onMessage('error', e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card account-card">
      <div className="account-main">
        {account.pictureUrl && <img src={account.pictureUrl} alt="" className="avatar-lg" />}
        <div>
          <div className="muted small">Main account</div>
          <h2>{account.name}</h2>
          <div className="muted small">
            {account.email ?? `FB user ${account.fbUserId}`} · {account.grantedScopes?.length ?? 0} permissions granted
          </div>
          <div className={`small ${expiresIn != null && expiresIn < 10 ? 'text-bad' : 'muted'}`}>
            {expiresIn == null ? 'Token does not expire' : expiresIn < 0 ? 'Token expired, reconnect' : `Token expires in ${expiresIn} days`}
            {account.lastPagesSyncAt && ` · pages synced ${fmtDate(account.lastPagesSyncAt)}`}
          </div>
        </div>
      </div>

      <div className="account-actions">
        <label className="field">
          <span>Business portfolio</span>
          <select
            value={account.businessId ?? ''}
            disabled={!account.businesses?.length || busy !== null}
            onChange={(e) =>
              run('business', async () => {
                await api('/api/account', { method: 'PATCH', body: JSON.stringify({ businessId: e.target.value }) });
                await reload();
              })
            }
          >
            {!account.businesses?.length && <option value="">None found</option>}
            {account.businesses?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <div className="btn-row">
          <button
            className="btn btn-primary"
            disabled={busy !== null}
            onClick={() =>
              run('sync', async () => {
                const r = await api<{ synced: number; warnings: string[]; pages: Page[] }>('/api/pages/sync', { method: 'POST' });
                setPages(r.pages);
                await reload();
                onMessage('success', `Synced ${r.synced} pages.${r.warnings.length ? ' ' + r.warnings.join(' ') : ''}`);
              })
            }
          >
            {busy === 'sync' ? 'Syncing…' : 'Sync pages'}
          </button>
          <a className="btn" href={loginUrl}>
            Reconnect
          </a>
          <button
            className="btn btn-danger"
            disabled={busy !== null}
            onClick={() => {
              if (!confirm('Disconnect this account? Stored account and page tokens will be deleted. Leads stay in the database.')) return;
              void run('disconnect', async () => {
                await api('/api/account', { method: 'DELETE' });
                await reload();
              });
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

function PagesTable({ onMessage }: { onMessage: Notify }) {
  const { pages, reload } = useApp();
  const [busy, setBusy] = useState<string | null>(null);

  if (pages.length === 0) return <Empty title="No linked pages yet">Click “Sync pages”, or request access to a page below.</Empty>;

  async function subscribe(p: Page) {
    setBusy(p.pageId);
    try {
      await api(`/api/pages/${p.pageId}/subscribe`, { method: 'POST' });
      onMessage('success', `${p.name} now sends new leads to the agent webhook.`);
      await reload();
    } catch (e: any) {
      onMessage('error', e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Link</th>
            <th>Instagram</th>
            <th className="num">Followers</th>
            <th>Token</th>
            <th>Lead webhook</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.pageId} className={p.active ? '' : 'inactive'}>
              <td>
                <div className="ad-cell">
                  {p.pictureUrl ? <img src={p.pictureUrl} alt="" /> : <div className="ad-thumb-empty" />}
                  <div>
                    <a className="strong" href={p.link ?? `https://facebook.com/${p.pageId}`} target="_blank" rel="noreferrer">
                      {p.name}
                    </a>
                    <div className="muted small">
                      {p.category} · <span className="mono">{p.pageId}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span className={`pill pill-${p.relationship}`}>{REL_LABEL[p.relationship]}</span>
                {!p.active && <span className="pill pill-bad">no longer visible</span>}
              </td>
              <td>{p.instagram?.username ? `@${p.instagram.username}` : <span className="muted">Not linked</span>}</td>
              <td className="num">{fmtNum(p.fanCount)}</td>
              <td>{p.hasToken ? <span className="pill pill-good">stored</span> : <span className="pill pill-warn">missing</span>}</td>
              <td>
                {p.leadgenSubscribed ? (
                  <span className="pill pill-good">subscribed</span>
                ) : (
                  <button className="btn btn-sm" disabled={!p.hasToken || busy === p.pageId} onClick={() => subscribe(p)}>
                    {busy === p.pageId ? '…' : 'Subscribe'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccessRequests({ onMessage }: { onMessage: Notify }) {
  const { account, reload } = useApp();
  const [page, setPage] = useState('');
  const [tasks, setTasks] = useState<string[]>(['ADVERTISE', 'ANALYZE']);
  const [note, setNote] = useState('');
  const [requests, setRequests] = useState<AccessRequest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const businessName = account?.businesses?.find((b) => b.id === account.businessId)?.name;

  async function load(refresh = false) {
    if (refresh) setChecking(true);
    try {
      const r = await api<{ requests: AccessRequest[] }>('/api/pages/requests', { query: { refresh: refresh ? 1 : undefined } });
      setRequests(r.requests);
      if (refresh) await reload();
    } catch (e: any) {
      onMessage('error', e.message);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api<{ request: AccessRequest }>('/api/pages/requests', { method: 'POST', body: JSON.stringify({ page, tasks, note: note || undefined }) });
      onMessage(
        'success',
        r.request.status === 'approved'
          ? 'Access granted straight away. The page is now linked.'
          : 'Request sent. The page admin accepts it in Meta Business Suite → Settings → Requests. Then click “Check status”.',
      );
      setPage('');
      setNote('');
      await load();
    } catch (e: any) {
      onMessage('error', e.message);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const toggle = (id: string) => setTasks((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  return (
    <div className="two-col">
      <form className="card" onSubmit={submit}>
        <h3>Request access to a page</h3>
        <p className="muted small">
          Sends a partner request from your Business portfolio{businessName ? ` (${businessName})` : ''} to the page. When its admin accepts, the page links to your main
          account and its posts, reels, ads and leads appear here.
        </p>
        {!account?.businessId && (
          <Alert kind="warn">
            No Business portfolio found. Create one at business.facebook.com, make sure the login configuration includes <strong>business_management</strong>, then click
            Reconnect.
          </Alert>
        )}
        <label className="field block">
          <span>Page ID or Facebook URL</span>
          <input value={page} onChange={(e) => setPage(e.target.value)} placeholder="1234567890 or https://facebook.com/yourpage" required />
        </label>
        <fieldset className="tasks">
          <legend>Permissions to ask for</legend>
          {TASKS.map((t) => (
            <label key={t.id} className="check">
              <input type="checkbox" checked={tasks.includes(t.id)} onChange={() => toggle(t.id)} />
              <span>
                {t.label} <span className="muted small">– {t.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <label className="field block">
          <span>Internal note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Client: Smith Carpets" />
        </label>
        <button className="btn btn-primary" disabled={busy || !page || tasks.length === 0 || !account?.businessId}>
          {busy ? 'Sending…' : 'Send request'}
        </button>
      </form>

      <div className="card">
        <div className="card-head">
          <h3>Requests</h3>
          <button className="btn btn-sm" onClick={() => load(true)} disabled={checking}>
            {checking ? 'Checking…' : 'Check status'}
          </button>
        </div>
        {!requests ? (
          <Spinner />
        ) : requests.length === 0 ? (
          <p className="muted">No requests yet.</p>
        ) : (
          <ul className="req-list">
            {requests.map((r) => (
              <li key={r._id}>
                <div>
                  <div className="strong">{r.pageName ?? r.pageId}</div>
                  <div className="muted small">
                    {r.permittedTasks.join(', ')} · {fmtDate(r.createdAt)}
                    {r.note && ` · ${r.note}`}
                  </div>
                  {r.error && <div className="small text-bad">{r.error}</div>}
                </div>
                <div className="req-right">
                  <span className={`pill ${r.status === 'approved' ? 'pill-good' : r.status === 'failed' ? 'pill-bad' : 'pill-warn'}`}>
                    {r.status === 'pending' ? 'waiting for page' : r.status}
                  </span>
                  <button
                    className="btn-link"
                    aria-label="Remove"
                    title="Remove from this list"
                    onClick={async () => {
                      await api(`/api/pages/requests/${r._id}`, { method: 'DELETE' });
                      await load();
                    }}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function PagesPage() {
  const { account, loading, error } = useApp();
  const [params, setParams] = useSearchParams();
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (params.get('connected')) setMsg({ kind: 'success', text: `Facebook connected. ${params.get('pages') ?? 0} pages linked.` });
    else if (params.get('error')) setMsg({ kind: 'error', text: params.get('error')! });
    if (params.toString()) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMessage: Notify = (kind, text) => setMsg({ kind, text });

  return (
    <section>
      <header className="page-head">
        <h1>Linked pages</h1>
        <p className="muted">Your main account and every Facebook Page linked to it. Request access to other pages here.</p>
      </header>
      {msg && (
        <Alert kind={msg.kind} onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}
      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert>Can't reach the agent backend: {error}</Alert>
      ) : (
        <>
          <MainAccountCard onMessage={onMessage} />
          {account && (
            <>
              <h2 className="section-title">Pages</h2>
              <PagesTable onMessage={onMessage} />
              <h2 className="section-title">Link another page</h2>
              <AccessRequests onMessage={onMessage} />
            </>
          )}
        </>
      )}
    </section>
  );
}
