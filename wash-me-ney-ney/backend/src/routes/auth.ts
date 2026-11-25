import { Router } from 'express';
import { login, logout, me, changePassword } from '../controllers/auth';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { loginLimiter, writeLimiter } from '../middleware/security';
import { loginBody, changePasswordBody } from '../validators/user';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginBody }), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.put('/password', requireAuth, writeLimiter, validate({ body: changePasswordBody }), changePassword);

export default router;
