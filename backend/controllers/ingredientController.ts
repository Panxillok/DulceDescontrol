import { Request, Response } from 'express';
import { pool } from '../config/database';

export const getIngredients = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM ingredients ORDER BY name ASC');
    const ingredients = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      currentStock: parseFloat(r.current_stock),
      criticalLimit: parseFloat(r.critical_limit),
      unit: r.unit,
      weeklyRequired: parseFloat(r.weekly_required),
      category: r.category,
      status: r.status
    }));
    res.json(ingredients);
  } catch (err: any) {
    console.error('Error fetching inventory ingredients:', err);
    res.status(500).json({ error: 'Error al obtener ingredientes de inventario: ' + err.message });
  }
};

export const createIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, initialStock, criticalLimit, unit, category } = req.body;

    if (!name || initialStock === undefined || criticalLimit === undefined || !unit || !category) {
      res.status(400).json({ error: 'Faltan campos del ingrediente obligatorios para su registro' });
      return;
    }

    const id = 'ING-' + Math.floor(100 + Math.random() * 900); // Generate unique id e.g. ING-412
    const currentStockVal = parseFloat(initialStock) || 0;
    const critLimitVal = parseFloat(criticalLimit) || 0;
    
    // Calculate initial helper status
    let status = 'Suficiente';
    if (currentStockVal === 0) {
      status = 'Crítico';
    } else if (currentStockVal <= critLimitVal) {
      status = 'Crítico';
    } else if (currentStockVal <= critLimitVal * 1.5) {
      status = 'Agotándose';
    }

    const weeklyRequired = critLimitVal * 1.3; // estimated weekly limit

    const queryText = `
      INSERT INTO ingredients (id, name, current_stock, critical_limit, unit, weekly_required, category, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [id, name, currentStockVal, critLimitVal, unit, weeklyRequired, category, status];
    await pool.query(queryText, values);

    res.status(201).json({
      success: true,
      message: 'Ingrediente creado en el inventario',
      ingredient: {
        id,
        name,
        currentStock: currentStockVal,
        criticalLimit: critLimitVal,
        unit,
        weeklyRequired,
        category,
        status
      }
    });
  } catch (err: any) {
    console.error('Error creating ingredient:', err);
    res.status(500).json({ error: 'Error al registrar el ingrediente: ' + err.message });
  }
};

export const updateIngredientStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentStock } = req.body;

    if (currentStock === undefined) {
      res.status(400).json({ error: 'El stock actual es requerido' });
      return;
    }

    const parsedStock = parseFloat(currentStock);
    
    // First retrieve the ingredient to check critical limits and update the status dynamically
    const findRes = await pool.query('SELECT critical_limit FROM ingredients WHERE id = $1', [id]);
    if (findRes.rowCount === 0) {
      res.status(404).json({ error: 'Ingrediente no encontrado' });
      return;
    }

    const criticalLimitObj = parseFloat(findRes.rows[0].critical_limit);
    
    // Recalculate status
    let status = 'Suficiente';
    if (parsedStock <= criticalLimitObj) {
      status = 'Crítico';
    } else if (parsedStock <= criticalLimitObj * 1.5) {
      status = 'Agotándose';
    }

    const { rowCount } = await pool.query(
      'UPDATE ingredients SET current_stock = $1, status = $2 WHERE id = $3',
      [parsedStock, status, id]
    );

    res.json({
      success: true,
      message: 'Stock del ingrediente actualizado con éxito',
      id,
      currentStock: parsedStock,
      status
    });
  } catch (err: any) {
    console.error('Error updating ingredient stock:', err);
    res.status(500).json({ error: 'Error al actualizar el stock: ' + err.message });
  }
};

export const deleteIngredient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM ingredients WHERE id = $1', [id]);

    if (rowCount === 0) {
      res.status(404).json({ error: 'Ingrediente no encontrado' });
      return;
    }

    res.json({ success: true, message: 'Ingrediente eliminado del inventario con éxito' });
  } catch (err: any) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ error: 'Error al eliminar el ingrediente: ' + err.message });
  }
};
