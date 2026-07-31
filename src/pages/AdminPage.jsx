import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../context/StoreContext.jsx';
import ProductForm from '../components/admin/ProductForm.jsx';
import BulkImport from '../components/admin/BulkImport.jsx';
import ManageList from '../components/admin/ManageList.jsx';
import AliParse from '../components/admin/AliParse.jsx';
import Seo from '../components/Seo.jsx';

const TAB_IDS = ['add', 'import', 'ali', 'manage'];

export default function AdminPage() {
  const { products, addProduct, updateProduct, showToast } = useStore();
  const { t } = useTranslation();
  const [tab, setTab] = useState('add');
  const [editingId, setEditingId] = useState(null);
  const [params, setParams] = useSearchParams();

  // Deep link from a product page: /admin?edit=p3 opens the edit modal directly.
  useEffect(() => {
    const id = params.get('edit');
    if (id && products.some((p) => p.id === id)) {
      setTab('manage');
      setEditingId(id);
      setParams({}, { replace: true });
    }
  }, [params, products, setParams]);

  const editing = products.find((p) => p.id === editingId) || null;

  return (
    <div className="admin-inner">
      <Seo title={t('seo.adminTitle')} noindex />
      <div className="admin-top">
        <h2>{t('admin.title1')} <em style={{ fontFamily: "'Fraunces', serif" }}>{t('admin.title2')}</em></h2>
        <Link to="/" className="admin-btn">{t('admin.backToStore')}</Link>
      </div>

      <div className="tabs">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            className={'tab' + (tab === id ? ' active' : '')}
            onClick={() => setTab(id)}
          >
            {t(`admin.tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === 'add' && (
        <div className="admin-card">
          <ProductForm
            onSubmit={async (draft) => {
              try {
                await addProduct(draft);
                showToast(t('admin.cardCreated', { name: draft.name }));
              } catch (err) {
                showToast(err.message || t('admin.saveCardFailed'), true);
              }
            }}
          />
        </div>
      )}

      {tab === 'import' && <BulkImport />}

      {tab === 'ali' && <AliParse />}

      {tab === 'manage' && <ManageList onEdit={setEditingId} />}

      {editing && (
        <>
          <div className="overlay show" onClick={() => setEditingId(null)} />
          <div className="modal">
            <div className="modal-card">
              <h3>{t('admin.editTitle')}</h3>
              <p className="sub">{t('admin.editSub')}</p>
              <ProductForm
                initial={editing}
                submitLabel={t('admin.saveChanges')}
                onSubmit={async (draft) => {
                  try {
                    await updateProduct(editing.id, draft);
                    setEditingId(null);
                    showToast(t('admin.saved', { name: draft.name }));
                  } catch (err) {
                    showToast(err.message || t('admin.saveChangesFailed'), true);
                  }
                }}
              />
              <button
                className="mini-btn btn-block"
                style={{ marginTop: 10, justifyContent: 'center' }}
                onClick={() => setEditingId(null)}
              >
                {t('admin.cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
