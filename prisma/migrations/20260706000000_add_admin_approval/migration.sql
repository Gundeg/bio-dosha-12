-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "practitionerRequestedAt" TIMESTAMP(3),
ADD COLUMN     "practitionerApprovedAt" TIMESTAMP(3);
