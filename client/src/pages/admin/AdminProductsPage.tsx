import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import {
  fetchAdminProducts, createAdminProductRequest, updateAdminProductRequest, deleteAdminProductRequest,
} from '@/api/admin';
import { fetchAdminCategories } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { formatInr } from '@/utils/format';
import { getErrorMessage } from '@/api/axios';
import { Product } from '@/types';

interface ProductFormState {
  name: string;
  shortDescription: string;
  description: string;
  sku: string;
  category: string;
  images: string;
  mrp: number;
  salePrice: number;
  stock: number;
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
}

const emptyForm: ProductFormState = {
  name: '', shortDescription: '', description: '', sku: '', category: '', images: '',
  mrp: 0, salePrice: 0, stock: 0, featured: false, bestSeller: false, newArrival: false,
};

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const { data } = useQuery({ queryKey: ['admin-products', page], queryFn: () => fetchAdminProducts({ page }) });
  const { data: categories = [] } = useQuery({ queryKey: ['admin-categories'], queryFn: fetchAdminCategories });

  const createMutation = useMutation({
    mutationFn: createAdminProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created');
      resetForm();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not create product')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateAdminProductRequest(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated');
      resetForm();
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update product')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deactivated');
    },
  });

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      sku: product.sku,
      category: typeof product.category === 'object' ? product.category._id : product.category,
      images: product.images.join(', '),
      mrp: product.mrp,
      salePrice: product.salePrice,
      stock: product.stock,
      featured: product.featured,
      bestSeller: product.bestSeller,
      newArrival: product.newArrival,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      variants: [],
      tags: [],
    };
    if (editing) {
      updateMutation.mutate({ id: editing._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Products</h1>
        <Button size="sm" onClick={() => { resetForm(); setShowForm((s) => !s); }}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-5 sm:grid-cols-2">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2">
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <input required placeholder="Short Description" value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          <input placeholder="Image URLs (comma separated)" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          <input required type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input required type="number" placeholder="Sale Price" value={form.salePrice} onChange={(e) => setForm((f) => ({ ...f, salePrice: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex items-center gap-4 text-sm text-gray-600 sm:col-span-2">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm((f) => ({ ...f, bestSeller: e.target.checked }))} /> Bestseller</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={form.newArrival} onChange={(e) => setForm((f) => ({ ...f, newArrival: e.target.checked }))} /> New Arrival</label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Update Product' : 'Create Product'}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Product</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {data?.products.map((product) => (
              <tr key={product._id} className="border-b border-gray-50">
                <td className="flex items-center gap-2 p-3">
                  <img src={product.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                  {product.name}
                </td>
                <td className="p-3">{formatInr(product.salePrice)}</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3">{product.isActive ? 'Active' : 'Inactive'}</td>
                <td className="flex gap-2 p-3">
                  <button onClick={() => startEdit(product)} className="text-gray-400 hover:text-brand-600"><Pencil size={16} /></button>
                  <button onClick={() => deleteMutation.mutate(product._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
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
    </div>
  );
}
