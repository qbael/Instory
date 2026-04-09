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
          Đăng nhập vào tài khoản
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('usernameOrEmail')}
            label="Email hoặc tên đăng nhập"
            placeholder="Nhập email hoặc tên đăng nhập"
            error={errors.usernameOrEmail?.message}
            autoComplete="username"
          />

          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            error={errors.password?.message}
            autoComplete="current-password"
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="cursor-pointer text-text-secondary hover:text-text-primary"
              >
                {!showPassword ? (
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
              Ghi nhớ đăng nhập
            </label>
            <span className="text-sm font-medium text-primary">
              Quên mật khẩu?
            </span>
          </div>

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Đăng nhập
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-text-secondary">HOẶC</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <p className="text-center text-sm text-text-secondary">
          Tiếp tục với tư cách khách — tính năng bị giới hạn.
        </p>
      </div>

      {/* Register link card */}
      <div className="mt-3 rounded-xl border border-border bg-bg-card px-8 py-5 text-center text-sm">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Đăng ký
        </Link>
      </div>
    </>
  );
}
