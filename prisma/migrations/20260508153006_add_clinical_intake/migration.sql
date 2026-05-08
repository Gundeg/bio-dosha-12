-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "registerNumber" TEXT;

-- CreateTable
CREATE TABLE "ClinicalIntake" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "practitionerId" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dischargeDate" TIMESTAMP(3),
    "season" "Season" NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "tongue" TEXT,
    "pulseSummary" TEXT,
    "pulseTable" JSONB,
    "complaintAtArrival" TEXT,
    "condition" TEXT,
    "mentalState" TEXT,
    "position" TEXT,
    "zurkhai" TEXT,
    "diagnosis" TEXT,
    "treatmentPlan" TEXT,
    "covidHistory" TEXT,
    "surgeryHistory" TEXT,
    "chronicDisease" TEXT,
    "traumaHistory" TEXT,
    "bloodPressure" TEXT,
    "heartRate" TEXT,
    "complaintAtDischarge" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentLog" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "tractionNeck" INTEGER NOT NULL DEFAULT 0,
    "tractionBack" INTEGER NOT NULL DEFAULT 0,
    "barriaaHead" INTEGER NOT NULL DEFAULT 0,
    "barriaaNeckShoulder" INTEGER NOT NULL DEFAULT 0,
    "barriaaBack" INTEGER NOT NULL DEFAULT 0,
    "barriaaLegs" INTEGER NOT NULL DEFAULT 0,
    "acupuncture" INTEGER NOT NULL DEFAULT 0,
    "cupping" INTEGER NOT NULL DEFAULT 0,
    "heatTreatment" INTEGER NOT NULL DEFAULT 0,
    "oilZad5" INTEGER NOT NULL DEFAULT 0,
    "oilBoigor10" INTEGER NOT NULL DEFAULT 0,
    "oilSenden4" INTEGER NOT NULL DEFAULT 0,
    "oilSesame" INTEGER NOT NULL DEFAULT 0,
    "oilGinger" INTEGER NOT NULL DEFAULT 0,
    "oilMilk" INTEGER NOT NULL DEFAULT 0,
    "oilZad5Tail" INTEGER NOT NULL DEFAULT 0,
    "oilGarlic" INTEGER NOT NULL DEFAULT 0,
    "hotStone" INTEGER NOT NULL DEFAULT 0,
    "electrophoresis" INTEGER NOT NULL DEFAULT 0,
    "detox" INTEGER NOT NULL DEFAULT 0,
    "footReflex" INTEGER NOT NULL DEFAULT 0,
    "bloodletting" INTEGER NOT NULL DEFAULT 0,
    "moxibustion" INTEGER NOT NULL DEFAULT 0,
    "exerciseTherapy" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalIntake_profileId_admissionDate_idx" ON "ClinicalIntake"("profileId", "admissionDate");

-- CreateIndex
CREATE INDEX "ClinicalIntake_practitionerId_idx" ON "ClinicalIntake"("practitionerId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentLog_intakeId_key" ON "TreatmentLog"("intakeId");

-- AddForeignKey
ALTER TABLE "ClinicalIntake" ADD CONSTRAINT "ClinicalIntake_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalIntake" ADD CONSTRAINT "ClinicalIntake_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentLog" ADD CONSTRAINT "TreatmentLog_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "ClinicalIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
