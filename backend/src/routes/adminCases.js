import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listCases,
  createCase,
  updateCase,
  deleteCase
} from '../controllers/casesController.js';
import {
  listTimeline,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent
} from '../controllers/timelineController.js';
import {
  listDocuments,
  updateDocument,
  deleteDocument
} from '../controllers/documentsController.js';
import {
  listPayments,
  createPayment,
  updatePayment,
  deletePayment
} from '../controllers/paymentsController.js';

const router = Router();

router.use(authenticate);

router
  .route('/cases')
  .get(authorize('admin', 'super_admin'), listCases)
  .post(authorize('super_admin'), createCase);

router
  .route('/cases/:id')
  .patch(authorize('admin', 'super_admin'), updateCase)
  .delete(authorize('super_admin'), deleteCase);

router
  .route('/cases/:id/timeline')
  .get(authorize('admin', 'super_admin'), listTimeline)
  .post(authorize('admin', 'super_admin'), createTimelineEvent);

router
  .route('/cases/:id/timeline/:eventId')
  .patch(authorize('admin', 'super_admin'), updateTimelineEvent)
  .delete(authorize('admin', 'super_admin'), deleteTimelineEvent);

router
  .route('/cases/:id/documents')
  .get(authorize('admin', 'super_admin'), listDocuments)
  //.post(authorize('admin', 'super_admin'), uploadDocument);

router
  .route('/cases/:id/documents/:documentId')
  .patch(authorize('admin', 'super_admin'), updateDocument)
  .delete(authorize('admin', 'super_admin'), deleteDocument);

router
  .route('/cases/:id/payments')
  .get(authorize('admin', 'super_admin'), listPayments)
  .post(authorize('admin', 'super_admin'), createPayment);

router
  .route('/cases/:id/payments/:paymentId')
  .patch(authorize('admin', 'super_admin'), updatePayment)
  .delete(authorize('admin', 'super_admin'), deletePayment);

export default router;
