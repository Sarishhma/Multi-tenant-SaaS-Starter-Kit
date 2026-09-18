import { z } from 'zod';

// --- Unified Tenant Role Enum (Includes VIEWER) ---
export const tenantRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']);
export type TenantRole = z.infer<typeof tenantRoleEnum>;

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
  role: tenantRoleEnum,
  createdAt: z.union([z.string(), z.date()]),
});

// --- 2. Tenant Switching Schemas ---
export const switchTenantSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
});

export type SwitchTenantInput = z.infer<typeof switchTenantSchema>;

export const activeTenantContextSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  role: tenantRoleEnum,
});

export const switchTenantResponseSchema = z.object({
  message: z.string(),
  accessToken: z.string(),
  activeTenant: activeTenantContextSchema,
});

// --- 3. Tenant Invitation Schemas ---
export const inviteTenantSchema = z.object({
  email: z.string().email({ message: 'Please provide a valid email address.' }),
  role: tenantRoleEnum.optional().default('MEMBER'),
});

export type InviteTenantInput = z.infer<typeof inviteTenantSchema>;

export const inviteTenantResponseSchema = z.object({
  message: z.string(),
  invitationId: z.string(),
  email: z.string(),
  role: tenantRoleEnum,
  expiresAt: z.union([z.string(), z.date()]),
  rawToken: z.string().optional(), // Included for development/testing convenience
});

// --- 4. Accept Invitation Schemas ---
export const acceptTenantInvitationSchema = z.object({
  token: z.string().min(1, { message: 'Invitation token is required.' }),
});

export type AcceptTenantInvitationInput = z.infer<typeof acceptTenantInvitationSchema>;

export const acceptTenantInvitationResponseSchema = z.object({
  success: z.boolean(),
  tenant: activeTenantContextSchema,
});