-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "consentMethod" TEXT,
ADD COLUMN     "consentObtained" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentTimestamp" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Call_timestamp_idx" ON "Call"("timestamp");

-- CreateIndex
CREATE INDEX "Call_organizationId_idx" ON "Call"("organizationId");

-- CreateIndex
CREATE INDEX "Call_agentName_idx" ON "Call"("agentName");

-- CreateIndex
CREATE INDEX "Call_organizationId_timestamp_idx" ON "Call"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "Call_consentObtained_idx" ON "Call"("consentObtained");

-- CreateIndex
CREATE INDEX "CallAnalysis_wasDealClosed_idx" ON "CallAnalysis"("wasDealClosed");

-- CreateIndex
CREATE INDEX "CallAnalysis_callType_idx" ON "CallAnalysis"("callType");

-- CreateIndex
CREATE INDEX "CallAnalysis_sentiment_idx" ON "CallAnalysis"("sentiment");

-- CreateIndex
CREATE INDEX "CallAnalysis_wasDealClosed_callType_idx" ON "CallAnalysis"("wasDealClosed", "callType");
