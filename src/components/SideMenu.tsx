/**
 * Slide-in left menu for full-width pages (e.g. the website home page).
 * Closed by default; the ☰ button opens it. Closes on link click, backdrop click or Escape.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { DASHBOARD_LINKS } from '../navLinks';
import './side-menu.css';

export default function SideMenu({ className = '' }: Readonly<{ className?: string }>) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`sm-toggle ${className}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="side-menu"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      {/* Rendered on <body>: a parent with backdrop-filter/transform would otherwise trap position:fixed */}
      {createPortal(
        <>
      <div className={`sm-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside id="side-menu" ref={panelRef} className={`sm-panel${open ? ' open' : ''}`} aria-label="Dashboard menu" aria-hidden={!open}>
        <div className="sm-head">
          <span className="sm-brand">
            <span className="sm-mark">M</span> Meta Dashboard
          </span>
          <button type="button" className="sm-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <nav className="sm-nav">
          <NavLink to="/" end className={({ isActive }) => `sm-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
            <span className="sm-icon" aria-hidden="true">
              ⌂
            </span>
            Website
          </NavLink>
          {DASHBOARD_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `sm-link${isActive ? ' active' : ''}`} onClick={() => setOpen(false)}>
              <span className="sm-icon" aria-hidden="true">
                {l.icon}
              </span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
        </>,
        document.body,
      )}
    </>
  );
}
