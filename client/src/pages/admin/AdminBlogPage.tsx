import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { fetchAdminBlogPosts, createAdminBlogPostRequest, updateAdminBlogPostRequest } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/api/axios';

const CATEGORIES = ['Gardening Tips', 'Home Gardening', 'Plant Care', 'Fertilizers', 'DIY Gardening'];

export function AdminBlogPage() {
  const queryClient = useQueryClient();
  const { data: posts = [] } = useQuery({ queryKey: ['admin-blog'], queryFn: fetchAdminBlogPosts });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], excerpt: '', content: '', coverImage: '', isPublished: true });

  const createMutation = useMutation({
    mutationFn: createAdminBlogPostRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
      toast.success('Blog post created');
      setShowForm(false);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not create post')),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => updateAdminBlogPostRequest(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-blog'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gray-900">Blog</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> New Post
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-5 sm:grid-cols-2"
        >
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required placeholder="Cover Image URL" value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input required placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          <textarea required placeholder="Content" rows={4} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} /> Publish immediately
          </label>
          <Button type="submit" isLoading={createMutation.isPending} className="sm:col-span-2">Save Post</Button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <div key={post._id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">{post.title}</p>
              <p className="text-xs text-gray-400">{post.category}</p>
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: post._id, isPublished: !(post as unknown as { isPublished: boolean }).isPublished })}
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              {(post as unknown as { isPublished: boolean }).isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
