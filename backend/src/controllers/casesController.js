import {
  db,
  addCase,
  deleteCaseById,
  findCaseByExpedienteAndDoc,
  findCaseByTrackingCode,
  updateCase as updateCaseRecord
} from '../data/store.js';

const ensureCaseExists = (caseId, res) => {
  const existing = db.cases.find((c) => c.id === caseId);
  if (!existing) {
    res.status(404).json({ message: 'Caso no encontrado' });
    return null;
  }
  return existing;
};

export const searchCase = async (req, res) => {
  const { numero_expediente, documento_identidad, codigo_seguimiento } = req.body || {};
  if (!codigo_seguimiento && (!numero_expediente || !documento_identidad)) {
    return res.status(400).json({ message: 'Envía código de seguimiento o número de expediente y documento.' });
  }

  const foundCase = codigo_seguimiento
    ? findCaseByTrackingCode(codigo_seguimiento)
    : findCaseByExpedienteAndDoc(numero_expediente, documento_identidad);

  if (!foundCase) {
    return res.status(404).json({ message: 'No se encontró un expediente con esos datos.' });
  }

  const timeline = db.timelineEvents.filter(
    (event) => event.case_id === foundCase.id && event.visible_al_ciudadano
  );
  const documents = db.documents.filter(
    (doc) => doc.case_id === foundCase.id && doc.visible_al_ciudadano
  );
  const payments = db.payments.filter((p) => p.case_id === foundCase.id);

  return res.json({ case: foundCase, timeline, documents, payments });
};

export const listCases = async (_req, res) => {
  return res.json(db.cases);
};

export const createCase = async (req, res) => {
  const {
    numero_expediente,
    codigo_seguimiento,
    denunciante_nombre,
    denunciante_documento,
    estado = 'En revisión',
    fecha_inicio,
    dependencia,
    creado_por_admin_id
  } = req.body || {};

  if (!numero_expediente || !denunciante_nombre || !denunciante_documento || !fecha_inicio || !dependencia) {
    return res.status(400).json({ message: 'Faltan campos obligatorios para crear el caso.' });
  }

  if (db.cases.some((c) => c.numero_expediente === numero_expediente)) {
    return res.status(409).json({ message: 'Ya existe un caso con ese número de expediente.' });
  }

  const newCase = addCase({
    numero_expediente,
    codigo_seguimiento: codigo_seguimiento || `SEG-${Math.random().toString(36).slice(2, 8)}`,
    denunciante_nombre,
    denunciante_documento,
    estado,
    fecha_inicio,
    dependencia,
    creado_por_admin_id: creado_por_admin_id || req.user?.id || null
  });

  return res.status(201).json(newCase);
};

export const updateCase = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const updated = updateCaseRecord(caseId, req.body || {});
  return res.json(updated);
};

export const deleteCase = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  deleteCaseById(caseId);
  return res.status(204).send();
};
