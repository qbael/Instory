import { z } from 'zod';

export const loginSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, 'Email or username is required'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9._]+$/, 'Only letters, numbers, dots and underscores'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  fullName: z
    .string()
    .max(100, 'Full name must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be at most 100 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const createPostSchema = z.object({
  content: z
    .string()
    .max(2200, 'Caption must be at most 2,200 characters')
    .optional(),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be at most 1,000 characters'),
});

export const editProfileSchema = z.object({
  fullName: z
    .string()
    .max(100, 'Full name must be at most 100 characters')
    .optional(),
  bio: z
    .string()
    .max(150, 'Bio must be at most 150 characters')
    .optional(),
  userName: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9._]+$/, 'Only letters, numbers, dots and underscores'),
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

  if (score <= 1) return { score, label: 'Weak', color: 'bg-error', textColor: 'text-error' } as const;
  if (score <= 2) return { score, label: 'Medium', color: 'bg-warning', textColor: 'text-warning' } as const;
  return { score, label: 'Strong', color: 'bg-success', textColor: 'text-success' } as const;
}
