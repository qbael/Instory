import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type LocationState = {
  email?: string;
};

export default function VerifyOtpPage() {
  const { verifySignupOtp, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = useMemo(
    () => (location.state as LocationState | null)?.email ?? '',
    [location.state],
  );

  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await verifySignupOtp({ email, otpCode });
      toast.success('Xác minh email thành công! Bạn có thể đăng nhập.');
      navigate('/login', { replace: true });
    } catch {
      /* error stored in Redux */
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-bg-card px-8 py-10">
        <h2 className="mb-1 text-center text-lg font-semibold text-text-primary">
          Xác minh email
        </h2>
        <p className="mb-6 text-center text-sm text-text-secondary">
          Nhập mã OTP đã gửi tới <span className="font-semibold">{email}</span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={onVerify} className="space-y-4">
          <Input
            label="Mã OTP"
            placeholder="6 chữ số"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            autoComplete="one-time-code"
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            disabled={otpCode.trim().length !== 6}
          >
            Xác minh
          </Button>
        </form>
      </div>
    </>
  );
}

