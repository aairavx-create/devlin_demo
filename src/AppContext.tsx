import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Account, type Page } from './api';

type Ctx = {
  account: Account | null;
  pages: Page[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setPages: (p: Page[]) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { account } = await api<{ account: Account | null }>('/api/account');
      setAccount(account);
      setPages(account ? (await api<{ pages: Page[] }>('/api/pages')).pages : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return <AppContext.Provider value={{ account, pages, loading, error, reload, setPages }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
