import { prisma } from '../lib/prisma.js';

const mapPayment = (payment) => ({
  id: payment.id,
  case_id: payment.caseId,
  concepto: payment.concept,
  monto: payment.amount,
  estado: payment.status,
  fecha_vencimiento: payment.dueDate.toISOString(),
  fecha_pago: payment.paidAt ? payment.paidAt.toISOString() : null,
  comprobante_path: payment.receiptPath || null,
  creado_en: payment.createdAt.toISOString()
});

export const listPayments = async (req, res) => {
  const caseId = Number(req.params.id);

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) return res.status(404).json({ message: 'Caso no encontrado' });

    const payments = await prisma.payment.findMany({ where: { caseId } });
    return res.json(payments.map(mapPayment));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar pagos.' });
  }
};

export const createPayment = async (req, res) => {
  const caseId = Number(req.params.id);
  const { concepto, monto, estado = 'pendiente', fecha_vencimiento, fecha_pago = null, comprobante_path = null } =
    req.body || {};

  if (!concepto || monto == null || !fecha_vencimiento) {
    return res.status(400).json({ message: 'Concepto, monto y fecha de vencimiento son obligatorios.' });
  }

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) return res.status(404).json({ message: 'Caso no encontrado' });

    const payment = await prisma.payment.create({
      data: {
        caseId,
        concept: concepto,
        amount: Number(monto),
        status: estado,
        dueDate: new Date(fecha_vencimiento),
        paidAt: fecha_pago ? new Date(fecha_pago) : null,
        receiptPath: comprobante_path || null
      }
    });

    return res.status(201).json(mapPayment(payment));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear pago.' });
  }
};

export const updatePayment = async (req, res) => {
  const caseId = Number(req.params.id);
  const paymentId = Number(req.params.paymentId);
  const updates = req.body || {};

  try {
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, caseId } });
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado para este caso.' });
    }

    const data = {};
    if (updates.concepto) data.concept = updates.concepto;
    if (updates.monto !== undefined) data.amount = Number(updates.monto);
    if (updates.estado) data.status = updates.estado;
    if (updates.fecha_vencimiento) data.dueDate = new Date(updates.fecha_vencimiento);
    if (updates.fecha_pago !== undefined) data.paidAt = updates.fecha_pago ? new Date(updates.fecha_pago) : null;
    if (updates.comprobante_path !== undefined) data.receiptPath = updates.comprobante_path || null;

    const updated = await prisma.payment.update({ where: { id: paymentId }, data });
    return res.json(mapPayment(updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar pago.' });
  }
};

export const deletePayment = async (req, res) => {
  const caseId = Number(req.params.id);
  const paymentId = Number(req.params.paymentId);

  try {
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, caseId } });
    if (!payment) {
      return res.status(404).json({ message: 'Pago no encontrado para este caso.' });
    }

    await prisma.payment.delete({ where: { id: paymentId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar pago.' });
  }
};
