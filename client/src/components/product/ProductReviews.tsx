import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchReviews, createReviewRequest } from '@/api/reviews';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/api/axios';
import { formatDate } from '@/utils/format';
import { Review } from '@/types';

export function ProductReviews({ productId, initialReviews, averageRating, reviewCount }: { productId: string; initialReviews: Review[]; averageRating: number; reviewCount: number }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => fetchReviews(productId),
    initialData: { reviews: initialReviews, total: reviewCount, totalPages: 1 },
  });

  const submitReview = useMutation({
    mutationFn: createReviewRequest,
    onSuccess: () => {
      toast.success('Thank you for your review!');
      setShowForm(false);
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not submit review')),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            <StarRating rating={averageRating} showCount={false} size={18} />
          </div>
          <p className="text-sm text-gray-500">Based on {reviewCount} reviews</p>
        </div>
        {user ? (
          <Button variant="outline" size="sm" onClick={() => setShowForm((s) => !s)}>
            Write a Review
          </Button>
        ) : (
          <p className="text-xs text-gray-500">Log in to write a review.</p>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitReview.mutate({ productId, rating, title, description });
          }}
          className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-100 p-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Your rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setRating(r)} aria-label={`Rate ${r} stars`}>
                  <StarRating rating={r <= rating ? 5 : 0} showCount={false} size={18} />
                </button>
              ))}
            </div>
          </div>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your experience with this product"
            rows={3}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <Button type="submit" isLoading={submitReview.isPending} className="self-start">
            Submit Review
          </Button>
        </form>
      )}

      <ul className="flex flex-col gap-5">
        {data.reviews.map((review) => (
          <li key={review._id} className="border-b border-gray-100 pb-5">
            <div className="mb-1 flex items-center justify-between">
              <StarRating rating={review.rating} showCount={false} />
              <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-800">{review.title}</h4>
            <p className="mt-1 text-sm text-gray-600">{review.description}</p>
            {review.verifiedPurchase && <span className="mt-1 inline-block text-xs font-medium text-brand-600">Verified Purchase</span>}
          </li>
        ))}
        {data.reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>}
      </ul>
    </div>
  );
}
