import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { updateProfileRequest } from '@/api/account';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/api/axios';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [name, setName] = useState(user?.name ?? '');

  const mutation = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (updatedUser) => {
      if (accessToken) setAuth(updatedUser, accessToken);
      toast.success('Profile updated successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update profile')),
  });

  return (
    <div className="max-w-lg rounded-xl border border-gray-100 p-5">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Profile</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ name });
        }}
        className="flex flex-col gap-4"
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <input value={user?.email ?? ''} disabled className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        <Button type="submit" isLoading={mutation.isPending} className="self-start">
          Save Changes
        </Button>
      </form>
    </div>
  );
}
