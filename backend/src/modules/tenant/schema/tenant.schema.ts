import { z } from 'zod';

// --- 1. Tenant Creation Schemas ---
export const createTenantSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name cannot exceed 50 characters')
    .trim(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;

export const tenantResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  createdAt: z.date(),
});

// --- 2. Tenant Switching Schemas ---
export const switchTenantSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
});

export type SwitchTenantInput = z.infer<typeof switchTenantSchema>;

export const switchTenantResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
  activeTenant: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
  }),
});