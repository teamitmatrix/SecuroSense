-- CreateTable
CREATE TABLE "GlobalQAParameter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "passCriteria" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT 'General',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalQAParameter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GlobalQAParameter_industry_idx" ON "GlobalQAParameter"("industry");
