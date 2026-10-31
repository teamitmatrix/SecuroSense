-- DropIndex
DROP INDEX "Role_name_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';
