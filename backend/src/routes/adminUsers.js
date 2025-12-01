import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { listUsers, createUser, updateUser, deleteUser, login } from '../controllers/usersController.js';

const router = Router();

router.post('/login', login);

router.use(authenticate, authorize('super_admin'));

router
  .route('/users')
  .get(listUsers)
  .post(createUser);

router
  .route('/users/:id')
  .patch(updateUser)
  .delete(deleteUser);

export default router;
