import { Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { searchCase } from '../controllers/casesController.js';
import { confirmPaymentRequestPublic } from '../controllers/paymentsController.js';

const router = Router();

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const uploadReceipt = multer({ storage });

router.post('/cases/search', searchCase);
router.post('/payment-requests/:id/confirm', uploadReceipt.single('receipt'), confirmPaymentRequestPublic);

export default router;
