/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Assistant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Content` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Integration` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IntegrationEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserClient` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userType` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CLINIC', 'PATIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO');

-- CreateEnum
CREATE TYPE "VisitType" AS ENUM ('LIMPIEZA', 'REVISION', 'EMPASTE', 'ENDODONCIA', 'CORONA', 'EXTRACCION', 'CONSULTA', 'EMERGENCIA');

-- DropForeignKey
ALTER TABLE "public"."Assistant" DROP CONSTRAINT "Assistant_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Content" DROP CONSTRAINT "Content_assistantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Content" DROP CONSTRAINT "Content_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ContentResult" DROP CONSTRAINT "ContentResult_contentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Integration" DROP CONSTRAINT "Integration_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."IntegrationEvent" DROP CONSTRAINT "IntegrationEvent_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserClient" DROP CONSTRAINT "UserClient_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserClient" DROP CONSTRAINT "UserClient_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "clinicId" INTEGER,
ADD COLUMN     "userType" "UserType" NOT NULL;

-- DropTable
DROP TABLE "public"."Assistant";

-- DropTable
DROP TABLE "public"."Client";

-- DropTable
DROP TABLE "public"."Content";

-- DropTable
DROP TABLE "public"."ContentResult";

-- DropTable
DROP TABLE "public"."Integration";

-- DropTable
DROP TABLE "public"."IntegrationEvent";

-- DropTable
DROP TABLE "public"."UserClient";

-- DropEnum
DROP TYPE "public"."AssistantStatus";

-- DropEnum
DROP TYPE "public"."ClientStatus";

-- DropEnum
DROP TYPE "public"."ContentStatus";

-- DropEnum
DROP TYPE "public"."IntegrationStatus";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "Visit" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "VisitType" NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'PROGRAMADA',
    "notes" TEXT,
    "patientId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
