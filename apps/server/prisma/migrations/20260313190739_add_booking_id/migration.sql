/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "bookingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "appointments_bookingId_key" ON "appointments"("bookingId");
