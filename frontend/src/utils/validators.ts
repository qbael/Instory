import { z } from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, 'Vui lòng nhập email hoặc tên đăng nhập'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(20, 'Tên đăng nhập không được quá 20 ký tự')
    .regex(/^[a-zA-Z0-9._]+$/, 'Chỉ chấp nhận chữ, số, dấu chấm và gạch dưới'),
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Địa chỉ email không hợp lệ'),
  fullName: z
    .string()
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được quá 100 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

export const createPostSchema = z.object({
  content: z
    .string()
    .max(2200, 'Chú thích không được quá 2.200 ký tự')
    .optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Bình luận không được để trống')
    .max(1000, 'Bình luận không được quá 1.000 ký tự'),
});

export const editProfileSchema = z.object({
  fullName: z
    .string()
    .max(100, 'Họ và tên không được quá 100 ký tự')
    .optional(),
  bio: z
    .string()
    .max(150, 'Tiểu sử không được quá 150 ký tự')
    .optional(),
  userName: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(20, 'Tên đăng nhập không được quá 20 ký tự')
    .regex(/^[a-zA-Z0-9._]+$/, 'Chỉ chấp nhận chữ, số, dấu chấm và gạch dưới'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreatePostFormData = z.infer<typeof createPostSchema>;
export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
export type EditProfileFormData = z.infer<typeof editProfileSchema>;

export function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Yếu', color: 'bg-error', textColor: 'text-error' } as const;
  if (score <= 2) return { score, label: 'Trung bình', color: 'bg-warning', textColor: 'text-warning' } as const;
  return { score, label: 'Mạnh', color: 'bg-success', textColor: 'text-success' } as const;
}
