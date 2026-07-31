import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../components/Hero.jsx';
import CategorySection from '../components/CategorySection.jsx';
import Seo from '../components/Seo.jsx';
import { CATEGORIES } from '../data/categories.js';

export default function Home() {
  const [params] = useSearchParams();
  const { t } = useTranslation();
  const section = params.get('section');

  // Support deep links like /?section=makeup from the nav and footer.
  useEffect(() => {
    if (section) {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [section]);

  return (
    <>
      <Seo title={t('seo.homeTitle')} description={t('seo.homeDescription')} path="/" type="website" />
      <Hero />
      <main>
        {CATEGORIES.map((c) => <CategorySection key={c.id} category={c} />)}
      </main>
    </>
  );
}
