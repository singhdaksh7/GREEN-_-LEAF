import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { forgotPasswordRequest } from '@/api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const mutation = useMutation({
    mutationFn: forgotPasswordRequest,
    onSuccess: () => setSubmitted(true),
  });

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <Seo title="Forgot Password" />
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 p-8 shadow-card">
        <h1 className="mb-2 text-center font-display text-2xl font-bold text-gray-900">Forgot Password</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Password reset emails aren&apos;t enabled on this demo site yet. Please contact support to reset your
          password.
        </p>

        {submitted ? (
          <p className="rounded-lg bg-brand-50 p-4 text-center text-sm text-brand-700">
            Thanks — we&apos;ve logged your request for {email}. Since email delivery isn&apos;t configured on this
            demo yet, please contact support directly to complete your password reset.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate(email);
            }}
            className="flex flex-col gap-4"
          >
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            />
            <Button type="submit" isLoading={mutation.isPending} className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
