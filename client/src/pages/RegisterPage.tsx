import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useRegister } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const registerUser = useRegister();
  const navigate = useNavigate();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  async function onSubmit(values: FormValues) {
    await registerUser.mutateAsync(values);
    navigate('/account');
  }

  return (
    <AuthSplitLayout>
      <Seo title="Register" />
      <h1 className="mb-1 font-display text-2xl font-bold text-gray-900">Create your account</h1>
      <p className="mb-6 text-sm text-gray-500">Join GreenKart and start growing.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-xs font-medium text-gray-600">Name</label>
            <input id="name" autoComplete="name" {...register('name')} placeholder="Full Name" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input id="email" autoComplete="email" {...register('email')} placeholder="Email Address" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-gray-600">Password</label>
            <div className="relative">
              <input id="password" autoComplete="new-password" type={isPasswordVisible ? 'text' : 'password'} {...register('password')} placeholder="Password" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm" />
              <button type="button" onClick={() => setIsPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-0 px-3 text-gray-500" aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}>
                {isPasswordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" isLoading={registerUser.isPending} className="w-full">
            Create Account
          </Button>
        </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Sign In
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
