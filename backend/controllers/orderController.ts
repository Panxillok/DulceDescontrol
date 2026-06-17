import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY delivery_date ASC, delivery_time ASC');
    const orders = result.rows.map(r => ({
      id: r.id,
      clientName: r.client_name,
      productName: r.product_name,
      deliveryDate: r.delivery_date,
      deliveryTime: r.delivery_time,
      status: r.status,
      total: parseFloat(r.total),
      deliveryAddress: r.delivery_address || undefined,
      deliveryFee: r.delivery_fee ? parseFloat(r.delivery_fee) : 0,
      ingredientsDeducted: r.ingredients_deducted,
      paymentMethod: r.payment_method || 'Efectivo',
      amountPaid: r.amount_paid != null ? parseFloat(r.amount_paid) : undefined,
      paymentEfectivo: r.payment_efectivo != null ? parseFloat(r.payment_efectivo) : undefined,
      paymentTransferencia: r.payment_transferencia != null ? parseFloat(r.payment_transferencia) : undefined,
      paymentTarjeta: r.payment_tarjeta != null ? parseFloat(r.payment_tarjeta) : undefined,
    }));
    res.json(orders);
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Error al obtener los pedidos: ' + err.message });
  }
};

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id,
      clientName,
      productName,
      deliveryDate,
      deliveryTime,
      status,
      total,
      deliveryAddress,
      deliveryFee,
      ingredientsDeducted,
      paymentMethod,
      amountPaid,
      paymentEfectivo,
      paymentTransferencia,
      paymentTarjeta
    } = req.body;

    if (!id || !clientName || !productName || !deliveryDate || !deliveryTime || !status || total === undefined) {
      res.status(400).json({ error: 'Faltan campos obligatorios para registrar el pedido' });
      return;
    }

    const queryText = `
      INSERT INTO orders (
        id, client_name, product_name, delivery_date, delivery_time, status, total, 
        delivery_address, delivery_fee, ingredients_deducted, payment_method, 
        amount_paid, payment_efectivo, payment_transferencia, payment_tarjeta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      id,
      clientName,
      productName,
      deliveryDate,
      deliveryTime,
      status,
      total,
      deliveryAddress || null,
      deliveryFee || 0,
      ingredientsDeducted || false,
      paymentMethod || 'Efectivo',
      amountPaid || 0,
      paymentEfectivo || 0,
      paymentTransferencia || 0,
      paymentTarjeta || 0
    ];

    await pool.query(queryText, values);
    res.status(201).json({ success: true, message: 'Pedido creado exitosamente', orderId: id });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Error al registrar el pedido: ' + err.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'El estado es requerido' });
      return;
    }

    const { rowCount } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2',
      [status, id]
    );

    if (rowCount === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Estado del pedido actualizado', status, id });
  } catch (err: any) {
    console.error('Error updating order status:', err);
    res.status(500).json({ error: 'Error al actualizar el estado: ' + err.message });
  }
};

export const updateOrderPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      paymentMethod,
      amountPaid,
      paymentEfectivo,
      paymentTransferencia,
      paymentTarjeta
    } = req.body;

    const pPaid = parseFloat(amountPaid) || 0;
    const pEf = parseFloat(paymentEfectivo) || 0;
    const pTrans = parseFloat(paymentTransferencia) || 0;
    const pTar = parseFloat(paymentTarjeta) || 0;

    const { rowCount } = await pool.query(
      `UPDATE orders 
       SET payment_method = $1, amount_paid = $2, payment_efectivo = $3, payment_transferencia = $4, payment_tarjeta = $5 
       WHERE id = $6`,
      [paymentMethod || 'Efectivo', pPaid, pEf, pTrans, pTar, id]
    );

    if (rowCount === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    res.json({
      success: true,
      message: 'Métodos de pago actualizados exitosamente',
      id,
      paymentMethod,
      amountPaid: pPaid
    });
  } catch (err: any) {
    console.error('Error updating order payment fields:', err);
    res.status(500).json({ error: 'Error al registrar el pago: ' + err.message });
  }
};

export const deleteOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [id]);

    if (rowCount === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Pedido eliminado permanentemente' });
  } catch (err: any) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Error al eliminar el pedido: ' + err.message });
  }
};
