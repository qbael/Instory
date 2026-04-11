import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <h1 className="mb-2 text-6xl font-extrabold text-text-primary">404</h1>
      <h2 className="mb-2 text-xl font-semibold text-text-primary">
        Rất tiếc, trang này không tồn tại.
      </h2>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        Liên kết bạn đã truy cập có thể bị hỏng hoặc trang đã bị xóa.
        Quay lại Instory.
      </p>
      <Link to="/">
        <Button size="lg">Về trang chủ</Button>
      </Link>
    </div>
  );
}
