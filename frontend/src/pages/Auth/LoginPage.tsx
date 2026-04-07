import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormData } from '@/utils/validators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? '/';

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { usernameOrEmail: '', password: '' },
  });

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login({
        usernameOrEmail: data.usernameOrEmail,
        password: data.password,
      });
      navigate(from, { replace: true });
    } catch {
      /* error stored in Redux */
    }
  };

  return (
    <>
      {/* Form card */}
      <div className="rounded-xl border border-border bg-bg-card px-8 py-10">
        <h2 className="mb-6 text-center text-lg font-semibold text-text-primary">
          Sign in to your account
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('usernameOrEmail')}
            label="Email or Username"
            placeholder="Enter your email or username"
            error={errors.usernameOrEmail?.message}
            autoComplete="username"
          />

          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message}
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="cursor-pointer text-text-secondary hover:text-text-primary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
              />
              Remember me
            </label>
            <span className="text-sm font-medium text-primary">
              Forgot password?
            </span>
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-text-secondary">OR</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-sm text-text-secondary">
          Continue as a guest — features are limited.
        </p>
      </div>

      {/* Register link card */}
      <div className="mt-3 rounded-xl border border-border bg-bg-card px-8 py-5 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Sign up
        </Link>
      </div>
    </>
  );
}
