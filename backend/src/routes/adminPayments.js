import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getCasePayments,
  listPaymentRequests,
  listPayments,
  createPaymentRequest,
  createPaymentRequestGlobal,
  updatePaymentRequest,
  createPayment,
  createPaymentGlobal,
  updatePayment,
  listBankAccounts,
  listCryptoWallets
} from '../controllers/paymentsController.js';

const router = Router();

router.use(authenticate);

router.get('/payment-requests', authorize('admin', 'super_admin'), listPaymentRequests);
router.post('/payment-requests', authorize('admin', 'super_admin'), createPaymentRequestGlobal);
router.get('/payments', authorize('admin', 'super_admin'), listPayments);
router.post('/payments', authorize('admin', 'super_admin'), createPaymentGlobal);
router.get('/bank-accounts', authorize('admin', 'super_admin'), listBankAccounts);
router.get('/crypto-wallets', authorize('admin', 'super_admin'), listCryptoWallets);

router.get('/cases/:caseId/payments', authorize('admin', 'super_admin'), getCasePayments);
router.post('/cases/:caseId/payment-requests', authorize('admin', 'super_admin'), createPaymentRequest);
router.patch('/payment-requests/:id', authorize('admin', 'super_admin'), updatePaymentRequest);
router.post('/cases/:caseId/payments', authorize('admin', 'super_admin'), createPayment);
router.patch('/payments/:id', authorize('admin', 'super_admin'), updatePayment);

export default router;
