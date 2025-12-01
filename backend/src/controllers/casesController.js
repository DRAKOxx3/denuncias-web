import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

const toNumber = (value) => (value instanceof Prisma.Decimal ? value.toNumber() : Number(value));

const mapCase = (record) => ({
  id: record.id,
  numero_expediente: record.caseNumber,
  codigo_seguimiento: record.trackingCode,
  denunciante_nombre: record.citizenName,
  denunciante_documento: record.citizenIdNumber,
  estado: record.status,
  fecha_inicio: record.createdAt.toISOString(),
  dependencia: record.assignedDepartment,
  creado_por_admin_id: record.createdByAdminId,
  actualizado_en: record.updatedAt.toISOString()
});

const mapTimelineEvent = (event) => ({
  id: event.id,
  case_id: event.caseId,
  fecha_evento: event.date.toISOString(),
  tipo_evento: event.type,
  descripcion: event.description,
  document_id: null,
  visible_al_ciudadano: true,
  creado_en: event.createdAt.toISOString()
});

const mapDocument = (doc) => ({
  id: doc.id,
  case_id: doc.caseId,
  titulo: doc.title,
  tipo: doc.type,
  path_archivo: doc.filePath,
  visible_al_ciudadano: doc.isPublic,
  creado_en: doc.createdAt.toISOString()
});

const mapPayment = (payment) => ({
  id: payment.id,
  case_id: payment.caseId,
  monto: toNumber(payment.amount),
  moneda: payment.currency,
  estado: payment.status,
  metodo: payment.methodType,
  metodo_codigo: payment.methodCode,
  referencia: payment.reference,
  pagador: payment.payerName,
  banco_pagador: payment.payerBank,
  tx_hash: payment.txHash,
  fecha_pago: payment.paidAt ? payment.paidAt.toISOString() : null,
  creado_en: payment.createdAt.toISOString(),
  solicitud_pago_id: payment.paymentRequestId
});

export const searchCase = async (req, res) => {
  const { numero_expediente, documento_identidad, codigo_seguimiento } = req.body || {};
  if (!codigo_seguimiento && (!numero_expediente || !documento_identidad)) {
    return res.status(400).json({ message: 'Envía código de seguimiento o número de expediente y documento.' });
  }

  try {
    const foundCase = codigo_seguimiento
      ? await prisma.case.findUnique({ where: { trackingCode: codigo_seguimiento } })
      : await prisma.case.findFirst({
          where: {
            caseNumber: numero_expediente,
            citizenIdNumber: documento_identidad
          }
        });

    if (!foundCase) {
      return res.status(404).json({ message: 'No se encontró un expediente con esos datos.' });
    }

    const [timeline, documents, payments] = await Promise.all([
      prisma.timelineEvent.findMany({ where: { caseId: foundCase.id }, orderBy: { date: 'asc' } }),
      prisma.document.findMany({ where: { caseId: foundCase.id, isPublic: true } }),
      prisma.payment.findMany({ where: { caseId: foundCase.id } })
    ]);

    return res.json({
      case: mapCase(foundCase),
      timeline: timeline.map(mapTimelineEvent),
      documents: documents.map(mapDocument),
      payments: payments.map(mapPayment)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al buscar el caso.' });
  }
};

export const listCases = async (_req, res) => {
  try {
    const cases = await prisma.case.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(cases.map(mapCase));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar casos.' });
  }
};

export const createCase = async (req, res) => {
  const {
    numero_expediente,
    codigo_seguimiento,
    denunciante_nombre,
    denunciante_documento,
    estado = 'En revisión',
    dependencia,
    creado_por_admin_id
  } = req.body || {};

  if (!numero_expediente || !denunciante_nombre || !denunciante_documento || !dependencia) {
    return res.status(400).json({ message: 'Faltan campos obligatorios para crear el caso.' });
  }

  try {
    const existing = await prisma.case.findUnique({ where: { caseNumber: numero_expediente } });
    if (existing) {
      return res.status(409).json({ message: 'Ya existe un caso con ese número de expediente.' });
    }

    const created = await prisma.case.create({
      data: {
        caseNumber: numero_expediente,
        trackingCode: codigo_seguimiento || `SEG-${Math.random().toString(36).slice(2, 8)}`,
        citizenName: denunciante_nombre,
        citizenIdNumber: denunciante_documento,
        status: estado,
        assignedDepartment: dependencia,
        createdByAdminId: creado_por_admin_id || req.user?.id || null
      }
    });

    return res.status(201).json(mapCase(created));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear el caso.' });
  }
};

export const updateCase = async (req, res) => {
  const caseId = Number(req.params.id);
  const updates = req.body || {};

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) {
      return res.status(404).json({ message: 'Caso no encontrado' });
    }

    const data = {};
    if (updates.numero_expediente) data.caseNumber = updates.numero_expediente;
    if (updates.codigo_seguimiento) data.trackingCode = updates.codigo_seguimiento;
    if (updates.denunciante_nombre) data.citizenName = updates.denunciante_nombre;
    if (updates.denunciante_documento) data.citizenIdNumber = updates.denunciante_documento;
    if (updates.estado) data.status = updates.estado;
    if (updates.dependencia) data.assignedDepartment = updates.dependencia;
    if (updates.creado_por_admin_id !== undefined) data.createdByAdminId = updates.creado_por_admin_id;

    const updated = await prisma.case.update({ where: { id: caseId }, data });
    return res.json(mapCase(updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar el caso.' });
  }
};

export const deleteCase = async (req, res) => {
  const caseId = Number(req.params.id);

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) {
      return res.status(404).json({ message: 'Caso no encontrado' });
    }

    await prisma.case.delete({ where: { id: caseId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar el caso.' });
  }
};
