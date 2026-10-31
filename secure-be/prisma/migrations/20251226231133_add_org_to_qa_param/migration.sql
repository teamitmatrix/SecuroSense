-- AlterTable
ALTER TABLE "GlobalQAParameter" ADD COLUMN     "organizationId" INTEGER;

-- AddForeignKey
ALTER TABLE "GlobalQAParameter" ADD CONSTRAINT "GlobalQAParameter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
