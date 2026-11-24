import { useEffect, useMemo, useState } from 'react';
import { api, type Ad, type AdAccount } from '../api';
import { Alert, Empty, RequireAccount, Spinner, fmtDate, fmtNum } from '../components/ui';

const PRESETS: [string, string][] = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['last_7d', 'Last 7 days'],
  ['last_14d', 'Last 14 days'],
  ['last_30d', 'Last 30 days'],
  ['last_90d', 'Last 90 days'],
  ['this_month', 'This month'],
  ['last_month', 'Last month'],
  ['maximum', 'Lifetime'],
];

function Ads() {
  const [accounts, setAccounts] = useState<AdAccount[] | null>(null);
  const [accountId, setAccountId] = useState('');
  const [preset, setPreset] = useState('last_30d');
  const [status, setStatus] = useState('');
  const [ads, setAds] = useState<Ad[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ adAccounts: AdAccount[] }>('/api/ads/accounts')
      .then((r) => {
        setAccounts(r.adAccounts);
        if (r.adAccounts[0]) setAccountId(r.adAccounts[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function load(after?: string) {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ ads: Ad[]; next: string | null }>('/api/ads', { query: { adAccountId: accountId, datePreset: preset, status, after } });
      setAds((prev) => (after ? [...prev, ...r.ads] : r.ads));
      setNext(r.next);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setAds([]);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, preset, status]);

  const currency = accounts?.find((a) => a.id === accountId)?.currency ?? 'USD';
  const money = (n?: number | null) => (n == null ? '–' : new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n));
  const totals = useMemo(
    () =>
      ads.reduce(
        (t, a) => ({
          spend: t.spend + a.insights.spend,
          impressions: t.impressions + a.insights.impressions,
          clicks: t.clicks + a.insights.clicks,
          leads: t.leads + a.insights.leads,
        }),
        { spend: 0, impressions: 0, clicks: 0, leads: 0 },
      ),
    [ads],
  );

  if (accounts && accounts.length === 0) return <Empty title="No ad accounts">This Facebook account has no ad accounts it can read (needs ads_read).</Empty>;

  return (
    <>
      <div className="toolbar">
        <label className="field">
          <span>Ad account</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={!accounts}>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.accountId}){a.status !== 'ACTIVE' ? ` · ${a.status}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Date range</span>
          <select value={preset} onChange={(e) => setPreset(e.target.value)}>
            {PRESETS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CAMPAIGN_PAUSED">Campaign paused</option>
            <option value="ADSET_PAUSED">Ad set paused</option>
            <option value="DISAPPROVED">Disapproved</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      </div>

      <div className="kpis">
        <div className="kpi"><span>Spend</span><strong>{money(totals.spend)}</strong></div>
        <div className="kpi"><span>Impressions</span><strong>{fmtNum(totals.impressions)}</strong></div>
        <div className="kpi"><span>Clicks</span><strong>{fmtNum(totals.clicks)}</strong></div>
        <div className="kpi"><span>Leads</span><strong>{fmtNum(totals.leads)}</strong></div>
      </div>
      <p className="muted small">Totals cover the ads loaded below.</p>

      {error && <Alert>{error}</Alert>}
      {!accounts && !error && <Spinner />}

      {ads.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Campaign / Ad set</th>
                <th>Status</th>
                <th className="num">Spend</th>
                <th className="num">Impr.</th>
                <th className="num">Reach</th>
                <th className="num">Clicks</th>
                <th className="num">CTR</th>
                <th className="num">CPC</th>
                <th className="num">Leads</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="ad-cell">
                      {a.creative.thumbnailUrl ? <img src={a.creative.thumbnailUrl} alt="" /> : <div className="ad-thumb-empty" />}
                      <div>
                        <div className="strong">{a.name}</div>
                        <div className="muted small clamp">{a.creative.title || a.creative.body}</div>
                        <div className="muted small">Created {fmtDate(a.createdAt)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{a.campaign?.name}</div>
                    <div className="muted small">{a.adset?.name}</div>
                    {a.campaign?.objective && <div className="muted small">{a.campaign.objective}</div>}
                  </td>
                  <td>
                    <span className={`pill ${a.effectiveStatus === 'ACTIVE' ? 'pill-good' : a.effectiveStatus === 'DISAPPROVED' ? 'pill-bad' : ''}`}>
                      {a.effectiveStatus.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="num">{money(a.insights.spend)}</td>
                  <td className="num">{fmtNum(a.insights.impressions)}</td>
                  <td className="num">{fmtNum(a.insights.reach)}</td>
                  <td className="num">{fmtNum(a.insights.clicks)}</td>
                  <td className="num">{a.insights.ctr != null ? `${a.insights.ctr.toFixed(2)}%` : '–'}</td>
                  <td className="num">{money(a.insights.cpc)}</td>
                  <td className="num">{fmtNum(a.insights.leads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && accounts && <Empty title="No ads">No ads match this filter.</Empty>
      )}
      {loading && <Spinner />}
      {next && !loading && (
        <div className="center">
          <button className="btn" onClick={() => load(next)}>Load more</button>
        </div>
      )}
    </>
  );
}

export default function AdsPage() {
  return (
    <section>
      <header className="page-head">
        <h1>Ads</h1>
        <p className="muted">Ads across your ad accounts with spend, reach, clicks and leads.</p>
      </header>
      <RequireAccount>
        <Ads />
      </RequireAccount>
    </section>
  );
}
