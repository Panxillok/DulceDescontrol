import { Order, Ingredient, Recipe, Expense } from './types';

// Helper to get formatted relative dates
export function getRelativeDateString(daysOffset: number): string {
  const date = new Date('2026-06-07T18:18:07Z'); // Base on provided system time
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

export function getRelativeDayName(daysOffset: number): string {
  const date = new Date('2026-06-07T18:18:07Z');
  date.setDate(date.getDate() + daysOffset);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
  const str = date.toLocaleDateString('es-ES', options);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'EXP-101', description: 'Compra de Harina Premium W300', amount: 1500.00, date: getRelativeDateString(-12), type: 'Insumo', documentNumber: 'FAC-23940' },
  { id: 'EXP-102', description: 'Boleta de Gas Licuado de Cocina', amount: 480.00, date: getRelativeDateString(-8), type: 'Servicios', documentNumber: 'BOL-59281' },
  { id: 'EXP-103', description: 'Mantequilla Artesanal Bloque 10kg', amount: 980.00, date: getRelativeDateString(-5), type: 'Insumo', documentNumber: 'FAC-23992' },
  { id: 'EXP-104', description: 'Servicio de Agua Potable', amount: 320.00, date: getRelativeDateString(-2), type: 'Servicios', documentNumber: 'BOL-81203' },
  { id: 'EXP-105', description: 'Envases Compostables Especiales', amount: 550.00, date: getRelativeDateString(0), type: 'Otros', documentNumber: 'FAC-24110' }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1042',
    clientName: 'María García',
    productName: 'Pastel de Bodas de 3 Pisos (Buttercream & Flores)',
    deliveryDate: getRelativeDateString(0), // Today
    deliveryTime: '09:00',
    status: 'En Producción',
    total: 350.00,
    deliveryAddress: 'Av. Paseo de la Reforma 450, Ciudad de México',
    deliveryFee: 45.00
  },
  {
    id: 'ORD-1150',
    clientName: 'Andrés Mendoza',
    productName: 'Tarta de Fresas con Crema Pastelera (Grande)',
    deliveryDate: getRelativeDateString(0), // Today
    deliveryTime: '11:30',
    status: 'Listo',
    total: 85.00,
    deliveryAddress: 'Calle Río Lerma 88, Cuauhtémoc',
    deliveryFee: 30.00
  },
  {
    id: 'ORD-1088',
    clientName: 'Café de la Esquina',
    productName: 'Lote de Croissants de Mantequilla (x40)',
    deliveryDate: getRelativeDateString(0), // Today
    deliveryTime: '14:00',
    status: 'Confirmado',
    total: 120.00,
    deliveryAddress: 'Av. Yucatán 15, Roma Norte',
    deliveryFee: 30.00
  },
  {
    id: 'ORD-1095',
    clientName: 'Restaurante El Olivo',
    productName: 'Panes de Masa Madre Tradicional (x12)',
    deliveryDate: getRelativeDateString(0), // Today
    deliveryTime: '16:00',
    status: 'Pendiente',
    total: 72.00,
    deliveryAddress: 'Colima 220, Roma Norte',
    deliveryFee: 30.00
  },
  // Upcoming deliveries
  {
    id: 'ORD-1102',
    clientName: 'Sofía Romero',
    productName: 'Pastel de Chocolates y Avellanas (Cumpleaños)',
    deliveryDate: getRelativeDateString(1), // Tomorrow
    deliveryTime: '10:00',
    status: 'Confirmado',
    total: 95.00,
    deliveryAddress: 'Lago Alberto 300, Polanco',
    deliveryFee: 50.00
  },
  {
    id: 'ORD-1105',
    clientName: 'Hotel Bella Vista',
    productName: 'Surtido de Repostería Fina de Gala (x80 piezas)',
    deliveryDate: getRelativeDateString(1), // Tomorrow
    deliveryTime: '12:30',
    status: 'Confirmado',
    total: 240.00,
    deliveryAddress: 'Campos Elíseos 120, Polanco',
    deliveryFee: 50.00
  },
  {
    id: 'ORD-1110',
    clientName: 'Carlos Ortíz',
    productName: 'Tarta de Almendra estilo Santiago (Sin Gluten)',
    deliveryDate: getRelativeDateString(2), // Tuesday
    deliveryTime: '15:00',
    status: 'En Producción',
    total: 65.00,
    deliveryAddress: 'Av. Universidad 1800, Coyoacán',
    deliveryFee: 60.00
  },
  {
    id: 'ORD-1120',
    clientName: 'Bistró Las Rosas',
    productName: 'Baguettes de Masa Madre Doradas (x25)',
    deliveryDate: getRelativeDateString(3), // Wednesday
    deliveryTime: '08:30',
    status: 'Confirmado',
    total: 50.00,
    deliveryAddress: 'Michoacán 56, Condesa',
    deliveryFee: 30.00
  },
  {
    id: 'ORD-1122',
    clientName: 'Lucía Fernández',
    productName: 'Pastel de Fresas y Crema Chantilly Helado',
    deliveryDate: getRelativeDateString(3), // Wednesday
    deliveryTime: '17:00',
    status: 'Pendiente',
    total: 55.00,
    deliveryAddress: 'Av. Insurgentes Sur 950, Nápoles',
    deliveryFee: 45.00
  },
  {
    id: 'ORD-1130',
    clientName: 'Colegio Saint Mary',
    productName: 'Cupcakes Decorados con Temática Infantil (x50)',
    deliveryDate: getRelativeDateString(4), // Thursday
    deliveryTime: '11:00',
    status: 'Confirmado',
    total: 110.00,
    deliveryAddress: 'Av. Horacio 400, Polanco',
    deliveryFee: 50.00
  },
  {
    id: 'ORD-1140',
    clientName: 'Laura Domínguez',
    productName: 'Tarta de Queso Vasca Horneada Tostada',
    deliveryDate: getRelativeDateString(5), // Friday
    deliveryTime: '16:00',
    status: 'Confirmado',
    total: 48.00,
    deliveryAddress: 'Río Pánuco 12, Cuauhtémoc',
    deliveryFee: 30.00
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ING-01',
    name: 'Harina de Trigo de Fuerza W300',
    currentStock: 4.5, // low !
    criticalLimit: 12.0,
    unit: 'kg',
    weeklyRequired: 15.0,
    category: 'Materia Seca',
    status: 'Crítico'
  },
  {
    id: 'ING-02',
    name: 'Mantequilla sin Sal (Bloques de Cocina)',
    currentStock: 3.2, // low !
    criticalLimit: 8.0,
    unit: 'kg',
    weeklyRequired: 6.5,
    category: 'Lácteos/Grasas',
    status: 'Crítico'
  },
  {
    id: 'ING-03',
    name: 'Levadura Fresca Prensada',
    currentStock: 0.25, // low !
    criticalLimit: 1.0,
    unit: 'kg',
    weeklyRequired: 1.25,
    category: 'Fermentos',
    status: 'Crítico'
  },
  {
    id: 'ING-04',
    name: 'Azúcar Glass Extrafina',
    currentStock: 2.1,
    criticalLimit: 3.5,
    unit: 'kg',
    weeklyRequired: 4.0,
    category: 'Dulces',
    status: 'Agotándose'
  },
  {
    id: 'ING-05',
    name: 'Huevos Frescos Clase L',
    currentStock: 480,
    criticalLimit: 120,
    unit: 'unidades',
    weeklyRequired: 300,
    category: 'Huevos',
    status: 'Suficiente'
  },
  {
    id: 'ING-06',
    name: 'Nata Líquida para Montar 35% MG',
    currentStock: 22.0,
    criticalLimit: 10.0,
    unit: 'litros',
    weeklyRequired: 18.0,
    category: 'Lácteos/Grasas',
    status: 'Suficiente'
  },
  {
    id: 'ING-07',
    name: 'Fresas Frescas Orgánicas',
    currentStock: 1.8,
    criticalLimit: 2.5,
    unit: 'kg',
    weeklyRequired: 5.0,
    category: 'Frutas',
    status: 'Agotándose'
  },
  {
    id: 'ING-08',
    name: 'Chocolate de Cobertura Negro 70%',
    currentStock: 15.0,
    criticalLimit: 6.0,
    unit: 'kg',
    weeklyRequired: 8.5,
    category: 'Dulces',
    status: 'Suficiente'
  }
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'REC-01',
    name: 'Pastel de Bodas Real',
    activeThisWeek: true,
    requiredIngredients: [
      { ingredientName: 'Harina de Trigo de Fuerza W300', amount: 4.0 },
      { ingredientName: 'Mantequilla sin Sal (Bloques de Cocina)', amount: 2.5 },
      { ingredientName: 'Huevos Frescos Clase L', amount: 36 },
      { ingredientName: 'Azúcar Glass Extrafina', amount: 2.0 }
    ]
  },
  {
    id: 'REC-02',
    name: 'Croissant Francés de Mantequilla',
    activeThisWeek: true,
    requiredIngredients: [
      { ingredientName: 'Harina de Trigo de Fuerza W300', amount: 8.0 },
      { ingredientName: 'Mantequilla sin Sal (Bloques de Cocina)', amount: 4.0 },
      { ingredientName: 'Levadura Fresca Prensada', amount: 0.8 }
    ]
  },
  {
    id: 'REC-03',
    name: 'Tarta de Fresas Delicia',
    activeThisWeek: true,
    requiredIngredients: [
      { ingredientName: 'Harina de Trigo de Fuerza W300', amount: 1.5 },
      { ingredientName: 'Huevos Frescos Clase L', amount: 18 },
      { ingredientName: 'Nata Líquida para Montar 35% MG', amount: 6.0 },
      { ingredientName: 'Fresas Frescas Orgánicas', amount: 4.0 }
    ]
  },
  {
    id: 'REC-04',
    name: 'Masa Madre Crocante',
    activeThisWeek: false,
    requiredIngredients: [
      { ingredientName: 'Harina de Trigo de Fuerza W300', amount: 10.0 },
      { ingredientName: 'Levadura Fresca Prensada', amount: 0.1 }
    ]
  }
];
