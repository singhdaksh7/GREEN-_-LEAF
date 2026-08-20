import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useLogin } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(values: FormValues) {
    await login.mutateAsync(values);
    const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/account';
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthSplitLayout>
      <Seo title="Login" />
      <h1 className="mb-1 font-display text-2xl font-bold text-gray-900">Welcome Back</h1>
      <p className="mb-6 text-sm text-gray-500">Log in to continue shopping.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <input {...register('email')} placeholder="Email" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <input type="password" {...register('password')} placeholder="Password" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Link to="/forgot-password" className="text-right text-xs text-brand-700 hover:underline">
          Forgot password?
        </Link>
        <Button type="submit" isLoading={login.isPending} className="w-full">
          Login
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Register
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
