import { useState } from 'react';
import { useProducts, type Product } from '../hooks/useProducts';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  X,
  Image as ImageIcon,
  Upload,
  Loader2,
  Bell,
  Boxes,
  Search,
  Store,
} from 'lucide-react';

interface ProductForm {
  name: string;
  description: string;
  retail_price: number;
  wholesale_price: number;
  wholesale_threshold: number;
  filled_stock: number;
  empty_stock: number;
  image_url: string;
  active: boolean;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  retail_price: 0,
  wholesale_price: 0,
  wholesale_threshold: 10,
  filled_stock: 0,
  empty_stock: 0,
  image_url: '',
  active: true,
};

export default function SellerProducts() {
  const { products: allProducts, loading, error, refresh, createProduct, updateProduct, deleteProduct } = useProducts({ includeInactive: true });
  const { user } = useAuth();
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [notifyToast, setNotifyToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const products = allProducts.filter((p) => p.company_id === user?.company_id);
  const companyId = user?.company_id;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price,
      wholesale_threshold: product.wholesale_threshold,
      filled_stock: product.filled_stock,
      empty_stock: product.empty_stock,
      image_url: product.image_url || '',
      active: product.active,
    });
    setEditingId(product.id);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!companyId) {
      setFormError('No company linked to your account.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (form.retail_price <= 0) {
      setFormError('Retail price must be greater than 0');
      return;
    }
    if (form.wholesale_price > form.retail_price) {
      setFormError('Wholesale price should be lower than retail');
      return;
    }
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      retail_price: Number(form.retail_price),
      wholesale_price: Number(form.wholesale_price),
      wholesale_threshold: Number(form.wholesale_threshold),
      filled_stock: Number(form.filled_stock),
      empty_stock: Number(form.empty_stock),
      image_url: form.image_url || null,
      active: form.active,
      company_id: companyId,
    };

    const result = editingId
      ? await updateProduct(editingId, payload)
      : await createProduct(payload as Omit<Product, 'id' | 'created_at' | 'updated_at'>);

    setSubmitting(false);
    if (result.error) {
      setFormError(result.error.message);
      return;
    }
    setShowModal(false);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    setDeleteConfirm(null);
    refresh();
  };

  const notifyStockArrival = async (productId: string, productName: string) => {
    setNotifyingId(productId);
    try {
      const session = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-stock-arrival`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ productId, productName }),
        }
      );
      const result = await resp.json();
      if (resp.ok) {
        setNotifyToast(`${productName}: ${result.message || 'Buyers notified.'}`);
      } else {
        setNotifyToast(`Failed: ${result.error || 'Could not notify buyers.'}`);
      }
    } catch {
      setNotifyToast('Failed to notify buyers.');
    } finally {
      setNotifyingId(null);
      setTimeout(() => setNotifyToast(null), 4000);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!companyId) {
    return (
      <div className="card p-8 text-center">
        <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900">No company linked</h3>
        <p className="text-sm text-slate-500 mt-1">Your seller account is not linked to a company yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display">My Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your catalog, prices, stock, and photos.</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your products..."
          className="input pl-10"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="h-32 skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 rounded skeleton" />
                <div className="h-3 w-1/2 rounded skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="card p-6 text-center text-danger-600 text-sm">Failed to load products.</div>}

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Boxes className="w-7 h-7 text-slate-300" />
          </div>
          <h3 className="font-semibold text-slate-900">No products yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Add your first product to start selling.</p>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                )}
                <span className={`absolute top-2 left-2 ${product.active ? 'badge-success' : 'badge-neutral'}`}>
                  {product.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 text-sm">{product.name}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-slate-500">₦{product.retail_price.toLocaleString()} retail</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">₦{product.wholesale_price.toLocaleString()} wholesale</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-success-600" />
                    <span className="font-medium text-slate-700">{product.filled_stock} filled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Boxes className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{product.empty_stock} empty</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <button onClick={() => openEdit(product)} className="btn-secondary flex-1 py-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {product.filled_stock > 0 && (
                    <button
                      onClick={() => notifyStockArrival(product.id, product.name)}
                      disabled={notifyingId === product.id}
                      className="btn-ghost text-brand-600 hover:bg-brand-50 py-1.5 px-2"
                      title="Notify buyers of new stock"
                    >
                      {notifyingId === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="btn-ghost text-danger-600 hover:bg-danger-50 py-1.5 px-2"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div
            className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Photo</label>
                <div className="space-y-2">
                  {form.image_url && (
                    <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image_url: '' })}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-lg hover:bg-black/70"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors">
                    {uploadingImage ? (
                      <><Loader2 className="w-4 h-4 animate-spin text-slate-400" /><span className="text-sm text-slate-500">Uploading...</span></>
                    ) : (
                      <><Upload className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">Upload photo</span></>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        const ext = file.name.split('.').pop();
                        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
                        const { error: upErr } = await supabase.storage.from('product-images').upload(path, file);
                        if (upErr) {
                          setUploadError(upErr.message);
                          setUploadingImage(false);
                          return;
                        }
                        const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
                        setForm({ ...form, image_url: pub.publicUrl });
                        setUploadError('');
                        setUploadingImage(false);
                      }}
                    />
                  </label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="input"
                    placeholder="...or paste image URL"
                  />
                  {uploadError && <p className="text-xs text-danger-600">{uploadError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Coca-Cola Crates" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input resize-none" placeholder="Optional product details" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Retail Price (₦)</label>
                  <input type="number" min="0" required value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: Number(e.target.value) })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Wholesale Price (₦)</label>
                  <input type="number" min="0" required value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: Number(e.target.value) })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Wholesale Threshold (crates)</label>
                <input type="number" min="1" required value={form.wholesale_threshold} onChange={(e) => setForm({ ...form, wholesale_threshold: Number(e.target.value) })} className="input" />
                <p className="text-xs text-slate-500 mt-1">Buy this many or more to unlock wholesale price.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Filled Stock</label>
                  <input type="number" min="0" required value={form.filled_stock} onChange={(e) => setForm({ ...form, filled_stock: Number(e.target.value) })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Empty Stock</label>
                  <input type="number" min="0" required value={form.empty_stock} onChange={(e) => setForm({ ...form, empty_stock: Number(e.target.value) })} className="input" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-slate-700">Active (visible in catalog)</span>
              </label>

              {formError && (
                <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg border border-danger-200">{formError}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-danger-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-danger-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-center">Delete product?</h3>
            <p className="text-sm text-slate-500 text-center mt-1">This cannot be undone. The product will be removed from your catalog.</p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Notify toast */}
      {notifyToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl shadow-2xl max-w-md text-center">
          {notifyToast}
        </div>
      )}
    </div>
  );
}
