import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  registerSchema,
  type RegisterFormData,
  getPasswordStrength,
} from '@/utils/validators';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

export default function RegisterPage() {
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');
  const strength = watchedPassword
    ? getPasswordStrength(watchedPassword)
    : null;

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName || undefined,
      });
      navigate('/login', { replace: true });
    } catch {
      /* error stored in Redux */
    }
  };

  return (
    <>
      {/* Form card */}
      <div className="rounded-xl border border-border bg-bg-card px-8 py-10">
        <h2 className="mb-1 text-center text-lg font-semibold text-text-primary">
          Tạo tài khoản của bạn
        </h2>
        <p className="mb-6 text-center text-sm text-text-secondary">
          Đăng ký để xem ảnh và video từ bạn bè.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('username')}
            label="Tên đăng nhập"
            placeholder="Chọn tên đăng nhập"
            error={errors.username?.message}
            autoComplete="username"
          />

          <Input
            {...register('email')}
            type="email"
            label="Email"
            placeholder="Nhập email của bạn"
            error={errors.email?.message}
            autoComplete="email"
          />

          <Input
            {...register('fullName')}
            label="Họ và tên"
            placeholder="Họ và tên (không bắt buộc)"
            error={errors.fullName?.message}
            autoComplete="name"
          />

          {/* Password + strength indicator */}
          <div>
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Mật khẩu"
              placeholder="Tạo mật khẩu"
              error={errors.password?.message}
              autoComplete="new-password"
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

            {/* Password strength bar */}
            {strength && watchedPassword.length > 0 && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      strength.color,
                    )}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
                <span
                  className={cn('text-xs font-semibold', strength.textColor)}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <Input
            {...register('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            rightIcon={
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="cursor-pointer text-text-secondary hover:text-text-primary"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />

          <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
            Đăng ký
          </Button>

          <p className="text-center text-xs leading-relaxed text-text-secondary">
            Khi đăng ký, bạn đồng ý với{' '}
            <span className="font-semibold">Điều khoản</span>,{' '}
            <span className="font-semibold">Chính sách bảo mật</span> và{' '}
            <span className="font-semibold">Chính sách Cookie</span>.
          </p>
        </form>
      </div>

      {/* Login link card */}
      <div className="mt-3 rounded-xl border border-border bg-bg-card px-8 py-5 text-center text-sm">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:text-primary-hover"
        >
          Đăng nhập
        </Link>
      </div>
    </>
  );
}
