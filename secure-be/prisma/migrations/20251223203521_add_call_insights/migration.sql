-- AlterTable
ALTER TABLE "CallAnalysis" ADD COLUMN     "callType" TEXT DEFAULT 'Discovery',
ADD COLUMN     "customerDetails" JSONB,
ADD COLUMN     "wasDealClosed" BOOLEAN NOT NULL DEFAULT false;
