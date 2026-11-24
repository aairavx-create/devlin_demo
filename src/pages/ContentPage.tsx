import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type ContentItem } from '../api';
import { Alert, Empty, PageSelect, RequireAccount, Spinner, fmtDate, fmtNum } from '../components/ui';

type Resp = { items: ContentItem[]; errors: { pageId: string; source: string; error: string }[]; next: string | null };

function ContentCard({ item }: { item: ContentItem }) {
  const isVideo = item.type === 'reel' || item.type === 'video';
  return (
    <article className="card content-card">
      <a href={item.permalink} target="_blank" rel="noreferrer" className="thumb">
        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" loading="lazy" /> : <div className="thumb-empty">No preview</div>}
        <span className={`badge badge-${item.platform}`}>{item.platform === 'facebook' ? 'Facebook' : 'Instagram'}</span>
        <span className="badge badge-type">{item.type}</span>
        {isVideo && item.durationSec ? <span className="badge badge-dur">{Math.round(item.durationSec)}s</span> : null}
      </a>
      <div className="content-body">
        <div className="muted small">
          {item.account ? `@${item.account}` : item.pageName} · {fmtDate(item.createdAt)}
        </div>
        <p className="caption">{item.caption || <span className="muted">No caption</span>}</p>
        <div className="stats">
          <span title="Likes / reactions">♥ {fmtNum(item.likes)}</span>
          <span title="Comments">💬 {fmtNum(item.comments)}</span>
          <span title="Shares">↗ {fmtNum(item.shares)}</span>
          {item.saves != null && <span title="Saves">🔖 {fmtNum(item.saves)}</span>}
          {item.reach != null && <span title="Reach">👁 {fmtNum(item.reach)}</span>}
        </div>
      </div>
    </article>
  );
}

function Content() {
  const [pageId, setPageId] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [type, setType] = useState('all');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Resp['errors']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(
    async (cursor?: string) => {
      const id = ++reqId.current;
      setLoading(true);
      setError(null);
      try {
        const r = await api<Resp>('/api/content', { query: { pageId, platform, type, limit: 12, cursor } });
        if (id !== reqId.current) return;
        setItems((prev) => {
          const merged = cursor ? [...prev, ...r.items] : r.items;
          return merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        });
        setNext(r.next);
        setWarnings(r.errors);
      } catch (e: any) {
        if (id === reqId.current) setError(e.message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [pageId, platform, type],
  );

  useEffect(() => {
    setItems([]);
    void load();
  }, [load]);

  const totals = useMemo(
    () => ({
      posts: items.filter((i) => i.type !== 'reel').length,
      reels: items.filter((i) => i.type === 'reel').length,
      likes: items.reduce((s, i) => s + (i.likes ?? 0), 0),
      shares: items.reduce((s, i) => s + (i.shares ?? 0), 0),
    }),
    [items],
  );

  return (
    <>
      <div className="toolbar">
        <PageSelect value={pageId} onChange={setPageId} />
        <label className="field">
          <span>Platform</span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="all">Facebook + Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>
        <div className="segmented" role="tablist" aria-label="Content type">
          {[
            ['all', 'All'],
            ['post', 'Posts'],
            ['reel', 'Reels'],
          ].map(([v, l]) => (
            <button key={v} role="tab" aria-selected={type === v} className={type === v ? 'on' : ''} onClick={() => setType(v)}>
              {l}
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => load()} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="kpis">
        <div className="kpi"><span>Posts loaded</span><strong>{totals.posts}</strong></div>
        <div className="kpi"><span>Reels loaded</span><strong>{totals.reels}</strong></div>
        <div className="kpi"><span>Likes</span><strong>{fmtNum(totals.likes)}</strong></div>
        <div className="kpi"><span>Shares</span><strong>{fmtNum(totals.shares)}</strong></div>
      </div>

      {error && <Alert>{error}</Alert>}
      {warnings.length > 0 && (
        <Alert kind="warn">
          Some sources failed:
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>
                {w.source} ({w.pageId}): {w.error}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {items.length === 0 && !loading && !error ? (
        <Empty title="Nothing to show">No posts or reels for this filter.</Empty>
      ) : (
        <div className="grid">
          {items.map((i) => (
            <ContentCard key={`${i.platform}-${i.id}`} item={i} />
          ))}
        </div>
      )}
      {loading && <Spinner />}
      {next && !loading && (
        <div className="center">
          <button className="btn" onClick={() => load(next)}>
            Load more
          </button>
        </div>
      )}
    </>
  );
}

export default function ContentPage() {
  return (
    <section>
      <header className="page-head">
        <h1>Posts &amp; Reels</h1>
        <p className="muted">Facebook posts and reels, and Instagram media, from every connected page.</p>
      </header>
      <RequireAccount>
        <Content />
      </RequireAccount>
    </section>
  );
}
