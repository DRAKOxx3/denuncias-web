import { Router } from 'express';
import { searchCase } from '../controllers/casesController.js';

const router = Router();

router.post('/cases/search', searchCase);

export default router;
