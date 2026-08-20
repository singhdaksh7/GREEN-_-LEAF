import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { changePasswordRequest } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      toast.success('Password updated. Please log in again.');
      logout();
      navigate('/login');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not update password')),
  });

  return (
    <div className="max-w-lg rounded-xl border border-gray-100 p-5">
      <h2 className="mb-4 text-base font-semibold text-gray-900">Change Password</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ currentPassword, newPassword });
        }}
        className="flex flex-col gap-4"
      >
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current Password"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New Password"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <Button type="submit" isLoading={mutation.isPending} className="self-start">
          Update Password
        </Button>
      </form>
    </div>
  );
}
