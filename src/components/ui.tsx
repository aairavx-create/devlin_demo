import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Page } from '../api';
import { useApp } from '../AppContext';

export function Alert({ kind = 'error', children, onClose }: { kind?: 'error' | 'info' | 'success' | 'warn'; children: ReactNode; onClose?: () => void }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <div>{children}</div>
      {onClose && (
        <button className="btn-link" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="spinner-row">
      <span className="spinner" /> {label}
    </div>
  );
}

export function PageSelect({ value, onChange, allowAll = true, pages: given }: { value: string; onChange: (v: string) => void; allowAll?: boolean; pages?: Page[] }) {
  const { pages } = useApp();
  const list = (given ?? pages).filter((p) => p.active && p.hasToken);
  return (
    <label className="field">
      <span>Page</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {allowAll && <option value="all">All connected pages ({list.length})</option>}
        {list.map((p) => (
          <option key={p.pageId} value={p.pageId}>
            {p.name}
            {p.instagram?.username ? ` · @${p.instagram.username}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Shown on data screens when no main account is connected yet. */
export function RequireAccount({ children }: { children: ReactNode }) {
  const { account, loading, error } = useApp();
  if (loading) return <Spinner />;
  if (error) return <Alert>Can't reach the agent backend: {error}</Alert>;
  if (!account)
    return (
      <Empty title="No Facebook account connected">
        Go to <Link to="/pages">Linked pages</Link> and connect your main account first.
      </Empty>
    );
  return <>{children}</>;
}

export const fmtNum = (n?: number | null) => (n == null ? '–' : Intl.NumberFormat(undefined, { notation: n >= 10000 ? 'compact' : 'standard' }).format(n));
export const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '–');
