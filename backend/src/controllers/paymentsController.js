import { db, addPayment, deletePaymentById, updatePaymentById } from '../data/store.js';

const ensureCaseExists = (caseId, res) => {
  const existing = db.cases.find((c) => c.id === caseId);
  if (!existing) {
    res.status(404).json({ message: 'Caso no encontrado' });
    return null;
  }
  return existing;
};

export const listPayments = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const payments = db.payments.filter((p) => p.case_id === caseId);
  return res.json(payments);
};

export const createPayment = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const { concepto, monto, estado = 'pendiente', fecha_vencimiento, fecha_pago = null, comprobante_document_id = null } =
    req.body || {};

  if (!concepto || monto == null || !fecha_vencimiento) {
    return res.status(400).json({ message: 'Concepto, monto y fecha de vencimiento son obligatorios.' });
  }

  const payment = addPayment(caseId, {
    concepto,
    monto,
    estado,
    fecha_vencimiento,
    fecha_pago,
    comprobante_document_id
  });

  return res.status(201).json(payment);
};

export const updatePayment = async (req, res) => {
  const caseId = Number(req.params.id);
  const paymentId = Number(req.params.paymentId);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const payment = db.payments.find((p) => p.id === paymentId && p.case_id === caseId);
  if (!payment) {
    return res.status(404).json({ message: 'Pago no encontrado para este caso.' });
  }

  const updated = updatePaymentById(paymentId, req.body || {});
  return res.json(updated);
};

export const deletePayment = async (req, res) => {
  const caseId = Number(req.params.id);
  const paymentId = Number(req.params.paymentId);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const payment = db.payments.find((p) => p.id === paymentId && p.case_id === caseId);
  if (!payment) {
    return res.status(404).json({ message: 'Pago no encontrado para este caso.' });
  }

  deletePaymentById(paymentId);
  return res.status(204).send();
};
