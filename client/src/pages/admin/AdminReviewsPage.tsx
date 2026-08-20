import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fetchAdminReviews, setReviewApprovalRequest } from '@/api/admin';
import { StarRating } from '@/components/ui/StarRating';

interface AdminReview {
  _id: string;
  product: { name: string };
  user: { firstName: string; lastName: string };
  rating: number;
  title: string;
  description: string;
  isApproved: boolean;
}

export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-reviews'], queryFn: () => fetchAdminReviews({}) });

  const approvalMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) => setReviewApprovalRequest(id, isApproved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review updated');
    },
  });

  const reviews = (data?.reviews ?? []) as unknown as AdminReview[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-gray-900">Reviews</h1>

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div key={review._id} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{review.product?.name}</span>
              <StarRating rating={review.rating} showCount={false} />
            </div>
            <p className="text-sm font-semibold text-gray-800">{review.title}</p>
            <p className="mt-1 text-sm text-gray-600">{review.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {review.user?.firstName} {review.user?.lastName} · {review.isApproved ? 'Approved' : 'Hidden'}
              </span>
              <button
                onClick={() => approvalMutation.mutate({ id: review._id, isApproved: !review.isApproved })}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                {review.isApproved ? 'Hide' : 'Approve'}
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews to moderate.</p>}
      </div>
    </div>
  );
}
