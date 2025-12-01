import bcrypt from 'bcrypt';

const seededPasswordHash = bcrypt.hashSync('admin123', 10);

export const db = {
  cases: [
    {
      id: 1,
      numero_expediente: 'EXP-2024-0001',
      codigo_seguimiento: 'ABC123',
      denunciante_nombre: 'Juan Pérez',
      denunciante_documento: '12345678',
      estado: 'En revisión',
      fecha_inicio: '2024-01-05',
      dependencia: 'Fiscalía Local',
      creado_por_admin_id: 1,
      actualizado_en: new Date('2024-01-10').toISOString()
    }
  ],
  timelineEvents: [
    {
      id: 1,
      case_id: 1,
      fecha_evento: '2024-01-05',
      tipo_evento: 'CREACIÓN',
      descripcion: 'Denuncia creada',
      document_id: null,
      visible_al_ciudadano: true
    },
    {
      id: 2,
      case_id: 1,
      fecha_evento: '2024-01-10',
      tipo_evento: 'ACTUALIZACIÓN',
      descripcion: 'Caso asignado a investigador',
      document_id: null,
      visible_al_ciudadano: true
    }
  ],
  documents: [
    {
      id: 1,
      case_id: 1,
      titulo: 'Constancia inicial',
      tipo: 'PDF',
      path_archivo: '/docs/constancia.pdf',
      visible_al_ciudadano: true,
      creado_en: new Date('2024-01-05').toISOString()
    }
  ],
  payments: [
    {
      id: 1,
      case_id: 1,
      concepto: 'Tasa administrativa',
      monto: 50.0,
      estado: 'pendiente',
      fecha_vencimiento: '2024-02-01',
      fecha_pago: null,
      comprobante_document_id: null
    }
  ],
  users: [
    {
      id: 1,
      nombre: 'Super Admin',
      email: 'admin@example.com',
      password_hash: seededPasswordHash,
      rol: 'super_admin'
    }
  ],
  auditLogs: []
};

const nextId = (collection) =>
  collection.length === 0 ? 1 : Math.max(...collection.map((item) => item.id)) + 1;

export const findCaseByExpedienteAndDoc = (numeroExpediente, documentoIdentidad) =>
  db.cases.find(
    (c) =>
      c.numero_expediente.toLowerCase() === numeroExpediente.toLowerCase() &&
      c.denunciante_documento === documentoIdentidad
  );

export const findCaseByTrackingCode = (codigoSeguimiento) =>
  db.cases.find((c) => c.codigo_seguimiento.toLowerCase() === codigoSeguimiento.toLowerCase());

export const addCase = (payload) => {
  const id = nextId(db.cases);
  const nuevoCaso = { ...payload, id, actualizado_en: new Date().toISOString() };
  db.cases.push(nuevoCaso);
  return nuevoCaso;
};

export const updateCase = (id, updates) => {
  const index = db.cases.findIndex((c) => c.id === id);
  if (index === -1) return null;
  db.cases[index] = { ...db.cases[index], ...updates, actualizado_en: new Date().toISOString() };
  return db.cases[index];
};

export const deleteCaseById = (id) => {
  const idx = db.cases.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  db.cases.splice(idx, 1);
  db.timelineEvents = db.timelineEvents.filter((e) => e.case_id !== id);
  db.documents = db.documents.filter((d) => d.case_id !== id);
  db.payments = db.payments.filter((p) => p.case_id !== id);
  return true;
};

export const addTimelineEvent = (caseId, payload) => {
  const id = nextId(db.timelineEvents);
  const event = { ...payload, id, case_id: caseId };
  db.timelineEvents.push(event);
  return event;
};

export const updateTimelineEventById = (eventId, updates) => {
  const index = db.timelineEvents.findIndex((e) => e.id === eventId);
  if (index === -1) return null;
  db.timelineEvents[index] = { ...db.timelineEvents[index], ...updates };
  return db.timelineEvents[index];
};

export const deleteTimelineEventById = (eventId) => {
  const index = db.timelineEvents.findIndex((e) => e.id === eventId);
  if (index === -1) return false;
  db.timelineEvents.splice(index, 1);
  return true;
};

export const addDocument = (caseId, payload) => {
  const id = nextId(db.documents);
  const doc = { ...payload, id, case_id: caseId, creado_en: new Date().toISOString() };
  db.documents.push(doc);
  return doc;
};

export const updateDocumentById = (documentId, updates) => {
  const index = db.documents.findIndex((d) => d.id === documentId);
  if (index === -1) return null;
  db.documents[index] = { ...db.documents[index], ...updates };
  return db.documents[index];
};

export const deleteDocumentById = (documentId) => {
  const index = db.documents.findIndex((d) => d.id === documentId);
  if (index === -1) return false;
  db.documents.splice(index, 1);
  return true;
};

export const addPayment = (caseId, payload) => {
  const id = nextId(db.payments);
  const payment = { ...payload, id, case_id: caseId };
  db.payments.push(payment);
  return payment;
};

export const updatePaymentById = (paymentId, updates) => {
  const index = db.payments.findIndex((p) => p.id === paymentId);
  if (index === -1) return null;
  db.payments[index] = { ...db.payments[index], ...updates };
  return db.payments[index];
};

export const deletePaymentById = (paymentId) => {
  const index = db.payments.findIndex((p) => p.id === paymentId);
  if (index === -1) return false;
  db.payments.splice(index, 1);
  return true;
};

export const addUser = ({ nombre, email, password, rol }) => {
  const id = nextId(db.users);
  const password_hash = bcrypt.hashSync(password, 10);
  const user = { id, nombre, email, password_hash, rol };
  db.users.push(user);
  return user;
};

export const updateUserById = (userId, updates) => {
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return null;
  db.users[index] = { ...db.users[index], ...updates };
  return db.users[index];
};

export const deleteUserById = (userId) => {
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) return false;
  db.users.splice(index, 1);
  return true;
};
