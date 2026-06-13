export type OrderStatus = 'Pendiente' | 'Confirmado' | 'En Producción' | 'Listo' | 'Entregado';

export interface Order {
  id: string;
  clientName: string;
  productName: string;
  deliveryDate: string; // ISO string or specific format
  deliveryTime: string; // e.g., "14:00"
  status: OrderStatus;
  total: number;
  deliveryAddress?: string;
  deliveryFee?: number;
  ingredientsDeducted?: boolean;
  paymentMethod?: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Parcial';
  amountPaid?: number;
  paymentEfectivo?: number;
  paymentTransferencia?: number;
  paymentTarjeta?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string
  type: 'Boleta' | 'Factura' | 'Insumo' | 'Servicios' | 'Otros';
  documentNumber?: string; // Boleta / Factura number
  category?: 'Insumos' | 'Servicios' | 'Maquinaria' | 'Otros';
  quantity?: number;
  unit?: string;
  ingredientId?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  criticalLimit: number;
  unit: string;
  weeklyRequired: number; // calculated from recipe needs
  category: string;
  status: 'Crítico' | 'Agotándose' | 'Suficiente';
}

export interface Recipe {
  id: string;
  name: string;
  activeThisWeek: boolean;
  requiredIngredients: {
    ingredientName: string;
    amount: number;
  }[];
}
