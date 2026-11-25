import { Router } from 'express';
import { getOrders, getOrderStats, getOrder, createOrder, updateOrder, deleteOrder } from '../controllers/orders';
import { validate } from '../middleware/validate';
import { ownerOnly } from '../middleware/auth';
import { idParams } from '../validators/common';
import { createOrderBody, updateOrderBody, orderListQuery } from '../validators/order';

const router = Router();

router.get('/', validate({ query: orderListQuery }), getOrders);
router.get('/stats', getOrderStats); // must come before /:id
router.get('/:id', validate({ params: idParams }), getOrder);
router.post('/', validate({ body: createOrderBody }), createOrder);
router.put('/:id', validate({ params: idParams, body: updateOrderBody }), updateOrder);
router.delete('/:id', ownerOnly, validate({ params: idParams }), deleteOrder);

export default router;
