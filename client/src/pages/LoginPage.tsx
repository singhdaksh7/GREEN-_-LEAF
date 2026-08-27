import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function onSubmit(values: FormValues) {
    await login.mutateAsync(values);
    const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/account';
    navigate(redirectTo, { replace: true });
  }

  return (
    <AuthSplitLayout>
      <Seo title="Login" />
      <h1 className="mb-1 font-display text-2xl font-bold text-gray-900">Welcome back</h1>
      <p className="mb-6 text-sm text-gray-500">Log in to continue shopping.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">Email</label>
          <input id="email" autoComplete="email" {...register('email')} placeholder="Email Address" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-600">Password</label>
          <div className="relative">
            <input id="password" autoComplete="current-password" type={isPasswordVisible ? 'text' : 'password'} {...register('password')} placeholder="Password" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm" />
            <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 px-3 text-gray-500" aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}>
              {isPasswordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <Link to="/forgot-password" className="text-right text-xs text-brand-700 hover:underline">
          Forgot Password?
        </Link>
        <Button type="submit" isLoading={login.isPending} className="w-full">
          Sign In
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        New to GreenKart?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Create Account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
