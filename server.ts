import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';

const PORT = 3000;

// Default Seed Data definitions
const DEFAULT_EXPENSES = [
  { id: 'EXP-101', description: 'Compra de Harina Premium W300', amount: 150000.00, date: '2026-06-07', type: 'Insumo', documentNumber: 'FAC-23940' },
  { id: 'EXP-102', description: 'Boleta de Gas Licuado de Cocina', amount: 45000.00, date: '2026-06-07', type: 'Servicios', documentNumber: 'BOL-59281' },
  { id: 'EXP-103', description: 'Mantequilla Artesanal Bloque 10kg', amount: 98000.00, date: '2026-06-07', type: 'Insumo', documentNumber: 'FAC-23992' },
  { id: 'EXP-104', description: 'Servicio de Agua Potable', amount: 32000.00, date: '2026-06-07', type: 'Servicios', documentNumber: 'BOL-81203' },
  { id: 'EXP-105', description: 'Envases Compostables Especiales', amount: 55000.00, date: '2026-06-07', type: 'Otros', documentNumber: 'FAC-24110' }
];

const DEFAULT_ORDERS = [
  { id: 'ORD-1042', clientName: 'María García', productName: 'Pastel de Bodas Real de 3 Pisos', deliveryDate: '2026-06-07', deliveryTime: '09:00', status: 'En Producción', total: 250000.00, deliveryAddress: 'Av. Vitacura 3500, Vitacura, Santiago', deliveryFee: 10000.00, ingredientsDeducted: true },
  { id: 'ORD-1150', clientName: 'Andrés Mendoza', productName: 'Tarta de Fresas Delicia Grande', deliveryDate: '2026-06-07', deliveryTime: '11:30', status: 'Listo', total: 65000.00, deliveryAddress: 'Calle Suecia 88, Providencia, Santiago', deliveryFee: 6000.00, ingredientsDeducted: true },
  { id: 'ORD-1088', clientName: 'Café de la Esquina', productName: 'Lote de Croissants de Mantequilla (x40)', deliveryDate: '2026-06-07', deliveryTime: '14:00', status: 'Confirmado', total: 45000.00, deliveryAddress: 'Av. Italia 15, Ñuñoa, Santiago', deliveryFee: 6000.00, ingredientsDeducted: false },
  { id: 'ORD-1095', clientName: 'Restaurante El Olivo', productName: 'Panes de Masa Madre Tradicional (x12)', deliveryDate: '2026-06-07', deliveryTime: '16:00', status: 'Pendiente', total: 25000.00, deliveryAddress: 'Colima 220, Santiago Centro', deliveryFee: 6000.00, ingredientsDeducted: false },
  { id: 'ORD-1102', clientName: 'Sofía Romero', productName: 'Pastel de Chocolates y Avellanas', deliveryDate: '2026-06-08', deliveryTime: '10:00', status: 'Confirmado', total: 55000.00, deliveryAddress: 'Apoquindo 300, Las Condes', deliveryFee: 10000.00, ingredientsDeducted: false },
  { id: 'ORD-1105', clientName: 'Hotel Bella Vista', productName: 'Surtido de Repostería de Gala', deliveryDate: '2026-06-08', deliveryTime: '12:30', status: 'Confirmado', total: 180000.00, deliveryAddress: 'Camino Real 120, Lo Barnechea', deliveryFee: 10000.00, ingredientsDeducted: false },
  { id: 'ORD-1110', clientName: 'Carlos Ortíz', productName: 'Tarta de Almendra estilo Santiago (Sin Gluten)', deliveryDate: '2026-06-09', deliveryTime: '15:00', status: 'En Producción', total: 35000.00, deliveryAddress: 'Av. Fernando Castillo Velasco 1800, La Reina', deliveryFee: 8000.00, ingredientsDeducted: true },
  { id: 'ORD-1120', clientName: 'Bistró Las Rosas', productName: 'Baguettes de Masa Madre Doradas (x25)', deliveryDate: '2026-06-10', deliveryTime: '08:30', status: 'Confirmado', total: 40000.00, deliveryAddress: 'Peñalolén Alto 56, Peñalolén', deliveryFee: 8000.00, ingredientsDeducted: false },
  { id: 'ORD-1122', clientName: 'Lucía Fernández', productName: 'Pastel de Fresas y Crema Chantilly Helado', deliveryDate: '2026-06-10', deliveryTime: '17:00', status: 'Pendiente', total: 42000.00, deliveryAddress: 'Av. El Parrón 950, Cerrillos', deliveryFee: 12000.00, ingredientsDeducted: false },
  { id: 'ORD-1130', clientName: 'Colegio Saint Mary', productName: 'Cupcakes Decorados Temáticos (x50)', deliveryDate: '2026-06-11', deliveryTime: '11:00', status: 'Confirmado', total: 60000.00, deliveryAddress: 'Pajaritos 400, Maipú', deliveryFee: 12000.00, ingredientsDeducted: false },
  { id: 'ORD-1140', clientName: 'Laura Domínguez', productName: 'Tarta de Queso Vasca Horneada Tostada', deliveryDate: '2026-06-12', deliveryTime: '16:00', status: 'Confirmado', total: 38000.00, deliveryAddress: 'Pudahuel Sur 12, Pudahuel', deliveryFee: 12000.00, ingredientsDeducted: false }
];

const DEFAULT_INGREDIENTS = [
  { id: 'ING-01', name: 'Harina de Trigo de Fuerza W300', currentStock: 4.5, criticalLimit: 12.0, unit: 'kg', weeklyRequired: 15.0, category: 'Materia Seca', status: 'Crítico' },
  { id: 'ING-02', name: 'Mantequilla sin Sal (Bloques de Cocina)', currentStock: 3.2, criticalLimit: 8.0, unit: 'kg', weeklyRequired: 6.5, category: 'Lácteos/Grasas', status: 'Crítico' },
  { id: 'ING-03', name: 'Levadura Fresca Prensada', currentStock: 0.25, criticalLimit: 1.0, unit: 'kg', weeklyRequired: 1.25, category: 'Fermentos', status: 'Crítico' },
  { id: 'ING-04', name: 'Azúcar Glass Extrafina', currentStock: 2.1, criticalLimit: 3.5, unit: 'kg', weeklyRequired: 4.0, category: 'Dulces', status: 'Agotándose' },
  { id: 'ING-05', name: 'Huevos Frescos Clase L', currentStock: 480, criticalLimit: 120, unit: 'unidades', weeklyRequired: 300, category: 'Huevos', status: 'Suficiente' },
  { id: 'ING-06', name: 'Nata Líquida para Montar 35% MG', currentStock: 22.0, criticalLimit: 10.0, unit: 'litros', weeklyRequired: 18.0, category: 'Lácteos/Grasas', status: 'Suficiente' },
  { id: 'ING-07', name: 'Fresas Frescas Orgánicas', currentStock: 1.8, criticalLimit: 2.5, unit: 'kg', weeklyRequired: 5.0, category: 'Frutas', status: 'Agotándose' },
  { id: 'ING-08', name: 'Chocolate de Cobertura Negro 70%', currentStock: 15.0, criticalLimit: 6.0, unit: 'kg', weeklyRequired: 8.5, category: 'Dulces', status: 'Suficiente' }
];

const DEFAULT_RECIPES = [
  { id: 'REC-01', name: 'Pastel de Bodas Real', activeThisWeek: true, requiredIngredients: [{ ingredientName: 'Harina de Trigo de Fuerza W300', amount: 4.0 }, { ingredientName: 'Mantequilla sin Sal (Bloques de Cocina)', amount: 2.5 }, { ingredientName: 'Huevos Frescos Clase L', amount: 36 }, { ingredientName: 'Azúcar Glass Extrafina', amount: 2.0 }] },
  { id: 'REC-02', name: 'Croissant Francés de Mantequilla', activeThisWeek: true, requiredIngredients: [{ ingredientName: 'Harina de Trigo de Fuerza W300', amount: 8.0 }, { ingredientName: 'Mantequilla sin Sal (Bloques de Cocina)', amount: 4.0 }, { ingredientName: 'Levadura Fresca Prensada', amount: 0.8 }] },
  { id: 'REC-03', name: 'Tarta de Fresas Delicia', activeThisWeek: true, requiredIngredients: [{ ingredientName: 'Harina de Trigo de Fuerza W300', amount: 1.5 }, { ingredientName: 'Huevos Frescos Clase L', amount: 18 }, { ingredientName: 'Nata Líquida para Montar 35% MG', amount: 6.0 }, { ingredientName: 'Fresas Frescas Orgánicas', amount: 4.0 }] },
  { id: 'REC-04', name: 'Masa Madre Crocante', activeThisWeek: false, requiredIngredients: [{ ingredientName: 'Harina de Trigo de Fuerza W300', amount: 10.0 }, { ingredientName: 'Levadura Fresca Prensada', amount: 0.1 }] }
];

const DEFAULT_PRODUCTS = [
  { id: 'PROD-1', name: 'Pastel de Bodas Real de 3 Pisos', price: 250000 },
  { id: 'PROD-2', name: 'Tarta de Fresas Delicia Grande', price: 65000 },
  { id: 'PROD-3', name: 'Lote de Croissants de Mantequilla (x40)', price: 45000 },
  { id: 'PROD-4', name: 'Panes de Masa Madre Tradicional (x12)', price: 25000 },
  { id: 'PROD-5', name: 'Pastel de Chocolates y Avellanas', price: 55000 },
  { id: 'PROD-6', name: 'Cupcakes Decorados Temáticos (x50)', price: 60000 }
];

interface DBData {
  orders: any[];
  ingredients: any[];
  recipes: any[];
  expenses: any[];
  products: any[];
}

let dbCache: DBData = {
  orders: DEFAULT_ORDERS,
  ingredients: DEFAULT_INGREDIENTS,
  recipes: DEFAULT_RECIPES,
  expenses: DEFAULT_EXPENSES,
  products: DEFAULT_PRODUCTS
};

// JSON Local Fallback Setup
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'bakery_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    dbCache = JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON fallback DB:', err);
  }
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2));
}

function saveLocal() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2));
  } catch (err) {
    console.error('Error writing JSON fallback DB:', err);
  }
}

// PostgreSQL Connection
let pgPool: pg.Pool | null = null;
const pgUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (pgUrl) {
  console.log('PostgreSQL detected! Initializing connection pool...');
  pgPool = new pg.Pool({
    connectionString: pgUrl,
    ssl: { rejectUnauthorized: false }
  });
}

// PG Setup and Seed
async function bootstrapPostgreSQL() {
  if (!pgPool) return;
  try {
    console.log('Bootstrapping PostgreSQL tables...');
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        delivery_date VARCHAR(50) NOT NULL,
        delivery_time VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        total NUMERIC(15,2) NOT NULL,
        delivery_address TEXT,
        delivery_fee NUMERIC(15,2),
        ingredients_deducted BOOLEAN NOT NULL DEFAULT false
      );
      CREATE TABLE IF NOT EXISTS ingredients (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        current_stock NUMERIC(10,2) NOT NULL,
        critical_limit NUMERIC(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        weekly_required NUMERIC(10,2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        active_this_week BOOLEAN NOT NULL DEFAULT true,
        required_ingredients JSONB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        date VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        document_number VARCHAR(100)
      );
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(15,2) NOT NULL
      );
    `);

    // Safe migration for existing DBs
    try {
      await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ingredients_deducted BOOLEAN NOT NULL DEFAULT false`);
    } catch (_) {}

    try {
      await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`);
    } catch (_) {}

    try {
      await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15,2)`);
    } catch (_) {}

    try {
      await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_efectivo NUMERIC(15,2)`);
    } catch (_) {}

    try {
      await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transferencia NUMERIC(15,2)`);
    } catch (_) {}

    try {
      await pgPool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_tarjeta NUMERIC(15,2)`);
    } catch (_) {}

    // Bootstrap Orders
    const ordersCount = await pgPool.query(`SELECT COUNT(*) FROM orders`);
    if (parseInt(ordersCount.rows[0].count, 10) === 0) {
      console.log('Inserting orders seed into PostgreSQL...');
      for (const o of dbCache.orders) {
        await pgPool.query(
          `INSERT INTO orders (id, client_name, product_name, delivery_date, delivery_time, status, total, delivery_address, delivery_fee, ingredients_deducted, payment_method, amount_paid, payment_efectivo, payment_transferencia, payment_tarjeta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            o.id, 
            o.clientName, 
            o.productName, 
            o.deliveryDate, 
            o.deliveryTime, 
            o.status, 
            o.total, 
            o.deliveryAddress, 
            o.deliveryFee, 
            o.ingredientsDeducted || false, o.paymentMethod || 'Efectivo',
            o.amountPaid != null ? o.amountPaid : null,
            o.paymentEfectivo != null ? o.paymentEfectivo : null,
            o.paymentTransferencia != null ? o.paymentTransferencia : null,
            o.paymentTarjeta != null ? o.paymentTarjeta : null
          ]
        );
      }
    }

    // Bootstrap Ingredients
    const ingCount = await pgPool.query(`SELECT COUNT(*) FROM ingredients`);
    if (parseInt(ingCount.rows[0].count, 10) === 0) {
      console.log('Inserting ingredients seed into PostgreSQL...');
      for (const i of dbCache.ingredients) {
        await pgPool.query(
          `INSERT INTO ingredients (id, name, current_stock, critical_limit, unit, weekly_required, category, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [i.id, i.name, i.currentStock, i.criticalLimit, i.unit, i.weeklyRequired, i.category, i.status]
        );
      }
    }

    // Bootstrap Recipes
    const recCount = await pgPool.query(`SELECT COUNT(*) FROM recipes`);
    if (parseInt(recCount.rows[0].count, 10) === 0) {
      console.log('Inserting recipes seed into PostgreSQL...');
      for (const r of dbCache.recipes) {
        await pgPool.query(
          `INSERT INTO recipes (id, name, active_this_week, required_ingredients) VALUES ($1, $2, $3, $4)`,
          [r.id, r.name, r.activeThisWeek, JSON.stringify(r.requiredIngredients)]
        );
      }
    }

    // Bootstrap Expenses
    const expCount = await pgPool.query(`SELECT COUNT(*) FROM expenses`);
    if (parseInt(expCount.rows[0].count, 10) === 0) {
      console.log('Inserting expenses seed into PostgreSQL...');
      for (const e of dbCache.expenses) {
        await pgPool.query(
          `INSERT INTO expenses (id, description, amount, date, type, document_number) VALUES ($1, $2, $3, $4, $5, $6)`,
          [e.id, e.description, e.amount, e.date, e.type, e.documentNumber]
        );
      }
    }

    // Bootstrap Products
    const prodCount = await pgPool.query(`SELECT COUNT(*) FROM products`);
    if (parseInt(prodCount.rows[0].count, 10) === 0) {
      console.log('Inserting products seed into PostgreSQL...');
      for (const p of dbCache.products) {
        await pgPool.query(
          `INSERT INTO products (id, name, price) VALUES ($1, $2, $3)`,
          [p.id, p.name, p.price]
        );
      }
    }

    console.log('PostgreSQL synced and hydrated successfully.');
  } catch (err) {
    console.error('Failed to bootstrap PostgreSQL, running persistent local file storage fallback:', err);
    pgPool = null;
  }
}

// Active wrappers for both targets
async function getOrders() {
  if (pgPool) {
    const res = await pgPool.query(`SELECT * FROM orders ORDER BY delivery_date ASC, delivery_time ASC`);
    return res.rows.map(r => ({
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
  }
  return dbCache.orders;
}

async function saveOrder(o: any) {
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO orders (id, client_name, product_name, delivery_date, delivery_time, status, total, delivery_address, delivery_fee, ingredients_deducted, payment_method, amount_paid, payment_efectivo, payment_transferencia, payment_tarjeta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        o.id, 
        o.clientName, 
        o.productName, 
        o.deliveryDate, 
        o.deliveryTime, 
        o.status, 
        o.total, 
        o.deliveryAddress, 
        o.deliveryFee, 
        o.ingredientsDeducted || false, 
        o.paymentMethod || 'Efectivo',
        o.amountPaid != null ? o.amountPaid : null,
        o.paymentEfectivo != null ? o.paymentEfectivo : null,
        o.paymentTransferencia != null ? o.paymentTransferencia : null,
        o.paymentTarjeta != null ? o.paymentTarjeta : null
      ]
    );
  }
  dbCache.orders.push(o);
  saveLocal();
}

async function getProducts() {
  if (pgPool) {
    const res = await pgPool.query(`SELECT * FROM products ORDER BY id ASC`);
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      price: parseFloat(r.price)
    }));
  }
  return dbCache.products || [];
}

async function saveProduct(p: any) {
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO products (id, name, price) VALUES ($1, $2, $3)`,
      [p.id, p.name, p.price]
    );
  }
  if (!dbCache.products) dbCache.products = [];
  dbCache.products.push(p);
  saveLocal();
}

async function updateProduct(id: string, name: string, price: number) {
  if (pgPool) {
    await pgPool.query(`UPDATE products SET name = $1, price = $2 WHERE id = $3`, [name, price, id]);
  }
  if (!dbCache.products) dbCache.products = [];
  dbCache.products = dbCache.products.map(p => p.id === id ? { ...p, name, price } : p);
  saveLocal();
}

async function deleteProduct(id: string) {
  if (pgPool) {
    await pgPool.query(`DELETE FROM products WHERE id = $1`, [id]);
  }
  if (!dbCache.products) dbCache.products = [];
  dbCache.products = dbCache.products.filter(p => p.id !== id);
  saveLocal();
}

async function updateOrderStatus(id: string, status: string) {
  if (pgPool) {
    await pgPool.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, id]);
  }
  dbCache.orders = dbCache.orders.map(o => o.id === id ? { ...o, status } : o);
  saveLocal();
}

async function getIngredients() {
  if (pgPool) {
    const res = await pgPool.query(`SELECT * FROM ingredients ORDER BY name ASC`);
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      currentStock: parseFloat(r.current_stock),
      criticalLimit: parseFloat(r.critical_limit),
      unit: r.unit,
      weeklyRequired: parseFloat(r.weekly_required),
      category: r.category,
      status: r.status
    }));
  }
  return dbCache.ingredients;
}

async function updateIngredientStock(id: string, stock: number, status: string) {
  if (pgPool) {
    await pgPool.query(`UPDATE ingredients SET current_stock = $1, status = $2 WHERE id = $3`, [stock, status, id]);
  }
  dbCache.ingredients = dbCache.ingredients.map(i => i.id === id ? { ...i, currentStock: stock, status } : i);
  saveLocal();
}

async function saveIngredient(i: any) {
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO ingredients (id, name, current_stock, critical_limit, unit, weekly_required, category, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [i.id, i.name, i.current_stock || i.currentStock, i.critical_limit || i.criticalLimit, i.unit, i.weekly_required || i.weeklyRequired, i.category, i.status]
    );
  }
  dbCache.ingredients.push(i);
  saveLocal();
}

async function getRecipes() {
  if (pgPool) {
    const res = await pgPool.query(`SELECT * FROM recipes ORDER BY name ASC`);
    return res.rows.map(r => ({
      id: r.id,
      name: r.name,
      activeThisWeek: r.active_this_week,
      requiredIngredients: typeof r.required_ingredients === 'string' ? JSON.parse(r.required_ingredients) : r.required_ingredients
    }));
  }
  return dbCache.recipes;
}

async function toggleRecipeActive(id: string, active: boolean) {
  if (pgPool) {
    await pgPool.query(`UPDATE recipes SET active_this_week = $1 WHERE id = $2`, [active, id]);
  }
  dbCache.recipes = dbCache.recipes.map(r => r.id === id ? { ...r, activeThisWeek: active } : r);
  saveLocal();
}

async function saveRecipe(r: any) {
  if (pgPool) {
    const exists = await pgPool.query(`SELECT id FROM recipes WHERE LOWER(name) = LOWER($1)`, [r.name]);
    if (exists.rows.length > 0) {
      await pgPool.query(
        `UPDATE recipes SET active_this_week = $1, required_ingredients = $2 WHERE id = $3`,
        [r.activeThisWeek, JSON.stringify(r.requiredIngredients), exists.rows[0].id]
      );
      dbCache.recipes = dbCache.recipes.map(recipe => recipe.name.toLowerCase() === r.name.toLowerCase() ? { ...recipe, activeThisWeek: r.activeThisWeek, requiredIngredients: r.requiredIngredients } : recipe);
      saveLocal();
      return { id: exists.rows[0].id, name: r.name, activeThisWeek: r.activeThisWeek, requiredIngredients: r.requiredIngredients };
    } else {
      await pgPool.query(
        `INSERT INTO recipes (id, name, active_this_week, required_ingredients) VALUES ($1, $2, $3, $4)`,
        [r.id, r.name, r.activeThisWeek, JSON.stringify(r.requiredIngredients)]
      );
    }
  } else {
    const matchedIdx = dbCache.recipes.findIndex(recipe => recipe.name.toLowerCase() === r.name.toLowerCase());
    if (matchedIdx >= 0) {
      dbCache.recipes[matchedIdx] = { 
        ...dbCache.recipes[matchedIdx], 
        activeThisWeek: r.activeThisWeek, 
        requiredIngredients: r.requiredIngredients 
      };
      saveLocal();
      return dbCache.recipes[matchedIdx];
    }
  }
  dbCache.recipes.push(r);
  saveLocal();
  return r;
}

async function getExpenses() {
  if (pgPool) {
    const res = await pgPool.query(`SELECT * FROM expenses ORDER BY date DESC, id DESC`);
    return res.rows.map(r => ({
      id: r.id,
      description: r.description,
      amount: parseFloat(r.amount),
      date: r.date,
      type: r.type,
      documentNumber: r.document_number || undefined
    }));
  }
  return dbCache.expenses;
}

async function saveExpense(e: any) {
  if (pgPool) {
    await pgPool.query(
      `INSERT INTO expenses (id, description, amount, date, type, document_number) VALUES ($1, $2, $3, $4, $5, $6)`,
      [e.id, e.description, e.amount, e.date, e.type, e.documentNumber]
    );
  }
  dbCache.expenses.push(e);
  saveLocal();
}

async function deleteExpense(id: string) {
  if (pgPool) {
    await pgPool.query(`DELETE FROM expenses WHERE id = $1`, [id]);
  }
  dbCache.expenses = dbCache.expenses.filter(e => e.id !== id);
  saveLocal();
}

async function resetDatabase() {
  if (pgPool) {
    try {
      await pgPool.query(`DELETE FROM orders`);
      await pgPool.query(`DELETE FROM ingredients`);
      await pgPool.query(`DELETE FROM recipes`);
      await pgPool.query(`DELETE FROM expenses`);
      await pgPool.query(`DELETE FROM products`);
    } catch (e) {}
  }
  dbCache = {
    orders: DEFAULT_ORDERS,
    ingredients: DEFAULT_INGREDIENTS,
    recipes: DEFAULT_RECIPES,
    expenses: DEFAULT_EXPENSES,
    products: DEFAULT_PRODUCTS
  };
  saveLocal();
  if (pgPool) {
    await bootstrapPostgreSQL();
  }
}

// Automatically deduct ingredient stock when order is sent to baking/oven, supports multiple parsed items
async function deductIngredientsForOrder(orderId: string) {
  try {
    const orders = await getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order || order.ingredientsDeducted) return;

    const recipes = await getRecipes();
    const ingredients = await getIngredients();
    
    // Parse individual items split by commas
    const items = order.productName.split(',');
    let anyDeducted = false;

    // Track deductions to apply consistently
    const ingredientUpdates: { [id: string]: { newStock: number, status: 'Crítico' | 'Agotándose' | 'Suficiente' } } = {};

    for (const rawItem of items) {
      const item = rawItem.trim();
      if (!item) continue;

      // Extract quantity from descriptor (e.g. "2x Tarta de Fresas" or "Tarta de Fresas (x2)" or "Lote (x40)")
      let qty = 1;
      const xMatch = item.match(/^(\d+)\s*x/i) || item.match(/x\s*(\d+)/i) || item.match(/\(\s*x\s*(\d+)\s*\)/i);
      if (xMatch) {
        qty = parseInt(xMatch[1], 10);
      }

      // Try substring match on clean descriptor
      const cleanName = item.replace(/^\d+\s*x\s*/i, '').replace(/\s*\(x\d+\)/i, '').trim().toLowerCase();
      
      let matchedRecipe = recipes.find(r => 
        cleanName.includes(r.name.toLowerCase().split(' ')[0]) || 
        r.name.toLowerCase().includes(cleanName.split(' ')[0])
      );

      // Fallbacks
      if (!matchedRecipe) {
        if (cleanName.includes('bodas') || cleanName.includes('pastel')) {
          matchedRecipe = recipes.find(r => r.id === 'REC-01');
        } else if (cleanName.includes('croiss')) {
          matchedRecipe = recipes.find(r => r.id === 'REC-02');
        } else if (cleanName.includes('fresa') || cleanName.includes('tarta')) {
          matchedRecipe = recipes.find(r => r.id === 'REC-03');
        } else if (cleanName.includes('pan') || cleanName.includes('baguet') || cleanName.includes('madre')) {
          matchedRecipe = recipes.find(r => r.id === 'REC-04');
        }
      }

      if (matchedRecipe) {
        anyDeducted = true;
        console.log(`[INVENTORY AUTOMATION] Deducting ingredients for: "${cleanName}" qty ${qty} (split item)`);
        
        for (const req of matchedRecipe.requiredIngredients) {
          const ing = ingredients.find(i => i.name.toLowerCase() === req.ingredientName.toLowerCase());
          if (ing) {
            const currentStock = ingredientUpdates[ing.id] ? ingredientUpdates[ing.id].newStock : ing.currentStock;
            const deductionAmount = req.amount * qty;
            const newStock = Math.max(0, currentStock - deductionAmount);
            
            let status: 'Crítico' | 'Agotándose' | 'Suficiente' = 'Suficiente';
            if (newStock < ing.criticalLimit * 0.4) {
              status = 'Crítico';
            } else if (newStock < ing.criticalLimit) {
              status = 'Agotándose';
            }
            
            ingredientUpdates[ing.id] = { newStock, status };
          }
        }
      }
    }

    // Apply accumulated stock updates
    for (const [id, val] of Object.entries(ingredientUpdates)) {
      await updateIngredientStock(id, val.newStock, val.status);
    }

    if (anyDeducted) {
      if (pgPool) {
        await pgPool.query(`UPDATE orders SET ingredients_deducted = true WHERE id = $1`, [orderId]);
      }
      dbCache.orders = dbCache.orders.map(o => o.id === orderId ? { ...o, ingredientsDeducted: true } : o);
      saveLocal();
    }
  } catch (err) {
    console.error('Failed to deduct ingredients automatically:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Bootstrap Postgres if configured
  await bootstrapPostgreSQL();

  // API Backend routes
  app.get('/api/orders', async (req, res) => {
    try {
      res.json(await getOrders());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const o = req.body;
      const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = { id, ...o, ingredientsDeducted: false };
      await saveOrder(newOrder);

      // Auto depletion if immediate production status
      if (['En Producción', 'Listo', 'Entregado'].includes(newOrder.status)) {
        await deductIngredientsForOrder(id);
      }

      const freshOrders = await getOrders();
      const updated = freshOrders.find(x => x.id === id);
      res.json(updated || newOrder);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await updateOrderStatus(id, status);

      // Auto depletion if status transitions to cooking
      if (['En Producción', 'Listo', 'Entregado'].includes(status)) {
        await deductIngredientsForOrder(id);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id/payment', async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethod, amountPaid, paymentEfectivo, paymentTransferencia, paymentTarjeta } = req.body;
      
      const pPaid = parseFloat(amountPaid) || 0;
      const pEf = parseFloat(paymentEfectivo) || 0;
      const pTrans = parseFloat(paymentTransferencia) || 0;
      const pTar = parseFloat(paymentTarjeta) || 0;

      if (pgPool) {
        await pgPool.query(
          `UPDATE orders SET payment_method = $1, amount_paid = $2, payment_efectivo = $3, payment_transferencia = $4, payment_tarjeta = $5 WHERE id = $6`,
          [paymentMethod, pPaid, pEf, pTrans, pTar, id]
        );
      }
      dbCache.orders = dbCache.orders.map(o => o.id === id ? { 
        ...o, 
        paymentMethod, 
        amountPaid: pPaid, 
        paymentEfectivo: pEf, 
        paymentTransferencia: pTrans, 
        paymentTarjeta: pTar 
      } : o);
      saveLocal();
      res.json({ success: true, paymentMethod, amountPaid: pPaid, paymentEfectivo: pEf, paymentTransferencia: pTrans, paymentTarjeta: pTar });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (pgPool) {
        await pgPool.query(`DELETE FROM orders WHERE id = $1`, [id]);
      }
      dbCache.orders = dbCache.orders.filter(o => o.id !== id);
      saveLocal();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // REST API endpoints for Products
  app.get('/api/products', async (req, res) => {
    try {
      res.json(await getProducts());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const { name, price } = req.body;
      const id = `PROD-${Math.floor(100 + Math.random() * 900)}`;
      const newProduct = { id, name, price: Number(price) };
      await saveProduct(newProduct);
      res.json(newProduct);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price } = req.body;
      await updateProduct(id, name, Number(price));
      res.json({ success: true, id, name, price });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteProduct(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/ingredients', async (req, res) => {
    try {
      res.json(await getIngredients());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ingredients', async (req, res) => {
    try {
      const { name, currentStock, criticalLimit, unit, category } = req.body;
      const id = `ING-${Math.floor(10 + Math.random() * 90)}`;
      
      const criticalLimitNum = Number(criticalLimit) || 0;
      const currentStockNum = Number(currentStock) || 0;
      
      let status: 'Crítico' | 'Agotándose' | 'Suficiente' = 'Suficiente';
      if (currentStockNum < criticalLimitNum * 0.4) {
        status = 'Crítico';
      } else if (currentStockNum < criticalLimitNum) {
        status = 'Agotándose';
      }

      const newIngredient = {
        id,
        name,
        currentStock: currentStockNum,
        criticalLimit: criticalLimitNum,
        unit,
        weeklyRequired: criticalLimitNum * 2,
        category,
        status
      };

      await saveIngredient(newIngredient);
      res.json(newIngredient);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/ingredients/:id/stock', async (req, res) => {
    try {
      const { id } = req.params;
      const { currentStock, status } = req.body;
      await updateIngredientStock(id, currentStock, status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/ingredients/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (pgPool) {
        await pgPool.query(`DELETE FROM ingredients WHERE id = $1`, [id]);
      }
      dbCache.ingredients = dbCache.ingredients.filter(i => i.id !== id);
      saveLocal();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/recipes', async (req, res) => {
    try {
      res.json(await getRecipes());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/recipes', async (req, res) => {
    try {
      const { name, activeThisWeek, requiredIngredients } = req.body;
      const id = `REC-${Math.floor(100 + Math.random() * 900)}`;
      const newRecipe = { id, name, activeThisWeek: activeThisWeek !== false, requiredIngredients };
      await saveRecipe(newRecipe);
      res.json(newRecipe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/recipes/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const { activeThisWeek } = req.body;
      await toggleRecipeActive(id, activeThisWeek);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/expenses', async (req, res) => {
    try {
      res.json(await getExpenses());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const item = req.body;
      const id = `EXP-${Math.floor(100 + Math.random() * 900)}`;
      const newExpense = { id, ...item };
      await saveExpense(newExpense);
      res.json(newExpense);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/expenses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteExpense(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reset', async (req, res) => {
    try {
      await resetDatabase();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Client Routing (Vite middleware or static hosting)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULLSTACK CORE] Express server running on: http://0.0.0.0:${PORT}`);
  });
}

startServer();
