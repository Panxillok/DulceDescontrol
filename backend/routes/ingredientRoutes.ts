import { Router } from 'express';
import {
  getIngredients,
  createIngredient,
  updateIngredientStock,
  deleteIngredient
} from '../controllers/ingredientController';

const router = Router();

router.get('/', getIngredients);
router.post('/', createIngredient);
router.put('/:id/stock', updateIngredientStock);
router.delete('/:id', deleteIngredient);

export default router;
