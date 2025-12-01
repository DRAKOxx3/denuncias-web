/*
  Warnings:

  - You are about to alter the column `isActive` on the `BankAccount` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `isActive` on the `CryptoWallet` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `isPublic` on the `Document` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - Made the column `updatedAt` on table `BankAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `CryptoWallet` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BankAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BankAccount" ("bankName", "bic", "country", "createdAt", "currency", "iban", "id", "isActive", "label", "notes", "updatedAt") SELECT "bankName", "bic", "country", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "currency", "iban", "id", "isActive", "label", "notes", "updatedAt" FROM "BankAccount";
DROP TABLE "BankAccount";
ALTER TABLE "new_BankAccount" RENAME TO "BankAccount";
CREATE UNIQUE INDEX "BankAccount_iban_key" ON "BankAccount"("iban");
CREATE TABLE "new_Case" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseNumber" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenIdNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "assignedDepartment" TEXT NOT NULL,
    "createdByAdminId" INTEGER,
    CONSTRAINT "Case_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Case" ("assignedDepartment", "caseNumber", "citizenIdNumber", "citizenName", "createdAt", "createdByAdminId", "id", "status", "trackingCode", "updatedAt") SELECT "assignedDepartment", "caseNumber", "citizenIdNumber", "citizenName", "createdAt", "createdByAdminId", "id", "status", "trackingCode", "updatedAt" FROM "Case";
DROP TABLE "Case";
ALTER TABLE "new_Case" RENAME TO "Case";
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");
CREATE UNIQUE INDEX "Case_trackingCode_key" ON "Case"("trackingCode");
CREATE TABLE "new_CryptoWallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "currency" TEXT,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CryptoWallet" ("address", "asset", "createdAt", "currency", "id", "isActive", "label", "network", "notes", "updatedAt") SELECT "address", "asset", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "currency", "id", "isActive", "label", "network", "notes", "updatedAt" FROM "CryptoWallet";
DROP TABLE "CryptoWallet";
ALTER TABLE "new_CryptoWallet" RENAME TO "CryptoWallet";
CREATE UNIQUE INDEX "CryptoWallet_address_key" ON "CryptoWallet"("address");
CREATE TABLE "new_Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("caseId", "createdAt", "filePath", "id", "isPublic", "title", "type") SELECT "caseId", "createdAt", "filePath", "id", "isPublic", "title", "type" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "paymentRequestId" INTEGER,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "methodCode" TEXT NOT NULL,
    "bankAccountId" INTEGER,
    "cryptoWalletId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payerName" TEXT,
    "payerBank" TEXT,
    "reference" TEXT,
    "bankReference" TEXT,
    "txHash" TEXT,
    "paidAt" DATETIME,
    "receiptDocumentId" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_cryptoWalletId_fkey" FOREIGN KEY ("cryptoWalletId") REFERENCES "CryptoWallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_receiptDocumentId_fkey" FOREIGN KEY ("receiptDocumentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "bankAccountId", "bankReference", "caseId", "createdAt", "cryptoWalletId", "currency", "id", "methodCode", "methodType", "notes", "paidAt", "payerBank", "payerName", "paymentRequestId", "receiptDocumentId", "reference", "status", "txHash", "updatedAt") SELECT "amount", "bankAccountId", "bankReference", "caseId", "createdAt", "cryptoWalletId", "currency", "id", "methodCode", "methodType", "notes", "paidAt", "payerBank", "payerName", "paymentRequestId", "receiptDocumentId", "reference", "status", "txHash", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_PaymentRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "methodCode" TEXT NOT NULL,
    "bankAccountId" INTEGER,
    "cryptoWalletId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "qrImageUrl" TEXT,
    "notesForClient" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_cryptoWalletId_fkey" FOREIGN KEY ("cryptoWalletId") REFERENCES "CryptoWallet" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PaymentRequest" ("amount", "bankAccountId", "caseId", "createdAt", "cryptoWalletId", "currency", "dueDate", "id", "internalNotes", "methodCode", "methodType", "notesForClient", "qrImageUrl", "status", "updatedAt") SELECT "amount", "bankAccountId", "caseId", "createdAt", "cryptoWalletId", "currency", "dueDate", "id", "internalNotes", "methodCode", "methodType", "notesForClient", "qrImageUrl", "status", "updatedAt" FROM "PaymentRequest";
DROP TABLE "PaymentRequest";
ALTER TABLE "new_PaymentRequest" RENAME TO "PaymentRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
