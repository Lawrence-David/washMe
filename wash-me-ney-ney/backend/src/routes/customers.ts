import { Router } from 'express';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customers';
import { validate } from '../middleware/validate';
import { ownerOnly } from '../middleware/auth';
import { idParams } from '../validators/common';
import { customerBody } from '../validators/customer';

// Staff can add and edit customers; only the owner can delete them
const router = Router();

router.get('/', getCustomers);
router.get('/:id', validate({ params: idParams }), getCustomer);
router.post('/', validate({ body: customerBody }), createCustomer);
router.put('/:id', validate({ params: idParams, body: customerBody }), updateCustomer);
router.delete('/:id', ownerOnly, validate({ params: idParams }), deleteCustomer);

export default router;
