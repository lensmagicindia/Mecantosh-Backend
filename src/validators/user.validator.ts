import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
  }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
