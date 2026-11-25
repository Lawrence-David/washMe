import { Router } from 'express';
import customers from './customers';
import services from './services';
import orders from './orders';
import users from './users';

// Everything here requires a logged-in user (see app.ts)
const router = Router();

router.use('/customers', customers);
router.use('/services', services);
router.use('/orders', orders);
router.use('/users', users);

export default router;
