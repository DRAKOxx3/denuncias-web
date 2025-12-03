import { Prisma } from '@prisma/client';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { TIMELINE_EVENT_TYPES } from '../constants/timelineTypes.js';

const FIAT_CURRENCIES = ['EUR', 'USD', 'GBP', 'MXN', 'COP', 'CLP', 'ARS'];
const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'USDT', 'USDC', 'DAI', 'SOL'];

const mapAdminCaseSummary = (item) => ({
  id: item.id,
  caseNumber: item.caseNumber,
  citizenName: item.citizenName
});

const buildReceiptUrl = (receiptDocument) => {
  if (!receiptDocument?.filePath) return null;
  const publicBase = process.env.PUBLIC_BASE_URL || '';
  return `${publicBase}${receiptDocument.filePath}`;
};

const formatMethodLabel = (methodType, methodCode, bankLabel, walletLabel) => {
  if (methodType === 'BANK_TRANSFER') {
    const method = methodCode ? `transferencia ${methodCode}` : 'transferencia bancaria';
    return bankLabel ? `${method} (${bankLabel})` : method;
  }
  const method = methodCode ? `cripto ${methodCode}` : 'pago cripto';
  return walletLabel ? `${method} (${walletLabel})` : method;
};

const recordTimelineEvent = async (caseId, type, description) => {
  try {
    await prisma.timelineEvent.create({
      data: {
        caseId,
        type,
        description,
        date: new Date()
      }
    });
  } catch (err) {
    console.error('No se pudo registrar evento de timeline', err);
  }
};

const respondValidation = (res, errors, fallbackMessage = 'Errores de validación') => {
  const hasErrors = errors && Object.keys(errors).length > 0;
  if (hasErrors) {
    return res.status(400).json({ message: fallbackMessage, errors });
  }
  return null;
};

const normalizeCurrency = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

const validatePaymentRequestInput = async ({
  amount,
  currency,
  methodType,
  methodCode,
  bankAccountId,
  cryptoWalletId,
  dueDate
}) => {
  const errors = {};
  const parsedAmount = amount != null ? Number(amount) : null;
  const normalizedCurrency = normalizeCurrency(currency);

  if (parsedAmount == null || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'El importe debe ser mayor a 0.';
  }

  if (!normalizedCurrency) {
    errors.currency = 'La moneda es obligatoria.';
  }

  if (!methodType) {
    errors.methodType = 'Selecciona un tipo de método.';
  }

  if (!methodCode) {
    errors.methodCode = 'Ingresa el código del método (ej: SEPA, BTC, USDT_TRC20).';
  }

  if (dueDate) {
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.dueDate = 'La fecha de vencimiento es inválida.';
    } else if (parsed < new Date()) {
      errors.dueDate = 'La fecha de vencimiento no puede estar en el pasado.';
    }
  }

  const method = methodType;
  if (method === 'BANK_TRANSFER') {
    if (!bankAccountId) {
      errors.bankAccountId = 'Debes seleccionar una cuenta bancaria activa.';
    }
    if (normalizedCurrency && !FIAT_CURRENCIES.includes(normalizedCurrency)) {
      errors.currency = 'Las transferencias solo permiten monedas fiat (ej. EUR).';
    }
  }

  if (method === 'CRYPTO') {
    if (!cryptoWalletId) {
      errors.cryptoWalletId = 'Debes seleccionar una wallet activa.';
    }
    if (normalizedCurrency && FIAT_CURRENCIES.includes(normalizedCurrency)) {
      errors.currency = 'Para pagos cripto usa el ticker del activo (ej. USDT, BTC).';
    }
    if (normalizedCurrency && !CRYPTO_CURRENCIES.includes(normalizedCurrency)) {
      errors.currency = errors.currency || 'Moneda cripto no reconocida (ej. USDT, BTC, ETH).';
    }
  }

  // Validate existence/availability of accounts or wallets
  if (bankAccountId) {
    const bankAccount = await prisma.bankAccount.findFirst({ where: { id: Number(bankAccountId), isActive: true } });
    if (!bankAccount) {
      errors.bankAccountId = 'La cuenta bancaria seleccionada no está activa.';
    }
  }

  if (cryptoWalletId) {
    const wallet = await prisma.cryptoWallet.findFirst({ where: { id: Number(cryptoWalletId), isActive: true } });
    if (!wallet) {
      errors.cryptoWalletId = 'La wallet seleccionada no está activa.';
    }
  }

  return {
    errors,
    parsedAmount,
    normalizedCurrency
  };
};

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

    const paymentsWithUrl = payments.map((payment) => ({
      ...payment,
      receiptUrl: buildReceiptUrl(payment.receiptDocument)
    }));

    return res.json({ paymentRequests, payments: paymentsWithUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al obtener pagos.' });
  }
};

export const listPaymentRequests = async (req, res) => {
  const caseId = req.query.caseId ? Number(req.query.caseId) : undefined;
  const statusParam = req.query.status;
  const methodType = req.query.methodType;

  const statuses = statusParam
    ? String(statusParam)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  try {
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: {
        ...(caseId ? { caseId } : {}),
        ...(statuses?.length ? { status: { in: statuses } } : {}),
        ...(methodType ? { methodType } : {})
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        case: {
          select: { id: true, caseNumber: true, citizenName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(paymentRequests);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar solicitudes de pago.' });
  }
};

export const listPayments = async (req, res) => {
  const caseId = req.query.caseId ? Number(req.query.caseId) : undefined;
  const statusParam = req.query.status;
  const methodType = req.query.methodType;

  const statuses = statusParam
    ? String(statusParam)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  try {
    const payments = await prisma.payment.findMany({
      where: {
        ...(caseId ? { caseId } : {}),
        ...(statuses?.length ? { status: { in: statuses } } : {}),
        ...(methodType ? { methodType } : {})
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: {
          select: {
            id: true,
            amount: true,
            currency: true,
            methodType: true,
            methodCode: true,
            dueDate: true,
            status: true,
            caseId: true
          }
        },
        case: {
          select: { id: true, caseNumber: true, citizenName: true }
        },
        receiptDocument: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const withReceiptUrls = payments.map((payment) => ({
      ...payment,
      receiptUrl: buildReceiptUrl(payment.receiptDocument)
    }));

    return res.json(withReceiptUrls);
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

  try {
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) return res.status(404).json({ message: 'Caso no encontrado' });

    const validation = await validatePaymentRequestInput({
      amount,
      currency,
      methodType,
      methodCode,
      bankAccountId,
      cryptoWalletId,
      dueDate
    });

    if (respondValidation(res, validation.errors)) return;

    const created = await prisma.paymentRequest.create({
      data: {
        caseId,
        amount: new Prisma.Decimal(validation.parsedAmount),
        currency: validation.normalizedCurrency,
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

    const methodLabel = formatMethodLabel(
      created.methodType,
      created.methodCode,
      created.bankAccount?.label,
      created.cryptoWallet?.label
    );
    await recordTimelineEvent(
      caseId,
      TIMELINE_EVENT_TYPES.PAYMENT_REQUEST_CREATED,
      `Solicitud de pago creada por ${created.amount} ${created.currency} vía ${methodLabel}.`
    );

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

    const validation = await validatePaymentRequestInput({
      amount: amount != null ? amount : existing.amount,
      currency: currency || existing.currency,
      methodType: existing.methodType,
      methodCode: existing.methodCode,
      bankAccountId: existing.bankAccountId,
      cryptoWalletId: existing.cryptoWalletId,
      dueDate: dueDate !== undefined ? dueDate : existing.dueDate
    });

    if (respondValidation(res, validation.errors)) return;

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: status || existing.status,
        amount: amount != null ? new Prisma.Decimal(validation.parsedAmount) : existing.amount,
        currency: validation.normalizedCurrency || existing.currency,
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

  try {
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) return res.status(404).json({ message: 'Caso no encontrado' });

    let request = null;
    if (paymentRequestId) {
      request = await prisma.paymentRequest.findUnique({ where: { id: Number(paymentRequestId) } });
      if (!request || request.caseId !== caseId) {
        return res.status(400).json({ message: 'La solicitud de pago no pertenece al caso indicado.' });
      }
    }

    const effectiveMethodType = request?.methodType || methodType;
    const effectiveMethodCode = request?.methodCode || methodCode;
    const effectiveCurrency = currency || request?.currency;
    const effectiveBankAccountId = bankAccountId || request?.bankAccountId;
    const effectiveWalletId = cryptoWalletId || request?.cryptoWalletId;

    const validation = await validatePaymentRequestInput({
      amount,
      currency: effectiveCurrency,
      methodType: effectiveMethodType,
      methodCode: effectiveMethodCode,
      bankAccountId: effectiveBankAccountId,
      cryptoWalletId: effectiveWalletId
    });

    if (respondValidation(res, validation.errors)) return;

    const created = await prisma.payment.create({
      data: {
        caseId,
        paymentRequestId: paymentRequestId ? Number(paymentRequestId) : null,
        amount: new Prisma.Decimal(validation.parsedAmount),
        currency: validation.normalizedCurrency,
        methodType: effectiveMethodType,
        methodCode: effectiveMethodCode,
        bankAccountId: effectiveBankAccountId ? Number(effectiveBankAccountId) : null,
        cryptoWalletId: effectiveWalletId ? Number(effectiveWalletId) : null,
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
        data: { status: 'APPROVED' }
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
        data: { status: 'APPROVED' }
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
      prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: { label: 'asc' } }),
      prisma.cryptoWallet.findMany({ where: { isActive: true }, orderBy: { label: 'asc' } }),
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

  const errors = {};
  if (!payerName) errors.payerName = 'Indica el nombre del pagador.';
  if (!file) errors.receipt = 'Debes adjuntar el comprobante del pago.';
  if (!caseId) errors.caseId = 'Falta el identificador del caso.';

  try {
    const paymentRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      include: { bankAccount: true, cryptoWallet: true, payments: true }
    });

    if (!paymentRequest) {
      return res.status(404).json({ message: 'Solicitud de pago no encontrada' });
    }

    if (caseId && paymentRequest.caseId !== Number(caseId)) {
      return res.status(400).json({ message: 'La solicitud de pago no corresponde a este caso.' });
    }

    if (!['PENDING', 'SENT', 'PAID_UNDER_REVIEW'].includes(paymentRequest.status)) {
      return res.status(400).json({
        message: 'La solicitud no admite confirmación en su estado actual.',
        errors: { status: 'Esta solicitud ya fue aprobada/rechazada o está expirada.' }
      });
    }

    if (paymentRequest.dueDate && paymentRequest.dueDate < new Date()) {
      return res.status(400).json({
        message: 'La solicitud está vencida y no admite nuevos comprobantes.',
        errors: { dueDate: 'La solicitud está vencida.' }
      });
    }

    const existingPayment = await prisma.payment.findFirst({ where: { paymentRequestId: paymentRequest.id } });
    if (existingPayment) {
      return res.status(400).json({
        message: 'Ya registraste un comprobante para esta solicitud.',
        errors: { receipt: 'Esta solicitud ya tiene un comprobante cargado.' }
      });
    }

    if (paymentRequest.methodType === 'BANK_TRANSFER') {
      if (!payerBank && !bankReference) {
        errors.bankReference = 'Indica el banco emisor o la referencia bancaria.';
      }
    }

    if (paymentRequest.methodType === 'CRYPTO' && !txHash) {
      errors.txHash = 'Incluye el hash de la transacción cripto.';
    }

    if (respondValidation(res, errors)) return;

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
      data: { status: 'PAID_UNDER_REVIEW' }
    });

    const methodLabel = formatMethodLabel(
      paymentRequest.methodType,
      paymentRequest.methodCode,
      paymentRequest.bankAccount?.label,
      paymentRequest.cryptoWallet?.label
    );
    await recordTimelineEvent(
      paymentRequest.caseId,
      TIMELINE_EVENT_TYPES.PAYMENT_CONFIRMATION_SUBMITTED,
      `El ciudadano envió comprobante por ${paymentRequest.amount} ${paymentRequest.currency} vía ${methodLabel}.`
    );

    return res
      .status(201)
      .json({ success: true, paymentRequest: updatedRequest, payment: { ...createdPayment, receiptUrl: buildReceiptUrl(createdPayment.receiptDocument) } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al registrar el comprobante de pago.' });
  }
};

export const reviewPayment = async (req, res) => {
  const id = Number(req.params.id);
  const { action, adminComment, rejectionReason } = req.body || {};

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
    const nextRequestStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const noteSegments = [];
    if (payment.notes) noteSegments.push(payment.notes);
    if (adminComment) noteSegments.push(`Nota admin: ${adminComment}`);
    if (action === 'REJECT' && rejectionReason) noteSegments.push(`Motivo rechazo: ${rejectionReason}`);

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        status: nextStatus,
        notes: noteSegments.length ? noteSegments.join(' | ') : payment.notes,
        rejectionReason: action === 'REJECT' ? rejectionReason || null : null
      },
      include: {
        bankAccount: true,
        cryptoWallet: true,
        paymentRequest: {
          select: {
            id: true,
            amount: true,
            currency: true,
            methodType: true,
            methodCode: true,
            dueDate: true,
            status: true,
            caseId: true
          }
        },
        receiptDocument: true,
        case: {
          select: { id: true, caseNumber: true, citizenName: true }
        }
      }
    });

    if (payment.paymentRequestId) {
      await prisma.paymentRequest.update({ where: { id: payment.paymentRequestId }, data: { status: nextRequestStatus } });
    }

    const methodLabel = formatMethodLabel(
      updatedPayment.methodType,
      updatedPayment.methodCode,
      updatedPayment.bankAccount?.label,
      updatedPayment.cryptoWallet?.label
    );
    const adminNote = adminComment ? ` Nota del admin: ${adminComment}.` : '';
    const rejectionNote = action === 'REJECT' && rejectionReason ? ` Motivo: ${rejectionReason}.` : '';
    await recordTimelineEvent(
      updatedPayment.caseId,
      action === 'APPROVE' ? TIMELINE_EVENT_TYPES.PAYMENT_APPROVED : TIMELINE_EVENT_TYPES.PAYMENT_REJECTED,
      `${action === 'APPROVE' ? 'Pago aprobado' : 'Pago rechazado'} (${updatedPayment.amount} ${updatedPayment.currency} por ${methodLabel}).${adminNote}${rejectionNote}`
    );

    return res.json({ ...updatedPayment, receiptUrl: buildReceiptUrl(updatedPayment.receiptDocument) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al revisar el pago.' });
  }
};
