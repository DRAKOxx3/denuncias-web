import { db, addDocument, deleteDocumentById, updateDocumentById } from '../data/store.js';

const ensureCaseExists = (caseId, res) => {
  const existing = db.cases.find((c) => c.id === caseId);
  if (!existing) {
    res.status(404).json({ message: 'Caso no encontrado' });
    return null;
  }
  return existing;
};

export const listDocuments = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const docs = db.documents.filter((doc) => doc.case_id === caseId);
  return res.json(docs);
};

export const uploadDocument = async (req, res) => {
  const caseId = Number(req.params.id);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const { titulo, tipo, path_archivo, visible_al_ciudadano = false } = req.body || {};
  if (!titulo || !tipo || !path_archivo) {
    return res.status(400).json({ message: 'Título, tipo y ruta de archivo son obligatorios.' });
  }

  const doc = addDocument(caseId, { titulo, tipo, path_archivo, visible_al_ciudadano });
  return res.status(201).json(doc);
};

export const updateDocument = async (req, res) => {
  const caseId = Number(req.params.id);
  const documentId = Number(req.params.documentId);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const doc = db.documents.find((d) => d.id === documentId && d.case_id === caseId);
  if (!doc) {
    return res.status(404).json({ message: 'Documento no encontrado para este caso.' });
  }

  const updated = updateDocumentById(documentId, req.body || {});
  return res.json(updated);
};

export const deleteDocument = async (req, res) => {
  const caseId = Number(req.params.id);
  const documentId = Number(req.params.documentId);
  const existing = ensureCaseExists(caseId, res);
  if (!existing) return;

  const doc = db.documents.find((d) => d.id === documentId && d.case_id === caseId);
  if (!doc) {
    return res.status(404).json({ message: 'Documento no encontrado para este caso.' });
  }

  deleteDocumentById(documentId);
  return res.status(204).send();
};
