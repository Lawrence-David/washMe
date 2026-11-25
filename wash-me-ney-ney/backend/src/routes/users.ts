import { Router } from 'express';
import { getUsers, createUser, updateUser } from '../controllers/users';
import { validate } from '../middleware/validate';
import { ownerOnly } from '../middleware/auth';
import { idParams } from '../validators/common';
import { createUserBody, updateUserBody } from '../validators/user';

const router = Router();

router.use(ownerOnly);
router.get('/', getUsers);
router.post('/', validate({ body: createUserBody }), createUser);
router.put('/:id', validate({ params: idParams, body: updateUserBody }), updateUser);

export default router;
