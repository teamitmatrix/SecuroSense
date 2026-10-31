-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "agentNameAr" TEXT,
ADD COLUMN     "customerNameAr" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "customerNameAr" TEXT;
