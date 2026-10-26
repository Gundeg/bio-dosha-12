import { z } from "zod";
import { normalizeEmail } from "../credentials";
import { organizationFieldsSchema, organizationUpdateSchema } from "./organization";

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
});

export function pageArgs(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export const userListQuery = pageSchema.extend({
  q: z.string().trim().max(200).optional(),
  role: z.enum(["INDIVIDUAL", "PRACTITIONER", "ADMIN", "SUPERADMIN"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  type: z.enum(["individual", "member", "staff"]).optional(),
  /** 2-step sign-in on or off. */
  mfa: z.enum(["on", "off"]).optional(),
});

export const userActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("disable"), reason: z.string().trim().min(3).max(300) }),
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("signout") }),
  z.object({ action: z.literal("reset_mfa") }),
  z.object({ action: z.literal("set_role"), role: z.enum(["INDIVIDUAL", "ADMIN"]) }),
  z.object({
    action: z.literal("set_plan"),
    planCode: z.string().trim().min(1).max(50).nullable(),
    note: z.string().trim().max(300).optional().nullable(),
    currentPeriodEnd: z.string().datetime().optional().nullable(),
  }),
]);

export const orgListQuery = pageSchema.extend({
  q: z.string().trim().max(200).optional(),
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
});

export const orgActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify") }),
  z.object({ action: z.literal("suspend"), reason: z.string().trim().min(3).max(300) }),
  z.object({ action: z.literal("reactivate") }),
  z.object({ action: z.literal("update"), fields: organizationUpdateSchema }),
  z.object({
    action: z.literal("set_plan"),
    planCode: z.string().trim().min(1).max(50).nullable(),
    note: z.string().trim().max(300).optional().nullable(),
    currentPeriodEnd: z.string().datetime().optional().nullable(),
  }),
]);

const limitValue = z.number().int().min(0).max(1_000_000).nullable().optional();

export const planLimitsSchema = z
  .object({
    maxProfiles: limitValue,
    maxPractitioners: limitValue,
    maxPatients: limitValue,
    pdfReports: z.boolean().optional(),
  })
  .strict();

export const planCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "Use capital letters, digits and _"),
  audience: z.enum(["INDIVIDUAL", "ORGANIZATION"]),
  nameMn: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().min(1).max(100),
  descriptionMn: z.string().trim().max(500).optional().nullable(),
  descriptionEn: z.string().trim().max(500).optional().nullable(),
  priceMonthlyMnt: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  limits: planLimitsSchema.default({}),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

/**
 * Explicit update schema: Zod 4's .partial() would apply limits' default ({})
 * for an absent key and silently make a plan unlimited.
 */
export const planUpdateSchema = z.object({
  nameMn: z.string().trim().min(1).max(100).optional(),
  nameEn: z.string().trim().min(1).max(100).optional(),
  descriptionMn: z.string().trim().max(500).nullable().optional(),
  descriptionEn: z.string().trim().max(500).nullable().optional(),
  priceMonthlyMnt: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  limits: planLimitsSchema.optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const auditQuery = pageSchema.extend({
  action: z.string().trim().max(100).optional(),
  actor: z.string().trim().max(200).optional(),
  organizationId: z.string().trim().max(100).optional(),
  targetId: z.string().trim().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export const staffInviteSchema = z.object({
  email: z.email().trim().max(200).transform(normalizeEmail),
  role: z.literal("ADMIN").default("ADMIN"),
});

export const inviteListQuery = pageSchema.extend({
  kind: z.enum(["staff", "organization"]).optional(),
  state: z.enum(["pending", "used", "revoked", "expired"]).optional(),
});

/** Staff create an organization and invite its owner in one step. */
export const adminOrgCreateSchema = organizationFieldsSchema.extend({
  ownerEmail: z.email().trim().max(200).transform(normalizeEmail),
  /** Staff-created organizations are verified unless staff choose otherwise. */
  status: z.enum(["ACTIVE", "PENDING"]).default("ACTIVE"),
  planCode: z.string().trim().min(1).max(50).optional().nullable(),
});
