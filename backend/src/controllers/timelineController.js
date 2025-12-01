import {
  db,
  addTimelineEvent,
  deleteTimelineEventById,
  updateTimelineEventById
} from '../data/store.js';

const ensureCaseExists = (caseId, res) => {
  const existing = db.cases.find((c) => c.id === caseId);
  if (!existing) {
    res.status(404).json({ message: 'Caso no encontrado' });
    return null;
  }
  return existing;
};

export const listTimeline = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const events = db.timelineEvents.filter((event) => event.case_id === caseId);
  return res.json(events);
};

export const createTimelineEvent = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const { fecha_evento, tipo_evento, descripcion, document_id = null, visible_al_ciudadano = false } = req.body || {};
  if (!fecha_evento || !tipo_evento || !descripcion) {
    return res.status(400).json({ message: 'Fecha, tipo de evento y descripción son obligatorios.' });
  }

  const event = addTimelineEvent(caseId, {
    fecha_evento,
    tipo_evento,
    descripcion,
    document_id,
    visible_al_ciudadano
  });

  return res.status(201).json(event);
};

export const updateTimelineEvent = async (req, res) => {
  const caseId = Number(req.params.id);
  const eventId = Number(req.params.eventId);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const event = db.timelineEvents.find((e) => e.id === eventId && e.case_id === caseId);
  if (!event) {
    return res.status(404).json({ message: 'Evento de timeline no encontrado para este caso.' });
  }

  const updated = updateTimelineEventById(eventId, req.body || {});
  return res.json(updated);
};

export const deleteTimelineEvent = async (req, res) => {
  const caseId = Number(req.params.id);
  const eventId = Number(req.params.eventId);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const event = db.timelineEvents.find((e) => e.id === eventId && e.case_id === caseId);
  if (!event) {
    return res.status(404).json({ message: 'Evento de timeline no encontrado para este caso.' });
  }

  deleteTimelineEventById(eventId);
  return res.status(204).send();
};
