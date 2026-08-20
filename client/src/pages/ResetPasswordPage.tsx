import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { resetPasswordRequest } from '@/api/auth';
import { getErrorMessage } from '@/api/axios';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => resetPasswordRequest(token, password),
    onSuccess: () => {
      toast.success('Password reset successfully. Please log in.');
      navigate('/login');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Could not reset password')),
  });

  if (!token) {
    return (
      <div className="container-app py-16 text-center text-sm text-gray-500">
        This reset link is missing a token.{' '}
        <Link to="/forgot-password" className="text-brand-700 hover:underline">Request a new one</Link>.
      </div>
    );
  }

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <Seo title="Reset Password" />
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 p-8 shadow-card">
        <h1 className="mb-6 text-center font-display text-2xl font-bold text-gray-900">Set a New Password</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          />
          <Button type="submit" isLoading={mutation.isPending} className="w-full">
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
