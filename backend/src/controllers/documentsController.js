import { prisma } from '../lib/prisma.js';

const mapDocument = (doc) => ({
  id: doc.id,
  case_id: doc.caseId,
  titulo: doc.title,
  tipo: doc.type,
  path_archivo: doc.filePath,
  visible_al_ciudadano: doc.isPublic,
  creado_en: doc.createdAt.toISOString()
});

export const listDocuments = async (req, res) => {
  const caseId = Number(req.params.id);

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) return res.status(404).json({ message: 'Caso no encontrado' });

    const documents = await prisma.document.findMany({ where: { caseId } });
    return res.json(documents.map(mapDocument));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al listar documentos.' });
  }
};

export const createDocument = async (req, res) => {
  const caseId = Number(req.params.id);
  const { titulo, tipo, path_archivo, visible_al_ciudadano = false } = req.body || {};

  if (!titulo || !tipo || !path_archivo) {
    return res.status(400).json({ message: 'Título, tipo y ruta de archivo son obligatorios.' });
  }

  try {
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) return res.status(404).json({ message: 'Caso no encontrado' });

    const document = await prisma.document.create({
      data: {
        caseId,
        title: titulo,
        type: tipo,
        filePath: path_archivo,
        isPublic: visible_al_ciudadano
      }
    });

    return res.status(201).json(mapDocument(document));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al crear documento.' });
  }
};

export const updateDocument = async (req, res) => {
  const caseId = Number(req.params.id);
  const documentId = Number(req.params.documentId);
  const updates = req.body || {};

  try {
    const document = await prisma.document.findFirst({ where: { id: documentId, caseId } });
    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado para este caso.' });
    }

    const data = {};
    if (updates.titulo) data.title = updates.titulo;
    if (updates.tipo) data.type = updates.tipo;
    if (updates.path_archivo) data.filePath = updates.path_archivo;
    if (updates.visible_al_ciudadano !== undefined) data.isPublic = updates.visible_al_ciudadano;

    const updated = await prisma.document.update({ where: { id: documentId }, data });
    return res.json(mapDocument(updated));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al actualizar documento.' });
  }
};

export const deleteDocument = async (req, res) => {
  const caseId = Number(req.params.id);
  const documentId = Number(req.params.documentId);

  try {
    const document = await prisma.document.findFirst({ where: { id: documentId, caseId } });
    if (!document) {
      return res.status(404).json({ message: 'Documento no encontrado para este caso.' });
    }

    await prisma.document.delete({ where: { id: documentId } });
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al eliminar documento.' });
  }
};
