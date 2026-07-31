import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES } from '../data/categories.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function Navbar({ onOpenCart }) {
  const { cartCount } = useStore();
  const { isAuthed, logout } = useAuth();
  const { t } = useTranslation();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">Ether<em>eal</em></Link>
        <nav className="nav-links">
          <Link to="/">{t('nav.home')}</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.id} to={`/?section=${c.id}`}>{t(`categories.${c.id}.title`)}</Link>
          ))}
        </nav>
        <div className="nav-spacer" />
        <LanguageSwitcher />
        <button className="icon-btn" onClick={onOpenCart} aria-label={t('nav.openCart')}>
          <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
        {/* The Admin entry is only shown to a logged-in admin. Anyone else
            reaches the panel by signing in at the (unlinked) /login URL. */}
        {isAuthed && (
          <>
            <Link to="/admin" className="admin-btn">{t('nav.admin')}</Link>
            <button className="admin-btn" onClick={logout}>{t('nav.logout')}</button>
          </>
        )}
      </div>
    </header>
  );
}
