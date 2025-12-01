import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import publicRoutes from './routes/public.js';
import adminCaseRoutes from './routes/adminCases.js';
import adminUserRoutes from './routes/adminUsers.js';
import adminPaymentRoutes from './routes/adminPayments.js';

const app = express();

app.use(cors());
app.use(express.json());

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api', publicRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin', adminCaseRoutes);
app.use('/api/admin', adminPaymentRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected error' });
});

export default app;
