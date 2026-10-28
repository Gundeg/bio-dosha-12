-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrgMemberRole" AS ENUM ('OWNER', 'ADMIN', 'PRACTITIONER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('INVITE', 'RESET');

-- CreateEnum
CREATE TYPE "PlanAudience" AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_practitionerId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalIntake" DROP CONSTRAINT "ClinicalIntake_profileId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicalIntake" DROP CONSTRAINT "ClinicalIntake_practitionerId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeOrganizationId" TEXT,
ADD COLUMN     "disabledAt" TIMESTAMP(3),
ADD COLUMN     "disabledReason" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "recoveryCodeHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totpEnabledAt" TIMESTAMP(3),
ADD COLUMN     "totpLastStep" INTEGER,
ADD COLUMN     "totpSecret" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "practitionerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ClinicalIntake" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "practitionerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CLINIC',
    "registrationNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "status" "OrgStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrgMemberRole" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "platformRole" "Role",
    "organizationId" TEXT,
    "orgRole" "OrgMemberRole",
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "meta" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "audience" "PlanAudience" NOT NULL,
    "nameMn" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionMn" TEXT,
    "descriptionEn" TEXT,
    "priceMonthlyMnt" INTEGER,
    "limits" JSONB NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "assignedById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_email_idx" ON "AuthToken"("email");

-- CreateIndex
CREATE INDEX "AuthToken_organizationId_idx" ON "AuthToken"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_at_idx" ON "AuditLog"("actorId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_at_idx" ON "AuditLog"("organizationId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_action_at_idx" ON "AuditLog"("action", "at");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_organizationId_idx" ON "Profile"("organizationId");

-- CreateIndex
CREATE INDEX "BEDIRecord_profileId_date_idx" ON "BEDIRecord"("profileId", "date");

-- CreateIndex
CREATE INDEX "Patient_organizationId_idx" ON "Patient"("organizationId");

-- CreateIndex
CREATE INDEX "ClinicalIntake_organizationId_idx" ON "ClinicalIntake"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalIntake" ADD CONSTRAINT "ClinicalIntake_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalIntake" ADD CONSTRAINT "ClinicalIntake_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalIntake" ADD CONSTRAINT "ClinicalIntake_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Seed: default plan catalog. Prices are left empty on purpose; the
-- superadmin sets them in the control center. Limits: null or missing = unlimited.
INSERT INTO "Plan" ("id", "code", "audience", "nameMn", "nameEn", "descriptionMn", "descriptionEn", "priceMonthlyMnt", "limits", "isDefault", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  ('plan_ind_free', 'IND_FREE', 'INDIVIDUAL', 'Үнэгүй', 'Free',
   'Өөрийн болон гэр бүлийн 5 хүртэлх профайл.', 'Up to 5 personal and family profiles.',
   NULL, '{"maxProfiles": 5}', true, true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_ind_family', 'IND_FAMILY', 'INDIVIDUAL', 'Гэр бүл', 'Family',
   'Өргөн гэр бүлд зориулсан 15 хүртэлх профайл.', 'Up to 15 profiles for an extended family.',
   NULL, '{"maxProfiles": 15}', false, true, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_org_starter', 'ORG_STARTER', 'ORGANIZATION', 'Эхлэл', 'Starter',
   '3 хүртэлх эмч, 300 хүртэлх өвчтөн.', 'Up to 3 practitioners and 300 patients.',
   NULL, '{"maxPractitioners": 3, "maxPatients": 300, "pdfReports": true}', true, true, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_org_pro', 'ORG_PRO', 'ORGANIZATION', 'Мэргэжлийн', 'Professional',
   '15 хүртэлх эмч, 5000 хүртэлх өвчтөн.', 'Up to 15 practitioners and 5,000 patients.',
   NULL, '{"maxPractitioners": 15, "maxPatients": 5000, "pdfReports": true}', false, true, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plan_org_enterprise', 'ORG_ENTERPRISE', 'ORGANIZATION', 'Байгууллага', 'Enterprise',
   'Хязгааргүй эмч, өвчтөн. Тусгай нөхцөлөөр.', 'Unlimited practitioners and patients. Custom terms.',
   NULL, '{"maxPractitioners": null, "maxPatients": null, "pdfReports": true}', false, true, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Data: practitioners from before organizations existed. Each approved
-- practitioner, and anyone who registered patients, gets an organization of
-- their own and becomes its OWNER. Their patients, the patients' profiles and
-- intakes move into it, so patient profiles no longer appear in the
-- practitioner's personal family list. Nothing is deleted; the owner can
-- rename the organization later.
INSERT INTO "Organization" ("id", "name", "type", "status", "verifiedAt", "createdAt", "updatedAt")
SELECT
  'legacy_org_' || u."id",
  u."name" || ' — эмнэлэг',
  'PRIVATE_PRACTICE',
  CASE WHEN u."role" = 'PRACTITIONER' OR u."practitionerApprovedAt" IS NOT NULL
       THEN 'ACTIVE'::"OrgStatus" ELSE 'PENDING'::"OrgStatus" END,
  CASE WHEN u."role" = 'PRACTITIONER' OR u."practitionerApprovedAt" IS NOT NULL
       THEN CURRENT_TIMESTAMP ELSE NULL END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User" u
WHERE u."role" = 'PRACTITIONER'
   OR EXISTS (SELECT 1 FROM "Patient" p WHERE p."practitionerId" = u."id")
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "status", "createdAt", "updatedAt")
SELECT 'legacy_mem_' || u."id", 'legacy_org_' || u."id", u."id", 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
WHERE EXISTS (SELECT 1 FROM "Organization" o WHERE o."id" = 'legacy_org_' || u."id")
ON CONFLICT ("organizationId", "userId") DO NOTHING;

UPDATE "Patient" p
SET "organizationId" = 'legacy_org_' || p."practitionerId"
WHERE p."organizationId" IS NULL
  AND p."practitionerId" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "Organization" o WHERE o."id" = 'legacy_org_' || p."practitionerId");

UPDATE "Profile" pr
SET "organizationId" = p."organizationId", "userId" = NULL
FROM "Patient" p
WHERE p."profileId" = pr."id"
  AND p."organizationId" IS NOT NULL
  AND pr."organizationId" IS NULL;

UPDATE "ClinicalIntake" ci
SET "organizationId" = pr."organizationId"
FROM "Profile" pr
WHERE ci."profileId" = pr."id"
  AND ci."organizationId" IS NULL
  AND pr."organizationId" IS NOT NULL;

UPDATE "User" u
SET "activeOrganizationId" = 'legacy_org_' || u."id"
WHERE u."activeOrganizationId" IS NULL
  AND EXISTS (SELECT 1 FROM "Organization" o WHERE o."id" = 'legacy_org_' || u."id");

-- Clinical access now comes from membership, never from the platform role.
UPDATE "User" SET "role" = 'INDIVIDUAL' WHERE "role" = 'PRACTITIONER';

-- Emails are compared in lower case (src/lib/users.ts); store them that way.
-- A legacy pair that differs only by case is left as is and keeps working
-- through lower(email).
UPDATE "User" u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (SELECT 1 FROM "User" o WHERE o."id" <> u."id" AND lower(o."email") = lower(u."email"));
