import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import Seo from '../components/Seo.jsx';

// The admin login lives at /login — it is intentionally not linked from the
// storefront navigation. Once authenticated, the Admin button appears in the nav.
export default function LoginPage() {
  const { login, isAuthed } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip straight to the admin panel.
  if (isAuthed) {
    navigate('/admin', { replace: true });
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || t('login.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-inner" style={{ maxWidth: 420 }}>
      <Seo title={t('seo.loginTitle')} noindex />
      <div className="admin-top">
        <h2>{t('login.title1')} <em style={{ fontFamily: "'Fraunces', serif" }}>{t('login.title2')}</em></h2>
      </div>
      <div className="admin-card">
        <form onSubmit={submit}>
          <div className="field">
            <label>{t('login.username')}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="field">
            <label>{t('login.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="import-result err">{error}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
