/*
  Warnings:

  - You are about to drop the `BankAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CryptoWallet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `bankAccountId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `cryptoWalletId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `methodCode` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `methodType` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payerBank` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payerName` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentRequestId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `reference` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - Added the required column `concept` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BankAccount_iban_key";

-- DropIndex
DROP INDEX "CryptoWallet_address_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "BankAccount";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CryptoWallet";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PaymentRequest";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "receiptPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "caseId", "createdAt", "id", "paidAt", "status") SELECT "amount", "caseId", "createdAt", "id", "paidAt", "status" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
