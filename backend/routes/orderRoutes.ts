import { Router } from 'express';
import {
  getOrders,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  deleteOrder
} from '../controllers/orderController';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);
router.put('/:id/payment', updateOrderPayment);
router.delete('/:id', deleteOrder);

export default router;
