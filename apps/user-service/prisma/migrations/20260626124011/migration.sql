/*
  Warnings:

  - You are about to drop the column `authId` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_authId_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "authId";
