import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../context/StoreContext.jsx';
import { parseBulk } from '../../utils/parser.js';

const EXAMPLE = `Name | Price | Section | Description | Image URL

Vitamin C Glow Serum | 19.99 | skincare | Brightens dull skin with 10% vitamin C
Velvet Matte Lipstick | 8.50 | makeup | Long-wear matte in warm rose | https://example.com/lip.jpg
Shea Body Butter | 12.00 | body | Deep hydration for dry skin`;

export default function BulkImport() {
  const { addProducts, showToast } = useStore();
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  async function runImport() {
    const { drafts, errors, total } = parseBulk(text, t);
    if (!total) {
      setResult({ ok: false, lines: [t('import.nothing')] });
      return;
    }
    if (drafts.length) {
      try {
        await addProducts(drafts);
      } catch (err) {
        setResult({ ok: false, lines: [t('import.failed', { msg: err.message || 'server error' })] });
        showToast(t('import.importFailedToast'), true);
        return;
      }
      setText('');
      showToast(t('import.importedToast', { count: drafts.length }));
    }
    setResult({
      ok: errors.length === 0,
      lines: [t('import.importedResult', { count: drafts.length }), ...errors],
    });
  }

  return (
    <div className="admin-card">
      <p className="hint">{t('import.hint')}</p>
      <div className="code">{EXAMPLE}</div>
      <div className="field">
        <label>{t('import.label')}</label>
        <textarea
          style={{ minHeight: 160 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('import.placeholder')}
        />
      </div>
      <button className="btn-primary" onClick={runImport}>{t('import.button')}</button>
      {result && (
        <div className={'import-result ' + (result.ok ? 'ok' : 'err')}>
          {result.lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
