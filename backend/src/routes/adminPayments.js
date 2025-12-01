import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getCasePayments,
  createPaymentRequest,
  updatePaymentRequest,
  createPayment,
  updatePayment
} from '../controllers/paymentsController.js';

const router = Router();

router.use(authenticate);

router.get('/cases/:caseId/payments', authorize('admin', 'super_admin'), getCasePayments);
router.post('/cases/:caseId/payment-requests', authorize('admin', 'super_admin'), createPaymentRequest);
router.patch('/payment-requests/:id', authorize('admin', 'super_admin'), updatePaymentRequest);
router.post('/cases/:caseId/payments', authorize('admin', 'super_admin'), createPayment);
router.patch('/payments/:id', authorize('admin', 'super_admin'), updatePayment);

export default router;
