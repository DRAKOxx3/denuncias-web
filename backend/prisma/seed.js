import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.timelineEvent.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.cryptoWallet.deleteMany();
  await prisma.case.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'super_admin'
    }
  });

  const bankAccount = await prisma.bankAccount.create({
    data: {
      label: 'Cuenta EUR Principal',
      bankName: 'Banco Nacional',
      iban: 'ES9820385778983000760236',
      bic: 'BNPAESMM',
      country: 'ES',
      currency: 'EUR',
      notes: 'Cuenta SEPA para pagos locales'
    }
  });

  const altBankAccount = await prisma.bankAccount.create({
    data: {
      label: 'Cuenta EUR Secundaria',
      bankName: 'Banco Regional',
      iban: 'ES1300190020961234567890',
      bic: 'REGNESMM',
      country: 'ES',
      currency: 'EUR',
      notes: 'Cuenta de respaldo'
    }
  });

  const usdtWallet = await prisma.cryptoWallet.create({
    data: {
      label: 'USDT TRC20 Principal',
      asset: 'USDT',
      currency: 'USDT',
      network: 'TRC20',
      address: 'TK8C2pQpExampleTRC20Wallet',
      notes: 'Solo USDT TRC20'
    }
  });

  const btcWallet = await prisma.cryptoWallet.create({
    data: {
      label: 'BTC Legacy',
      asset: 'BTC',
      currency: 'BTC',
      network: 'Bitcoin',
      address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080',
      notes: 'Dirección BTC principal'
    }
  });

  const caseOne = await prisma.case.create({
    data: {
      caseNumber: 'EXP-2024-0001',
      trackingCode: 'ABC123',
      citizenName: 'Juan Pérez',
      citizenIdNumber: '12345678',
      status: 'En revisión',
      assignedDepartment: 'Fiscalía Local',
      createdByAdminId: admin.id,
      timelineEvents: {
        create: [
          {
            date: new Date('2024-01-05'),
            type: 'CREACIÓN',
            description: 'Denuncia creada'
          },
          {
            date: new Date('2024-01-10'),
            type: 'ACTUALIZACIÓN',
            description: 'Caso asignado a investigador'
          }
        ]
      },
      documents: {
        create: [
          {
            title: 'Constancia inicial',
            type: 'PDF',
            filePath: '/docs/constancia.pdf',
            isPublic: true
          }
        ]
      }
    },
    include: { timelineEvents: true }
  });

  const caseTwo = await prisma.case.create({
    data: {
      caseNumber: 'EXP-2024-0002',
      trackingCode: 'XYZ789',
      citizenName: 'Maria Gomez',
      citizenIdNumber: '87654321',
      status: 'En investigación',
      assignedDepartment: 'Unidad de Fraude',
      createdByAdminId: admin.id,
      timelineEvents: {
        create: [
          {
            date: new Date('2024-03-01'),
            type: 'CREACIÓN',
            description: 'Denuncia recibida'
          }
        ]
      }
    }
  });

  const paymentRequestOne = await prisma.paymentRequest.create({
    data: {
      caseId: caseOne.id,
      amount: 50,
      currency: 'EUR',
      methodType: 'BANK_TRANSFER',
      methodCode: 'SEPA',
      bankAccountId: bankAccount.id,
      dueDate: new Date('2024-02-01'),
      notesForClient: 'Use la referencia enviada por email',
      internalNotes: 'Prioritario'
    }
  });

  const paymentRequestTwo = await prisma.paymentRequest.create({
    data: {
      caseId: caseTwo.id,
      amount: 120.5,
      currency: 'EUR',
      methodType: 'CRYPTO',
      methodCode: 'USDT_TRC20',
      cryptoWalletId: usdtWallet.id,
      dueDate: new Date('2024-04-10'),
      qrImageUrl: 'https://example.com/qr/usdt-trc20.png',
      notesForClient: 'Solo USDT en red TRC20',
      internalNotes: 'Verificar al recibir'
    }
  });

  await prisma.payment.create({
    data: {
      caseId: caseOne.id,
      paymentRequestId: paymentRequestOne.id,
      amount: 50,
      currency: 'EUR',
      methodType: 'BANK_TRANSFER',
      methodCode: 'SEPA',
      bankAccountId: bankAccount.id,
      status: 'APPROVED',
      payerName: 'Juan Pérez',
      payerBank: 'Banco del Pagador',
      reference: 'REF-0001',
      paidAt: new Date('2024-01-28'),
      notes: 'Pago confirmado'
    }
  });

  await prisma.payment.create({
    data: {
      caseId: caseTwo.id,
      paymentRequestId: paymentRequestTwo.id,
      amount: 120.5,
      currency: 'EUR',
      methodType: 'CRYPTO',
      methodCode: 'USDT_TRC20',
      cryptoWalletId: usdtWallet.id,
      status: 'PENDING',
      payerName: 'Maria Gomez',
      notes: 'Esperando confirmación en cadena'
    }
  });

  console.log('Seed data created', {
    admin: admin.email,
    cases: [caseOne.caseNumber, caseTwo.caseNumber],
    bankAccounts: [bankAccount.label, altBankAccount.label],
    wallets: [usdtWallet.label, btcWallet.label]
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
