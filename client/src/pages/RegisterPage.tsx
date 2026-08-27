import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Seo } from '@/components/seo/Seo';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { useRegister } from '@/hooks/useAuth';

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const registerUser = useRegister();
  const navigate = useNavigate();

  async function onSubmit(values: FormValues) {
    await registerUser.mutateAsync(values);
    navigate('/account');
  }

  return (
    <AuthSplitLayout>
      <Seo title="Register" />
      <h1 className="mb-1 font-display text-2xl font-bold text-gray-900">Create Your Account</h1>
      <p className="mb-6 text-sm text-gray-500">Join GreenKart and start growing.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input {...register('firstName')} placeholder="First Name" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div>
              <input {...register('lastName')} placeholder="Last Name" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <input {...register('email')} placeholder="Email" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register('phone')} placeholder="Phone Number" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <input type="password" {...register('password')} placeholder="Password" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <input type="password" {...register('confirmPassword')} placeholder="Confirm Password" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" isLoading={registerUser.isPending} className="w-full">
            Create Account
          </Button>
        </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Login
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
