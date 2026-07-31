import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { SEED } from '../data/seed.js';
import {
  apiListProducts,
  apiCreateProduct,
  apiCreateProducts,
  apiUpdateProduct,
  apiDeleteProduct,
  apiBulkDeleteProducts,
  apiDeleteAllProducts,
} from '../utils/api.js';

const KEY = 'ethereal_products_v1';
const StoreContext = createContext(null);

// The DB owns product ids (integers). We string-ify them so the rest of the
// app — routes (/product/:id), cart keys, React keys — keeps working unchanged.
const mapProduct = (p) => ({ ...p, id: String(p.id) });

// Initial paint comes from the last-known cache (or the bundled seed as a
// placeholder). The real data is fetched from the backend right after mount and
// replaces this — the backend is the source of truth.
function loadCache() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable — fall through to seed placeholder */
  }
  return SEED.map((p, i) => ({ id: 'seed' + (i + 1), img: '', ...p }));
}

function persist(products) {
  try {
    localStorage.setItem(KEY, JSON.stringify(products));
  } catch {
    /* in-memory only */
  }
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(loadCache);
  const [cart, setCart] = useState({}); // id -> qty
  const [toast, setToast] = useState(null); // { msg, err }
  const toastTimer = useRef(null);

  // Write-through cache: whenever products change, keep the local copy fresh so
  // the next load paints instantly and the storefront survives a backend blip.
  useEffect(() => persist(products), [products]);

  // Load the authoritative product list from the backend on mount.
  useEffect(() => {
    let alive = true;
    apiListProducts()
      .then((list) => {
        if (alive) setProducts(list.map(mapProduct));
      })
      .catch(() => {
        /* backend unreachable — keep showing the cached/seed products */
      });
    return () => {
      alive = false;
    };
  }, []);

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, [toastTimer]);

  /* ----- product CRUD (persisted in the DB via the backend) ----- */
  const addProduct = useCallback(async (draft) => {
    const created = mapProduct(await apiCreateProduct(draft));
    setProducts((prev) => [...prev, created]);
    return created;
  }, []);

  const addProducts = useCallback(async (drafts) => {
    const created = (await apiCreateProducts(drafts)).map(mapProduct);
    setProducts((prev) => [...prev, ...created]);
    return created;
  }, []);

  const updateProduct = useCallback(async (id, patch) => {
    const updated = mapProduct(await apiUpdateProduct(id, patch));
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await apiDeleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const deleteProducts = useCallback(async (ids) => {
    await apiBulkDeleteProducts(ids);
    const gone = new Set(ids.map(String));
    setProducts((prev) => prev.filter((p) => !gone.has(p.id)));
    setCart((prev) => {
      const next = { ...prev };
      gone.forEach((id) => delete next[id]);
      return next;
    });
  }, []);

  const deleteAllProducts = useCallback(async () => {
    await apiDeleteAllProducts();
    setProducts([]);
    setCart({});
  }, []);

  /* ----- cart ----- */
  const addToCart = useCallback((id, qty = 1) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }));
  }, []);

  const changeQty = useCallback((id, delta) => {
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
        .filter((x) => x.product),
    [cart, products],
  );
  const cartCount = useMemo(() => cartItems.reduce((s, x) => s + x.qty, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((s, x) => s + x.qty * x.product.price, 0), [cartItems]);

  const value = {
    products,
    addProduct,
    addProducts,
    updateProduct,
    deleteProduct,
    deleteProducts,
    deleteAllProducts,
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    changeQty,
    clearCart,
    toast,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
