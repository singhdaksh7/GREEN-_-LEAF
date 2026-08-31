import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, Eye, Search } from 'lucide-react';
import {
  fetchAdminProducts, fetchAdminProduct, createAdminProductRequest, updateAdminProductRequest, deleteAdminProductRequest,
  fetchAdminCategories,
} from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { ImageManager } from '@/components/admin/ImageManager';
import { VariantEditor } from '@/components/admin/VariantEditor';
import { formatInr } from '@/utils/format';
import { getErrorMessage } from '@/api/axios';
import { getPrimaryImageUrl, onProductImageError } from '@/utils/productImage';
import { Product, ProductImage, ProductVariant, ProductStatus, Category } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  howToUse: string;
  sku: string;
  brand: string;
  category: string;
  subcategory: string;
  images: ProductImage[];
  variants: ProductVariant[];
  mrp: number;
  salePrice: number;
  stock: number;
  tags: string;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  seoTitle: string;
  seoDescription: string;
  status: ProductStatus;
}

const emptyForm: ProductFormState = {
  name: '', shortDescription: '', description: '', howToUse: '', sku: '', brand: 'GreenKart',
  category: '', subcategory: '', images: [], variants: [],
  mrp: 0, salePrice: 0, stock: 0, tags: '', featured: false, bestSeller: false, newArrival: false,
  seoTitle: '', seoDescription: '', status: 'DRAFT',
};

function categoryName(category: Product['category']): string {
  return typeof category === 'object' && category ? category.name : '—';
}

const STATUS_BADGE: Record<ProductStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-red-100 text-red-600',
};

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<ProductFormState | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const { data } = useQuery({
    queryKey: ['admin-products', page, debouncedQ, categoryFilter],
    queryFn: () => fetchAdminProducts({ page, q: debouncedQ || undefined, category: categoryFilter || undefined }),
  });
  const { data: categories = [] } = useQuery({ queryKey: ['admin-categories'], queryFn: fetchAdminCategories });

  const topLevelCategories = useMemo(() => categories.filter((c) => !c.parent), [categories]);
  const subcategoryOptions = useMemo(
    () => categories.filter((c) => idOf(c.parent) === form.category),
    [categories, form.category]
  );

  function idOf(value: string | Category | null | undefined): string {
    if (!value) return '';
    return typeof value === 'object' ? value._id : value;
  }

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string | null; body: Record<string, unknown> }) =>
      payload.id ? updateAdminProductRequest(payload.id, payload.body) : createAdminProductRequest(payload.body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(variables.id ? 'Product updated' : 'Product created');
      resetForm();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not save product')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product archived');
    },
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function startEdit(product: Product) {
    const full = await fetchAdminProduct(product._id);
    setEditingId(full._id);
    setForm({
      name: full.name,
      shortDescription: full.shortDescription,
      description: full.description,
      howToUse: full.howToUse ?? '',
      sku: full.sku,
      brand: full.brand,
      category: idOf(full.category),
      subcategory: idOf(full.subcategory),
      images: full.images,
      variants: full.variants,
      mrp: full.mrp,
      salePrice: full.salePrice,
      stock: full.stock,
      tags: full.tags.join(', '),
      featured: full.featured,
      bestSeller: full.bestSeller,
      newArrival: full.newArrival,
      seoTitle: full.seoTitle ?? '',
      seoDescription: full.seoDescription ?? '',
      status: full.status,
    });
    setShowForm(true);
  }

  function buildPayload(status: ProductStatus): Record<string, unknown> {
    return {
      name: form.name,
      shortDescription: form.shortDescription,
      description: form.description,
      howToUse: form.howToUse || undefined,
      sku: form.sku,
      brand: form.brand || undefined,
      category: form.category,
      subcategory: form.subcategory || null,
      images: form.images,
      variants: form.variants,
      mrp: form.mrp,
      salePrice: form.salePrice,
      stock: form.stock,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      featured: form.featured,
      bestSeller: form.bestSeller,
      newArrival: form.newArrival,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      status,
    };
  }

  function handleSubmit(e: React.FormEvent, status: ProductStatus) {
    e.preventDefault();
    if (!form.category) {
      toast.error('Please select a category');
      return;
    }
    saveMutation.mutate({ id: editingId, body: buildPayload(status) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm((s) => !s); }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <form className="flex flex-col gap-5 rounded-xl border border-gray-100 bg-white p-5">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <h2 className="text-sm font-semibold text-gray-500 sm:col-span-2">Basic Information</h2>
            <input required placeholder="Product Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
            <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input required placeholder="Short Description" value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
            <textarea required placeholder="Full Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
            <textarea placeholder="How To Use (optional)" value={form.howToUse} onChange={(e) => setForm((f) => ({ ...f, howToUse: e.target.value }))} rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <h2 className="text-sm font-semibold text-gray-500 sm:col-span-2">Classification</h2>
            <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select Category</option>
              {topLevelCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))} disabled={subcategoryOptions.length === 0} className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50">
              <option value="">No Subcategory</option>
              {subcategoryOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </section>

          <section className="grid grid-cols-1 gap-3">
            <h2 className="text-sm font-semibold text-gray-500">Images</h2>
            <ImageManager images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <h2 className="text-sm font-semibold text-gray-500 sm:col-span-3">Pricing &amp; Inventory</h2>
            <input required type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input required type="number" placeholder="Sale Price" value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-3" />
          </section>

          <section className="grid grid-cols-1 gap-3">
            <h2 className="text-sm font-semibold text-gray-500">Variants</h2>
            <VariantEditor variants={form.variants} onChange={(variants) => setForm((f) => ({ ...f, variants }))} galleryImages={form.images} />
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <h2 className="text-sm font-semibold text-gray-500 sm:col-span-2">SEO</h2>
            <input placeholder="Meta Title" value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
            <textarea placeholder="Meta Description" value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} rows={2} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          </section>

          <section className="flex items-center gap-4 text-sm text-gray-600">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm((f) => ({ ...f, bestSeller: e.target.checked }))} /> Bestseller</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.newArrival} onChange={(e) => setForm((f) => ({ ...f, newArrival: e.target.checked }))} /> New Arrival</label>
          </section>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => setPreviewProduct(form)}>
              <Eye size={16} /> Preview
            </Button>
            <Button type="button" variant="secondary" isLoading={saveMutation.isPending} onClick={(e) => handleSubmit(e, 'DRAFT')}>
              Save Draft
            </Button>
            <Button type="button" isLoading={saveMutation.isPending} onClick={(e) => handleSubmit(e, 'PUBLISHED')}>
              {form.status === 'PUBLISHED' ? 'Update & Keep Published' : 'Publish Product'}
            </Button>
            {editingId && form.status === 'PUBLISHED' && (
              <Button type="button" variant="ghost" isLoading={saveMutation.isPending} onClick={(e) => handleSubmit(e, 'DRAFT')}>
                Unpublish
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {data?.products.map((product) => (
              <tr key={product._id} className="border-b border-gray-50">
                <td className="flex items-center gap-2 p-3">
                  <img src={getPrimaryImageUrl(product)} onError={onProductImageError} alt="" className="h-10 w-10 rounded object-cover" />
                  {product.name}
                </td>
                <td className="p-3 text-gray-500">{product.sku}</td>
                <td className="p-3 text-gray-500">{categoryName(product.category)}</td>
                <td className="p-3">{formatInr(product.salePrice)}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[product.status]}`}>{product.status}</span>
                </td>
                <td className="p-3 text-gray-400">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '—'}</td>
                <td className="flex gap-2 p-3">
                  <button onClick={() => startEdit(product)} title="Edit" className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>
                  {product.status !== 'ARCHIVED' && (
                    <button onClick={() => deleteMutation.mutate(product._id)} title="Archive" className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`h-8 w-8 rounded-lg text-sm ${p === page ? 'bg-brand-600 text-white' : 'text-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewProduct(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{previewProduct.name || 'Untitled product'}</h3>
              <button onClick={() => setPreviewProduct(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {previewProduct.images.map((img) => (
                <img key={img.key || img.url} src={img.url} alt="" className="h-24 w-full rounded object-cover" />
              ))}
              {previewProduct.images.length === 0 && <p className="col-span-3 text-sm text-gray-400">No images uploaded yet</p>}
            </div>
            <p className="mt-3 text-sm text-gray-600">{previewProduct.shortDescription}</p>
            <p className="mt-2 text-lg font-bold text-brand-700">{formatInr(previewProduct.salePrice)} <span className="text-sm font-normal text-gray-400 line-through">{formatInr(previewProduct.mrp)}</span></p>
            {previewProduct.variants.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase text-gray-400">Variants</h4>
                <ul className="mt-1 flex flex-col gap-1 text-sm">
                  {previewProduct.variants.map((v, i) => (
                    <li key={i}>{v.sku} — {Object.values(v.attributes).join(' / ')} — {formatInr(v.salePrice)} ({v.stock} in stock)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
