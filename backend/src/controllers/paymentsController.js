import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

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
          paymentRequest: true
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
        data: { status: 'APPROVED' }
      });
    }

    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear el pago.' });
  }
};

export const updatePayment = async (req, res) => {
  const id = Number(req.params.id);
  const { status, payerName, payerBank, reference, txHash, paidAt, notes } = req.body || {};

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
        data: { status: 'APPROVED' }
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar el pago.' });
  }
};
