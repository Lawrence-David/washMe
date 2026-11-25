import { Router } from 'express';
import { getServices, getService, createService, updateService, deleteService } from '../controllers/services';
import { validate } from '../middleware/validate';
import { ownerOnly } from '../middleware/auth';
import { idParams } from '../validators/common';
import { serviceBody } from '../validators/service';

// Everyone can see services; only the owner can add them or change prices
const router = Router();

router.get('/', getServices);
router.get('/:id', validate({ params: idParams }), getService);
router.post('/', ownerOnly, validate({ body: serviceBody }), createService);
router.put('/:id', ownerOnly, validate({ params: idParams, body: serviceBody }), updateService);
router.delete('/:id', ownerOnly, validate({ params: idParams }), deleteService);

export default router;
