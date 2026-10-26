import { z } from "zod";

export const ORGANIZATION_TYPES = ["CLINIC", "HOSPITAL", "PRIVATE_PRACTICE", "OTHER"] as const;
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const organizationFieldsSchema = z.object({
  name: z.string().trim().min(2).max(150),
  type: z.enum(ORGANIZATION_TYPES).default("CLINIC"),
  registrationNumber: optionalText(50),
  phone: optionalText(50),
  email: z
    .union([z.email().trim().max(200), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null)),
  address: optionalText(500),
  city: optionalText(100),
});

/**
 * Text that may be cleared on update: "" or null become null, an absent key
 * stays absent. (Zod 4's .partial() would run the create schema's defaults and
 * transforms for absent keys and wipe stored values, so updates are explicit.)
 */
const clearableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null))
    .optional();

export const organizationUpdateSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  type: z.enum(ORGANIZATION_TYPES).optional(),
  registrationNumber: clearableText(50),
  phone: clearableText(50),
  email: z
    .union([z.email().trim().max(200), z.literal("")])
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .optional(),
  address: clearableText(500),
  city: clearableText(100),
});

export const ORG_MEMBER_ROLES = ["OWNER", "ADMIN", "PRACTITIONER"] as const;
