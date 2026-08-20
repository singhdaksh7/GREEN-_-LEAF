import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { fetchAdminCategories, createAdminCategoryRequest, deleteAdminCategoryRequest } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/api/axios';

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ['admin-categories'], queryFn: fetchAdminCategories });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');

  const createMutation = useMutation({
    mutationFn: createAdminCategoryRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      setName('');
      setParent('');
      setShowForm(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not create category')),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategoryRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deactivated');
    },
  });

  const topLevel = categories.filter((c) => !c.parent);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Categories</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ name, parent: parent || null });
          }}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-5"
        >
          <input required placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">No parent (top-level)</option>
            {topLevel.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <Button type="submit" isLoading={createMutation.isPending}>Save</Button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase text-gray-400">
              <th className="p-3">Name</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} className="border-b border-gray-50">
                <td className="p-3">{cat.name}</td>
                <td className="p-3 text-gray-500">
                  {typeof cat.parent === 'object' && cat.parent ? (cat.parent as unknown as { name: string }).name : '—'}
                </td>
                <td className="p-3">{cat.isActive ? 'Active' : 'Inactive'}</td>
                <td className="p-3">
                  <button onClick={() => deleteMutation.mutate(cat._id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
