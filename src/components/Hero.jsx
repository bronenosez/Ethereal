import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import woman from '../assets/woman.webp';

export default function Hero() {
  const { t } = useTranslation();
  return (
    <section className="hero" id="home">
      <div>
        <h1>
          {t('hero.titleBefore')}{' '}
          <span className="swash">
            {t('hero.titleEmph')}
            <svg viewBox="0 0 120 18" preserveAspectRatio="none">
              <path d="M2 12 C 30 2, 90 2, 118 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          {' '}{t('hero.titleAfter')}
        </h1>
        <p>{t('hero.blurb')}</p>
        <div className="hero-cta">
          <Link className="btn-primary" to="/?section=skincare">
            {t('hero.cta')} <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="hero-social">
          <div className="avatars">
            <span style={{ background: '#F3E7E3' }}>🌸</span>
            <span style={{ background: '#E9E7F8' }}>✨</span>
            <span style={{ background: '#EAF3EA' }}>🌿</span>
          </div>
          <small>{t('hero.review')}</small>
        </div>
      </div>
      <div className="hero-visual">
        <span className="sparkle s1">✦</span>
        <span className="sparkle s2">✧</span>
        <div className="hero-frame">
          <img src={woman} alt={t('hero.imageAlt')} width="1086" height="1448" fetchPriority="high" decoding="async" />
        </div>
      </div>
    </section>
  );
}
