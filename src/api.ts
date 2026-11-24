export const AGENT_URL = (import.meta.env.VITE_AGENT_URL as string) || 'http://localhost:4000';
const API_KEY = (import.meta.env.VITE_AGENT_API_KEY as string) || '';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { query?: Record<string, string | number | boolean | undefined | null> } = {}): Promise<T> {
  const url = new URL(path, AGENT_URL);
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  return body as T;
}

export const loginUrl = `${AGENT_URL}/api/auth/facebook/login`;

// ---------- Types ----------
export type Account = {
  id: string;
  fbUserId: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
  tokenExpiresAt?: string;
  grantedScopes?: string[];
  businesses?: { id: string; name: string }[];
  businessId?: string;
  lastPagesSyncAt?: string;
  pageCount: number;
};

export type Page = {
  _id: string;
  pageId: string;
  name?: string;
  category?: string;
  pictureUrl?: string;
  link?: string;
  fanCount?: number;
  relationship: 'personal' | 'owned' | 'client';
  tasks?: string[];
  instagram?: { id?: string; username?: string; pictureUrl?: string };
  hasToken: boolean;
  active: boolean;
  leadgenSubscribed: boolean;
  leadsSyncedAt?: string;
  lastSyncedAt?: string;
};

export type ContentItem = {
  id: string;
  platform: 'facebook' | 'instagram';
  type: 'post' | 'reel' | 'video' | 'carousel' | 'image';
  pageId: string;
  pageName?: string;
  account?: string;
  caption?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink?: string;
  createdAt: string;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  durationSec?: number;
};

export type AccessRequest = {
  _id: string;
  pageId: string;
  pageName?: string;
  permittedTasks: string[];
  status: 'pending' | 'approved' | 'failed';
  metaAccessStatus?: string;
  error?: string;
  note?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type LeadStatus = 'NEW' | 'WORKING' | 'UNQUALIFIED' | 'QUALIFIED' | 'CLOSE' | 'INVALID';

export type Lead = {
  _id: string;
  leadgenId: string;
  pageId?: string;
  pageName?: string;
  formId?: string;
  formName?: string;
  adName?: string;
  adsetName?: string;
  campaignName?: string;
  platform?: string;
  isOrganic?: boolean;
  fullName?: string;
  email?: string;
  phone?: string;
  fields: Record<string, string>;
  consents?: { checkbox_key: string; is_checked: string }[];
  createdTime?: string;
  status: LeadStatus;
  statusHistory?: { status: string; at: string }[];
  followUp?: { at?: string; type?: string; notes?: string };
  adId?: string;
  adsetId?: string;
  campaignId?: string;
  source: 'webhook' | 'sync';
  fetchStatus: 'pending' | 'fetched' | 'failed';
  fetchError?: string;
};

export type AdAccount = { id: string; accountId: string; name: string; currency: string; status: string };

export type Ad = {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  createdAt: string;
  campaign?: { id: string; name: string; objective?: string };
  adset?: { id: string; name: string };
  creative: { id?: string; title?: string; body?: string; thumbnailUrl?: string };
  insights: { impressions: number; reach: number; clicks: number; spend: number; ctr: number | null; cpc: number | null; cpm: number | null; leads: number };
};
