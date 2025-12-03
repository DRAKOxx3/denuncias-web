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
  listCryptoWallets,
  listPaymentResources,
  createBankAccount,
  updateBankAccount,
  deactivateBankAccount,
  createCryptoWallet,
  updateCryptoWallet,
  deactivateCryptoWallet,
  reviewPayment
} from '../controllers/paymentsController.js';

const router = Router();

router.use(authenticate);

router.get('/payment-requests', authorize('admin', 'super_admin'), listPaymentRequests);
router.post('/payment-requests', authorize('admin', 'super_admin'), createPaymentRequestGlobal);
router.get('/payments', authorize('admin', 'super_admin'), listPayments);
router.post('/payments', authorize('admin', 'super_admin'), createPaymentGlobal);
router.get('/bank-accounts', authorize('admin', 'super_admin'), listBankAccounts);
router.get('/crypto-wallets', authorize('admin', 'super_admin'), listCryptoWallets);
router.get('/payment-resources', authorize('admin', 'super_admin'), listPaymentResources);
router.post('/bank-accounts', authorize('admin', 'super_admin'), createBankAccount);
router.put('/bank-accounts/:id', authorize('admin', 'super_admin'), updateBankAccount);
router.delete('/bank-accounts/:id', authorize('admin', 'super_admin'), deactivateBankAccount);
router.post('/crypto-wallets', authorize('admin', 'super_admin'), createCryptoWallet);
router.put('/crypto-wallets/:id', authorize('admin', 'super_admin'), updateCryptoWallet);
router.delete('/crypto-wallets/:id', authorize('admin', 'super_admin'), deactivateCryptoWallet);

router.get('/cases/:caseId/payments', authorize('admin', 'super_admin'), getCasePayments);
router.post('/cases/:caseId/payment-requests', authorize('admin', 'super_admin'), createPaymentRequest);
router.patch('/payment-requests/:id', authorize('admin', 'super_admin'), updatePaymentRequest);
router.post('/cases/:caseId/payments', authorize('admin', 'super_admin'), createPayment);
router.patch('/payments/:id', authorize('admin', 'super_admin'), updatePayment);
router.post('/payments/:id/review', authorize('admin', 'super_admin'), reviewPayment);

export default router;
