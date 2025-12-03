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

const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const uploadReceipt = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error('Solo se permiten imágenes (png/jpg/webp) o PDF.'));
      return;
    }
    cb(null, true);
  }
});

const uploadReceiptSafe = (req, res, next) => {
  uploadReceipt.single('receipt')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo permitido (10MB).'
        : err.message || 'Archivo de comprobante no válido.';
      return res.status(400).json({ message, errors: { receipt: message } });
    }
    return next();
  });
};

router.post('/cases/search', searchCase);
router.post('/payment-requests/:id/confirm', uploadReceiptSafe, confirmPaymentRequestPublic);

export default router;
