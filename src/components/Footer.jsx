import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer>
      <div className="foot-inner">
        <div>
          <Link to="/" className="brand">Ether<em>eal</em></Link>
          <p>{t('footer.blurb')}</p>
        </div>
        <div>
          <h4>{t('footer.shop')}</h4>
          <ul>
            <li><Link to="/?section=skincare">{t('categories.skincare.title')}</Link></li>
            <li><Link to="/?section=makeup">{t('categories.makeup.title')}</Link></li>
            <li><Link to="/?section=bodyhair">{t('categories.bodyhair.title')}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t('footer.help')}</h4>
          <ul>
            {/* <li><Link to="/">{t('footer.shipping')}</Link></li> */}
            {/* <li><Link to="/">{t('footer.returns')}</Link></li> */}
            <li><Link to="/">{t('footer.contact')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="foot-bar">
        <span>{t('footer.rights')}</span>
        <span>{t('footer.madeWith')}</span>
      </div>
    </footer>
  );
}
