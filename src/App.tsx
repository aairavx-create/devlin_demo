import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import ContentPage from './pages/ContentPage';
import LeadsPage from './pages/LeadsPage';
import AdsPage from './pages/AdsPage';
import PagesPage from './pages/PagesPage';
import ChatsPage from './pages/ChatsPage';
import BookingsPage from './pages/BookingsPage';
import HomePage from './home/HomePage';
import { DASHBOARD_LINKS } from './navLinks';

function Sidebar() {
  const { account } = useApp();
  const links = DASHBOARD_LINKS;
  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>Devlin</strong>
        <small>Staff dashboard</small>
      </div>
      <nav aria-label="Dashboard">
        <NavLink to="/" className="nav-link">
          <span className="nav-icon" aria-hidden>
            ⌂
          </span>
          Website
        </NavLink>
        <span className="nav-sep" aria-hidden="true" />
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon" aria-hidden>
              {l.icon}
            </span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        {account ? (
          <div className="me">
            {account.pictureUrl && <img src={account.pictureUrl} alt="" />}
            <div>
              <div className="me-name">{account.name}</div>
              <div className="muted small">{account.pageCount} pages</div>
            </div>
          </div>
        ) : (
          <div className="muted small">Not connected</div>
        )}
      </div>
    </aside>
  );
}

function DashboardLayout() {
  return (
    <AppProvider>
      <div className="layout">
        <Sidebar />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </AppProvider>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public website (no sidebar) with the chat widget */}
      <Route path="/" element={<HomePage />} />
      {/* Staff dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/pages" element={<PagesPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/ads" element={<AdsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/leads" replace />} />
    </Routes>
  );
}
