-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "ageNote" TEXT,
ADD COLUMN     "lifestyle" TEXT[],
ADD COLUMN     "validationAction" TEXT,
ADD COLUMN     "validationStatus" TEXT;
