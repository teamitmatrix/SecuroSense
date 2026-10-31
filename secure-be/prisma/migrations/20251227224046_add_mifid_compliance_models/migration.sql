-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "complianceStatus" JSONB,
ADD COLUMN     "encryptedFields" JSONB,
ADD COLUMN     "regulatoryFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CallAnalysis" ADD COLUMN     "bestExecutionCheck" BOOLEAN DEFAULT false,
ADD COLUMN     "clientCategory" TEXT,
ADD COLUMN     "mifidCompliance" JSONB,
ADD COLUMN     "suitabilityScore" INTEGER;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "complianceOfficerEmail" TEXT,
ADD COLUMN     "mifidEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regulatoryFramework" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "regulation" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requiredChecks" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" SERIAL NOT NULL,
    "callId" INTEGER NOT NULL,
    "ruleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'N/A',
    "details" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedBy" INTEGER,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientCategorization" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessmentDetails" JSONB,
    "assessedBy" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCategorization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuitabilityAssessment" (
    "id" SERIAL NOT NULL,
    "callId" INTEGER,
    "leadId" INTEGER NOT NULL,
    "riskProfile" TEXT,
    "investmentObjectives" JSONB,
    "knowledgeExperience" JSONB,
    "financialSituation" JSONB,
    "assessmentResult" JSONB,
    "assessedBy" INTEGER,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuitabilityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionRecord" (
    "id" SERIAL NOT NULL,
    "callId" INTEGER NOT NULL,
    "transactionType" TEXT,
    "instrumentType" TEXT,
    "executionVenue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(15,2),
    "currency" TEXT DEFAULT 'USD',
    "reportingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "reportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "dataType" TEXT NOT NULL,
    "retentionPeriodDays" INTEGER NOT NULL,
    "autoDeleteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastCleanupDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceRule_regulation_idx" ON "ComplianceRule"("regulation");

-- CreateIndex
CREATE INDEX "ComplianceRule_organizationId_idx" ON "ComplianceRule"("organizationId");

-- CreateIndex
CREATE INDEX "ComplianceRule_isActive_idx" ON "ComplianceRule"("isActive");

-- CreateIndex
CREATE INDEX "ComplianceCheck_callId_idx" ON "ComplianceCheck"("callId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_ruleId_idx" ON "ComplianceCheck"("ruleId");

-- CreateIndex
CREATE INDEX "ComplianceCheck_status_idx" ON "ComplianceCheck"("status");

-- CreateIndex
CREATE INDEX "ComplianceCheck_checkedAt_idx" ON "ComplianceCheck"("checkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCategorization_leadId_key" ON "ClientCategorization"("leadId");

-- CreateIndex
CREATE INDEX "ClientCategorization_category_idx" ON "ClientCategorization"("category");

-- CreateIndex
CREATE INDEX "ClientCategorization_assessmentDate_idx" ON "ClientCategorization"("assessmentDate");

-- CreateIndex
CREATE INDEX "SuitabilityAssessment_leadId_idx" ON "SuitabilityAssessment"("leadId");

-- CreateIndex
CREATE INDEX "SuitabilityAssessment_callId_idx" ON "SuitabilityAssessment"("callId");

-- CreateIndex
CREATE INDEX "SuitabilityAssessment_assessmentDate_idx" ON "SuitabilityAssessment"("assessmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionRecord_callId_key" ON "TransactionRecord"("callId");

-- CreateIndex
CREATE INDEX "TransactionRecord_timestamp_idx" ON "TransactionRecord"("timestamp");

-- CreateIndex
CREATE INDEX "TransactionRecord_reportingStatus_idx" ON "TransactionRecord"("reportingStatus");

-- CreateIndex
CREATE INDEX "TransactionRecord_transactionType_idx" ON "TransactionRecord"("transactionType");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_organizationId_idx" ON "DataRetentionPolicy"("organizationId");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_dataType_idx" ON "DataRetentionPolicy"("dataType");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_organizationId_dataType_key" ON "DataRetentionPolicy"("organizationId", "dataType");

-- AddForeignKey
ALTER TABLE "ComplianceRule" ADD CONSTRAINT "ComplianceRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ComplianceRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCategorization" ADD CONSTRAINT "ClientCategorization_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuitabilityAssessment" ADD CONSTRAINT "SuitabilityAssessment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionRecord" ADD CONSTRAINT "TransactionRecord_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRetentionPolicy" ADD CONSTRAINT "DataRetentionPolicy_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
