import { Prisma } from '@prisma/client';
import path from 'path';
import { prisma } from '../lib/prisma.js';

const mapAdminCaseSummary = (item) => ({
  id: item.id,
  caseNumber: item.caseNumber,
  citizenName: item.citizenName
});

export const getCasePayments = async (req, res) => {
  const caseId = Number(req.params.caseId);

  try {
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) return res.status(404).json({ message: 'Caso no encontrado' });

    const [paymentRequests, payments] = await Promise.all([
      prisma.paymentRequest.findMany({
        where: { caseId },
        include: {
          bankAccount: true,
          cryptoWallet: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.findMany({
        where: { caseId },
        include: {
          bankAccount: true,
          cryptoWallet: true,
          paymentRequest: true,
          receiptDocument: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.json({ paymentRequests, payments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener pagos.' });
  }
};

export const listPaymentRequests = async (_req, res) => {
  try {
    const paymentRequests = await prisma.paymentRequest.findMany({
      include: {
        bankAccount: true,
        cryptoWallet: true,
        case: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(paymentRequests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar solicitudes de pago.' });
  }
};

export const listPayments = async (_req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: {
          include: { case: true }
        },
        case: true,
        receiptDocument: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(payments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar pagos.' });
  }
};

export const createPaymentRequest = async (req, res) => {
  const caseId = Number(req.params.caseId);
  const {
    amount,
    currency,
    methodType,
    methodCode,
    bankAccountId,
    cryptoWalletId,
    dueDate,
    qrImageUrl,
    notesForClient,
    internalNotes
  } = req.body || {};

  if (!amount || !currency || !methodType || !methodCode) {
    return res.status(400).json({ message: 'amount, currency, methodType y methodCode son obligatorios.' });
  }

  try {
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) return res.status(404).json({ message: 'Caso no encontrado' });

    const created = await prisma.paymentRequest.create({
      data: {
        caseId,
        amount: new Prisma.Decimal(amount),
        currency,
        methodType,
        methodCode,
        bankAccountId: bankAccountId ? Number(bankAccountId) : null,
        cryptoWalletId: cryptoWalletId ? Number(cryptoWalletId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        qrImageUrl: qrImageUrl || null,
        notesForClient: notesForClient || null,
        internalNotes: internalNotes || null
      },
      include: {
        bankAccount: true,
        cryptoWallet: true
      }
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear la solicitud de pago.' });
  }
};

export const createPaymentRequestGlobal = async (req, res) => {
  if (!req.body?.caseId) {
    return res.status(400).json({ message: 'caseId es obligatorio para crear la solicitud.' });
  }

  req.params.caseId = req.body.caseId;
  return createPaymentRequest(req, res);
};

export const updatePaymentRequest = async (req, res) => {
  const id = Number(req.params.id);
  const { status, amount, currency, dueDate, qrImageUrl, notesForClient, internalNotes } = req.body || {};

  try {
    const existing = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Solicitud de pago no encontrada' });

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: status || existing.status,
        amount: amount != null ? new Prisma.Decimal(amount) : existing.amount,
        currency: currency || existing.currency,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
        qrImageUrl: qrImageUrl !== undefined ? qrImageUrl : existing.qrImageUrl,
        notesForClient: notesForClient !== undefined ? notesForClient : existing.notesForClient,
        internalNotes: internalNotes !== undefined ? internalNotes : existing.internalNotes
      },
      include: {
        bankAccount: true,
        cryptoWallet: true
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar la solicitud de pago.' });
  }
};

export const createPayment = async (req, res) => {
  const caseId = Number(req.params.caseId);
  const {
    paymentRequestId,
    amount,
    currency,
    methodType,
    methodCode,
    bankAccountId,
    cryptoWalletId,
    status = 'PENDING',
    payerName,
    payerBank,
    reference,
    bankReference,
    txHash,
    paidAt,
    notes
  } = req.body || {};

  if (!amount || !currency || !methodType || !methodCode) {
    return res.status(400).json({ message: 'amount, currency, methodType y methodCode son obligatorios.' });
  }

  try {
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) return res.status(404).json({ message: 'Caso no encontrado' });

    if (paymentRequestId) {
      const request = await prisma.paymentRequest.findUnique({ where: { id: Number(paymentRequestId) } });
      if (!request || request.caseId !== caseId) {
        return res.status(400).json({ message: 'La solicitud de pago no pertenece al caso indicado.' });
      }
    }

    const created = await prisma.payment.create({
      data: {
        caseId,
        paymentRequestId: paymentRequestId ? Number(paymentRequestId) : null,
        amount: new Prisma.Decimal(amount),
        currency,
        methodType,
        methodCode,
        bankAccountId: bankAccountId ? Number(bankAccountId) : null,
        cryptoWalletId: cryptoWalletId ? Number(cryptoWalletId) : null,
        status,
        payerName: payerName || null,
        payerBank: payerBank || null,
        reference: reference || null,
        bankReference: bankReference || null,
        txHash: txHash || null,
        paidAt: paidAt ? new Date(paidAt) : null,
        notes: notes || null
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: true
      }
    });

    if (paymentRequestId && status === 'APPROVED') {
      await prisma.paymentRequest.update({
        where: { id: Number(paymentRequestId) },
        data: { status: 'PAID' }
      });
    }

    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear el pago.' });
  }
};

export const createPaymentGlobal = async (req, res) => {
  if (!req.body?.caseId) {
    return res.status(400).json({ message: 'caseId es obligatorio para registrar el pago.' });
  }
  req.params.caseId = req.body.caseId;
  return createPayment(req, res);
};

export const updatePayment = async (req, res) => {
  const id = Number(req.params.id);
  const { status, payerName, payerBank, reference, bankReference, txHash, paidAt, notes } = req.body || {};

  try {
    const existing = await prisma.payment.findUnique({ where: { id }, include: { paymentRequest: true } });
    if (!existing) return res.status(404).json({ message: 'Pago no encontrado' });

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: status || existing.status,
        payerName: payerName !== undefined ? payerName : existing.payerName,
        payerBank: payerBank !== undefined ? payerBank : existing.payerBank,
        reference: reference !== undefined ? reference : existing.reference,
        bankReference: bankReference !== undefined ? bankReference : existing.bankReference,
        txHash: txHash !== undefined ? txHash : existing.txHash,
        paidAt: paidAt !== undefined ? (paidAt ? new Date(paidAt) : null) : existing.paidAt,
        notes: notes !== undefined ? notes : existing.notes
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: true
      }
    });

    if (existing.paymentRequestId && status === 'APPROVED') {
      await prisma.paymentRequest.update({
        where: { id: existing.paymentRequestId },
        data: { status: 'PAID' }
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar el pago.' });
  }
};

export const listBankAccounts = async (_req, res) => {
  try {
    const bankAccounts = await prisma.bankAccount.findMany({ orderBy: { label: 'asc' } });
    return res.json(bankAccounts);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar cuentas bancarias.' });
  }
};

export const listCryptoWallets = async (_req, res) => {
  try {
    const wallets = await prisma.cryptoWallet.findMany({ orderBy: { label: 'asc' } });
    return res.json(wallets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar wallets.' });
  }
};

export const listPaymentResources = async (_req, res) => {
  try {
    const [bankAccounts, cryptoWallets, cases] = await Promise.all([
      prisma.bankAccount.findMany({ orderBy: { label: 'asc' } }),
      prisma.cryptoWallet.findMany({ orderBy: { label: 'asc' } }),
      prisma.case.findMany({
        select: { id: true, caseNumber: true, citizenName: true },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return res.json({
      bankAccounts,
      cryptoWallets,
      cases: cases.map(mapAdminCaseSummary)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al cargar recursos de pagos.' });
  }
};

const cleanString = (value) => (typeof value === 'string' ? value.trim() : value);

const handlePrismaConstraint = (error, res, fallbackMessage) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : '';
    const fieldMessage = target?.includes('iban')
      ? 'Ya existe una cuenta con este IBAN.'
      : target?.includes('address')
        ? 'Ya existe una wallet con esa dirección.'
        : 'El registro ya existe.';
    return res.status(400).json({ message: fieldMessage });
  }
  console.error(error);
  return res.status(500).json({ message: fallbackMessage });
};

export const createBankAccount = async (req, res) => {
  const label = cleanString(req.body?.label);
  const bankName = cleanString(req.body?.bankName);
  const iban = cleanString(req.body?.iban);
  const bic = cleanString(req.body?.bic);
  const country = cleanString(req.body?.country) || 'ES';
  const currency = cleanString(req.body?.currency);
  const notes = cleanString(req.body?.notes);

  if (!label || !bankName || !iban || !currency) {
    return res.status(400).json({ message: 'label, bankName, iban y currency son obligatorios.' });
  }

  try {
    const created = await prisma.bankAccount.create({
      data: {
        label,
        bankName,
        iban,
        bic: bic || null,
        country,
        currency,
        notes: notes || null
      }
    });
    return res.status(201).json(created);
  } catch (error) {
    return handlePrismaConstraint(error, res, 'Error al crear la cuenta bancaria.');
  }
};

export const updateBankAccount = async (req, res) => {
  const id = Number(req.params.id);
  const { label, bankName, iban, bic, country, currency, notes, isActive } = req.body || {};

  try {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });

    const updated = await prisma.bankAccount.update({
      where: { id },
      data: {
        label: label !== undefined ? cleanString(label) : existing.label,
        bankName: bankName !== undefined ? cleanString(bankName) : existing.bankName,
        iban: iban !== undefined ? cleanString(iban) : existing.iban,
        bic: bic !== undefined ? cleanString(bic) : existing.bic,
        country: country !== undefined ? cleanString(country) || 'ES' : existing.country,
        currency: currency !== undefined ? cleanString(currency) : existing.currency,
        notes: notes !== undefined ? cleanString(notes) : existing.notes,
        isActive: isActive ?? existing.isActive
      }
    });

    return res.json(updated);
  } catch (error) {
    return handlePrismaConstraint(error, res, 'Error al actualizar la cuenta bancaria.');
  }
};

export const deactivateBankAccount = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Cuenta bancaria no encontrada' });

    const updated = await prisma.bankAccount.update({ where: { id }, data: { isActive: false } });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al desactivar la cuenta bancaria.' });
  }
};

export const createCryptoWallet = async (req, res) => {
  const label = cleanString(req.body?.label);
  const asset = cleanString(req.body?.asset);
  const network = cleanString(req.body?.network);
  const address = cleanString(req.body?.address);
  const notes = cleanString(req.body?.notes);
  const currency = cleanString(req.body?.currency) || asset || 'CRYPTO';
  const isActive = req.body?.isActive;

  if (!label || !network || !address) {
    return res.status(400).json({ message: 'label, network y address son obligatorios.' });
  }

  try {
    const created = await prisma.cryptoWallet.create({
      data: {
        label,
        asset: asset || currency || 'CRYPTO',
        network,
        address,
        notes: notes || null,
        isActive: isActive ?? true,
        currency
      }
    });
    return res.status(201).json(created);
  } catch (error) {
    return handlePrismaConstraint(error, res, 'Error al crear la wallet.');
  }
};

export const updateCryptoWallet = async (req, res) => {
  const id = Number(req.params.id);
  const { label, asset, network, address, notes, currency, isActive } = req.body || {};

  try {
    const existing = await prisma.cryptoWallet.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Wallet no encontrada' });

    const updated = await prisma.cryptoWallet.update({
      where: { id },
      data: {
        label: label !== undefined ? cleanString(label) : existing.label,
        asset: asset !== undefined ? cleanString(asset) : existing.asset,
        currency: currency !== undefined ? cleanString(currency) : existing.currency,
        network: network !== undefined ? cleanString(network) : existing.network,
        address: address !== undefined ? cleanString(address) : existing.address,
        notes: notes !== undefined ? cleanString(notes) : existing.notes,
        isActive: isActive ?? existing.isActive
      }
    });
    return res.json(updated);
  } catch (error) {
    return handlePrismaConstraint(error, res, 'Error al actualizar la wallet.');
  }
};

export const deactivateCryptoWallet = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const existing = await prisma.cryptoWallet.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Wallet no encontrada' });

    const updated = await prisma.cryptoWallet.update({ where: { id }, data: { isActive: false } });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al desactivar la wallet.' });
  }
};

export const confirmPaymentRequestPublic = async (req, res) => {
  const requestId = Number(req.params.id);
  const { payerName, payerBank, bankReference, txHash, paidAt, caseId } = req.body || {};
  const file = req.file;

  if (!payerName || !file || !caseId) {
    return res.status(400).json({ message: 'Nombre del pagador, caso y comprobante son obligatorios.' });
  }

  try {
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { bankAccount: true, cryptoWallet: true }
    });

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Solicitud de pago no encontrada' });
    }

    if (caseId && paymentRequest.caseId !== Number(caseId)) {
      return res.status(400).json({ message: 'La solicitud de pago no corresponde a este caso.' });
    }

    if (!['PENDING', 'SENT', 'AWAITING_CONFIRMATION'].includes(paymentRequest.status)) {
      return res.status(400).json({ message: 'La solicitud no admite confirmación en su estado actual.' });
    }

    const relativePath = `/uploads/${path.basename(file.path)}`;
    const receiptDocument = await prisma.document.create({
      data: {
        caseId: paymentRequest.caseId,
        title: `Comprobante pago ${paymentRequest.id}`,
        type: file.mimetype || 'receipt',
        filePath: relativePath,
        isPublic: false
      }
    });

    const createdPayment = await prisma.payment.create({
      data: {
        caseId: paymentRequest.caseId,
        paymentRequestId: paymentRequest.id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        methodType: paymentRequest.methodType,
        methodCode: paymentRequest.methodCode,
        bankAccountId: paymentRequest.bankAccountId,
        cryptoWalletId: paymentRequest.cryptoWalletId,
        status: 'PENDING_REVIEW',
        payerName,
        payerBank: payerBank || null,
        bankReference: bankReference || null,
        txHash: txHash || null,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        receiptDocumentId: receiptDocument.id
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: true,
        receiptDocument: true
      }
    });

    const updatedRequest = await prisma.paymentRequest.update({
      where: { id: paymentRequest.id },
      data: { status: 'AWAITING_CONFIRMATION' }
    });

    return res.status(201).json({ paymentRequest: updatedRequest, payment: createdPayment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al registrar el comprobante de pago.' });
  }
};

export const reviewPayment = async (req, res) => {
  const id = Number(req.params.id);
  const { action, adminComment } = req.body || {};

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ message: 'Acción inválida para revisión.' });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { paymentRequest: true }
    });

    if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });

    const nextStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const nextRequestStatus = action === 'APPROVE' ? 'PAID' : 'PENDING';

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: nextStatus,
        notes: adminComment ? `${payment.notes ? `${payment.notes} | ` : ''}${adminComment}` : payment.notes
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: true,
        receiptDocument: true,
        case: true
      }
    });

    if (payment.paymentRequestId) {
      await prisma.paymentRequest.update({ where: { id: payment.paymentRequestId }, data: { status: nextRequestStatus } });
    }

    return res.json(updatedPayment);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al revisar el pago.' });
  }
};
