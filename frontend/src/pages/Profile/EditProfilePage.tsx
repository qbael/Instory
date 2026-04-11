import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import { userService } from '@/services/userService';
import { editProfileSchema, type EditProfileFormData } from '@/utils/validators';
import { cn } from '@/utils/cn';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from '@/utils/constants';

export default function EditProfilePage() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      userName: user?.userName ?? '',
      fullName: user?.fullName ?? '',
      bio: user?.bio ?? '',
    },
  });

  useEffect(() => {
    if (user) {
      setValue('userName', user.userName);
      setValue('fullName', user.fullName ?? '');
      setValue('bio', user.bio ?? '');
    }
  }, [user, setValue]);

  const bio = watch('bio') ?? '';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPEG, PNG, WebP và GIF');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Ảnh phải nhỏ hơn ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: EditProfileFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userName', data.userName);
      if (data.fullName) formData.append('fullName', data.fullName);
      if (data.bio) formData.append('bio', data.bio);
      if (avatarFile) formData.append('avatar', avatarFile);

      await userService.updateProfile(formData);
      await dispatch(fetchCurrentUser()).unwrap();
      toast.success('Đã cập nhật hồ sơ');
      navigate(`/profile/${user?.id}`);
    } catch {
      toast.error('Cập nhật hồ sơ thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-semibold">Chỉnh sửa hồ sơ</h1>

      {/* Avatar section */}
      <div className="mb-8 flex items-center gap-6 rounded-xl bg-bg-card/80 p-5">
        <div className="relative">
          <Avatar
            src={avatarPreview ?? user?.avatarUrl}
            alt={user?.userName ?? ''}
            size="xl"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
          >
            <Camera className="h-6 w-6 text-white" />
          </button>
        </div>
        <div>
          <p className="font-semibold">{user?.userName}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer text-sm font-semibold text-primary hover:text-primary-hover"
          >
            Thay đổi ảnh đại diện
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          {...register('userName')}
          label="Tên đăng nhập"
          error={errors.userName?.message}
        />

        <Input
          {...register('fullName')}
          label="Họ và tên"
          error={errors.fullName?.message}
        />

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Tiểu sử
          </label>
          <textarea
            {...register('bio')}
            rows={3}
            maxLength={150}
            className={cn(
              'w-full resize-none rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-text-primary',
              'placeholder:text-text-secondary/70',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
              errors.bio && 'border-error focus:border-error focus:ring-error/20',
            )}
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.bio && (
              <p className="text-xs text-error">{errors.bio.message}</p>
            )}
            <p
              className={cn(
                'ml-auto text-xs',
                bio.length > 140 ? 'text-error' : 'text-text-secondary',
              )}
            >
              {bio.length}/150
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            Lưu
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
}
