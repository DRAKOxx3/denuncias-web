import { prisma } from '../lib/prisma.js';

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

export const listTimeline = async (req, res) => {
  const caseId = Number(req.params.id);

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) return res.status(404).json({ message: 'Caso no encontrado' });

    const events = await prisma.timelineEvent.findMany({ where: { caseId }, orderBy: { date: 'asc' } });
    return res.json(events.map(mapTimelineEvent));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar eventos.' });
  }
};

export const createTimelineEvent = async (req, res) => {
  const caseId = Number(req.params.id);
  const { fecha_evento, tipo_evento, descripcion } = req.body || {};
  if (!fecha_evento || !tipo_evento || !descripcion) {
    return res.status(400).json({ message: 'Fecha, tipo de evento y descripción son obligatorios.' });
  }

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) return res.status(404).json({ message: 'Caso no encontrado' });

    const event = await prisma.timelineEvent.create({
      data: {
        caseId,
        date: new Date(fecha_evento),
        type: tipo_evento,
        description: descripcion
      }
    });

    return res.status(201).json(mapTimelineEvent(event));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear evento.' });
  }
};

export const updateTimelineEvent = async (req, res) => {
  const caseId = Number(req.params.id);
  const eventId = Number(req.params.eventId);
  const updates = req.body || {};

  try {
    const event = await prisma.timelineEvent.findFirst({ where: { id: eventId, caseId } });
    if (!event) {
      return res.status(404).json({ message: 'Evento de timeline no encontrado para este caso.' });
    }

    const data = {};
    if (updates.fecha_evento) data.date = new Date(updates.fecha_evento);
    if (updates.tipo_evento) data.type = updates.tipo_evento;
    if (updates.descripcion) data.description = updates.descripcion;

    const updated = await prisma.timelineEvent.update({ where: { id: eventId }, data });
    return res.json(mapTimelineEvent(updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar evento.' });
  }
};

export const deleteTimelineEvent = async (req, res) => {
  const caseId = Number(req.params.id);
  const eventId = Number(req.params.eventId);

  try {
    const event = await prisma.timelineEvent.findFirst({ where: { id: eventId, caseId } });
    if (!event) {
      return res.status(404).json({ message: 'Evento de timeline no encontrado para este caso.' });
    }

    await prisma.timelineEvent.delete({ where: { id: eventId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar evento.' });
  }
};
