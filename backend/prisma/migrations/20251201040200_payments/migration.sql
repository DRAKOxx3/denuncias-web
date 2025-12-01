-- Redefine Payment table to new payment domain and add supporting models
PRAGMA foreign_keys=OFF;
DROP TABLE IF EXISTS "Payment";
PRAGMA foreign_keys=ON;

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "CryptoWallet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "label" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "PaymentRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "methodType" TEXT NOT NULL CHECK ("methodType" IN ('BANK_TRANSFER','CRYPTO')),
    "methodCode" TEXT NOT NULL,
    "bankAccountId" INTEGER,
    "cryptoWalletId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','APPROVED','REJECTED','CANCELLED','EXPIRED')),
    "dueDate" DATETIME,
    "qrImageUrl" TEXT,
    "notesForClient" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRequest_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_cryptoWalletId_fkey" FOREIGN KEY ("cryptoWalletId") REFERENCES "CryptoWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" INTEGER NOT NULL,
    "paymentRequestId" INTEGER,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "methodType" TEXT NOT NULL CHECK ("methodType" IN ('BANK_TRANSFER','CRYPTO')),
    "methodCode" TEXT NOT NULL,
    "bankAccountId" INTEGER,
    "cryptoWalletId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','APPROVED','REJECTED')),
    "payerName" TEXT,
    "payerBank" TEXT,
    "reference" TEXT,
    "txHash" TEXT,
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_cryptoWalletId_fkey" FOREIGN KEY ("cryptoWalletId") REFERENCES "CryptoWallet"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_iban_key" ON "BankAccount"("iban");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoWallet_address_key" ON "CryptoWallet"("address");
