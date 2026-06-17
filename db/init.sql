-- =======================================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS (PostgreSQL / MySQL compatible)
-- Sistema de Control de Producción y Ventas - Pastelería
-- =======================================================================

-- 1. Eliminar tablas previas si existen (Para despliegue limpio)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. Creación de la Tabla de Productos del Catálogo
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(15, 2) NOT NULL
);

-- 3. Creación de la Tabla de Inventario de Insumos
CREATE TABLE ingredients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    critical_limit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL,
    weekly_required NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    category VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 4. Creación de la Tabla de Recetas de Producción
CREATE TABLE recipes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    active_this_week BOOLEAN NOT NULL DEFAULT TRUE,
    required_ingredients JSONB NOT NULL -- Respaldo para persistencia dinámica estructurada
);

-- Tabla Relacional Intermedia para ingrediente-receta (Llave Foránea)
CREATE TABLE recipe_ingredients (
    recipe_id VARCHAR(50) REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id VARCHAR(50) REFERENCES ingredients(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- 5. Creación de la Tabla de Gastos Operacionales
CREATE TABLE expenses (
    id VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100)
);

-- 6. Creación de la Tabla de Pedidos de Clientes
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    delivery_date VARCHAR(50) NOT NULL,
    delivery_time VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total NUMERIC(15, 2) NOT NULL,
    delivery_address TEXT,
    delivery_fee NUMERIC(15, 2) DEFAULT 0.00,
    ingredients_deducted BOOLEAN NOT NULL DEFAULT FALSE,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
    amount_paid NUMERIC(15, 2) DEFAULT 0.00,
    payment_efectivo NUMERIC(15, 2) DEFAULT 0.00,
    payment_transferencia NUMERIC(15, 2) DEFAULT 0.00,
    payment_tarjeta NUMERIC(15, 2) DEFAULT 0.00
);

-- Tabla Relacional Intermedia para pedido-productos (Llave Foránea)
CREATE TABLE order_items (
    order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    price_at_sale NUMERIC(15, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);


-- =======================================================================
-- SEED DATA - INSERCIÓN DE DATOS DE PRUEBA INICIALES
-- =======================================================================

-- Inserción en Catálogo de Productos
INSERT INTO products (id, name, price) VALUES
('PROD-1', 'Pastel de Bodas Real de 3 Pisos', 250000.00),
('PROD-2', 'Tarta de Fresas Delicia Grande', 65000.00),
('PROD-3', 'Lote de Croissants de Mantequilla (x40)', 45000.00),
('PROD-4', 'Panes de Masa Madre Tradicional (x12)', 25000.00),
('PROD-5', 'Pastel de Chocolates y Avellanas', 55000.00),
('PROD-6', 'Cupcakes Decorados Temáticos (x50)', 60000.00);

-- Inserción en Insumos / Inventario
INSERT INTO ingredients (id, name, current_stock, critical_limit, unit, weekly_required, category, status) VALUES
('ING-01', 'Harina de Trigo de Fuerza W300', 4.5, 12.0, 'kg', 15.0, 'Materia Seca', 'Crítico'),
('ING-02', 'Mantequilla sin Sal (Bloques de Cocina)', 3.2, 8.0, 'kg', 6.5, 'Lácteos/Grasas', 'Crítico'),
('ING-03', 'Levadura Fresca Prensada', 0.25, 1.0, 'kg', 1.25, 'Fermentos', 'Crítico'),
('ING-04', 'Azúcar Glass Extrafina', 2.1, 3.5, 'kg', 4.0, 'Dulces', 'Agotándose'),
('ING-05', 'Huevos Frescos Clase L', 480.0, 120.0, 'unidades', 300.0, 'Huevos', 'Suficiente'),
('ING-06', 'Nata Líquida para Montar 35% MG', 22.0, 10.0, 'litros', 18.0, 'Lácteos/Grasas', 'Suficiente'),
('ING-07', 'Fresas Frescas Orgánicas', 1.8, 2.5, 'kg', 5.0, 'Frutas', 'Agotándose'),
('ING-08', 'Chocolate de Cobertura Negro 70%', 15.0, 6.0, 'kg', 8.5, 'Dulces', 'Suficiente');

-- Inserción en Recetas de Producción
INSERT INTO recipes (id, name, active_this_week, required_ingredients) VALUES
('REC-01', 'Pastel de Bodas Real', TRUE, '[{"ingredientName": "Harina de Trigo de Fuerza W300", "amount": 4.0}, {"ingredientName": "Mantequilla sin Sal (Bloques de Cocina)", "amount": 2.5}, {"ingredientName": "Huevos Frescos Clase L", "amount": 36}, {"ingredientName": "Azúcar Glass Extrafina", "amount": 2.0}]'::jsonb),
('REC-02', 'Croissant Francés de Mantequilla', TRUE, '[{"ingredientName": "Harina de Trigo de Fuerza W300", "amount": 8.0}, {"ingredientName": "Mantequilla sin Sal (Bloques de Cocina)", "amount": 4.0}, {"ingredientName": "Levadura Fresca Prensada", "amount": 0.8}]'::jsonb),
('REC-03', 'Tarta de Fresas Delicia', TRUE, '[{"ingredientName": "Harina de Trigo de Fuerza W300", "amount": 1.5}, {"ingredientName": "Huevos Frescos Clase L", "amount": 18}, {"ingredientName": "Nata Líquida para Montar 35% MG", "amount": 6.0}, {"ingredientName": "Fresas Frescas Orgánicas", "amount": 4.0}]'::jsonb),
('REC-04', 'Masa Madre Crocante', FALSE, '[{"ingredientName": "Harina de Trigo de Fuerza W300", "amount": 10.0}, {"ingredientName": "Levadura Fresca Prensada", "amount": 0.1}]'::jsonb);

-- Inserción en Tabla Relacional de Recetas-Insumos (Fórmula explotada para consistencia relacional pura)
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES
('REC-01', 'ING-01', 4.00),
('REC-01', 'ING-02', 2.50),
('REC-01', 'ING-05', 36.00),
('REC-01', 'ING-04', 2.00),
('REC-02', 'ING-01', 8.00),
('REC-02', 'ING-02', 4.00),
('REC-02', 'ING-03', 0.80),
('REC-03', 'ING-01', 1.50),
('REC-03', 'ING-05', 18.00),
('REC-03', 'ING-06', 6.00),
('REC-03', 'ING-07', 4.00),
('REC-04', 'ING-01', 10.00),
('REC-04', 'ING-03', 0.10);

-- Inserción en Gastos de Prueba
INSERT INTO expenses (id, description, amount, date, type, document_number) VALUES
('EXP-101', 'Compra de Harina Premium W300', 150000.00, '2026-06-07', 'Insumo', 'FAC-23940'),
('EXP-102', 'Boleta de Gas Licuado de Cocina', 45000.00, '2026-06-07', 'Servicios', 'BOL-59281'),
('EXP-103', 'Mantequilla Artesanal Bloque 10kg', 98000.00, '2026-06-07', 'Insumo', 'FAC-23992'),
('EXP-104', 'Servicio de Agua Potable', 32000.00, '2026-06-07', 'Servicios', 'BOL-81203'),
('EXP-105', 'Envases Compostables Especiales', 55000.00, '2026-06-07', 'Otros', 'FAC-24110');

-- Inserción en Pedidos de Clientes (con estado de pago y montos)
INSERT INTO orders (id, client_name, product_name, delivery_date, delivery_time, status, total, delivery_address, delivery_fee, ingredients_deducted, payment_method, amount_paid, payment_efectivo, payment_transferencia, payment_tarjeta) VALUES
('ORD-1042', 'María García', 'Pastel de Bodas Real de 3 Pisos', '2026-06-07', '09:00', 'En Producción', 250000.00, 'Av. Vitacura 3500, Vitacura, Santiago', 10000.00, TRUE, 'Efectivo', 260000.00, 260000.00, 0.00, 0.00),
('ORD-1150', 'Andrés Mendoza', 'Tarta de Fresas Delicia Grande', '2026-06-07', '11:30', 'Listo', 65000.00, 'Calle Suecia 88, Providencia, Santiago', 6000.00, TRUE, 'Transferencia', 71000.00, 0.00, 71000.00, 0.00),
('ORD-1088', 'Café de la Esquina', 'Lote de Croissants de Mantequilla (x40)', '2026-06-07', '14:00', 'Confirmado', 45000.00, 'Av. Italia 15, Ñuñoa, Santiago', 6000.00, FALSE, 'Tarjeta', 51000.00, 0.00, 0.00, 51000.00),
('ORD-1095', 'Restaurante El Olivo', 'Panes de Masa Madre Tradicional (x12)', '2026-06-07', '16:00', 'Pendiente', 25000.00, 'Colima 220, Santiago Centro', 6000.00, FALSE, 'Parcial', 15000.00, 15000.00, 0.00, 0.00),
('ORD-1102', 'Sofía Romero', 'Pastel de Chocolates y Avellanas', '2026-06-08', '10:00', 'Confirmado', 55000.00, 'Apoquindo 300, Las Condes', 10000.00, FALSE, 'Efectivo', 65000.00, 65000.00, 0.00, 0.00),
('ORD-1105', 'Hotel Bella Vista', 'Surtido de Repostería de Gala', '2026-06-08', '12:30', 'Confirmado', 180000.00, 'Camino Real 120, Lo Barnechea', 10000.00, FALSE, 'Parcial', 90000.00, 0.00, 90000.00, 0.00),
('ORD-1110', 'Carlos Ortíz', 'Tarta de Almendra estilo Santiago (Sin Gluten)', '2026-06-09', '15:00', 'En Producción', 35000.00, 'Av. Fernando Castillo Velasco 1800, La Reina', 8000.00, TRUE, 'Transferencia', 43000.00, 0.00, 43000.00, 0.00),
('ORD-1120', 'Bistró Las Rosas', 'Baguettes de Masa Madre Doradas (x25)', '2026-06-10', '08:30', 'Confirmado', 40000.00, 'Peñalolén Alto 56, Peñalolén', 8000.00, FALSE, 'Parcial', 20000.00, 10000.00, 10000.00, 0.00),
('ORD-1122', 'Lucía Fernández', 'Pastel de Fresas y Crema Chantilly Helado', '2026-06-10', '17:00', 'Pendiente', 42000.00, 'Av. El Parrón 950, Cerrillos', 12000.00, FALSE, 'Efectivo', 54000.00, 54000.00, 0.00, 0.00),
('ORD-1130', 'Colegio Saint Mary', 'Cupcakes Decorados Temáticos (x50)', '2026-06-11', '11:00', 'Confirmado', 60000.00, 'Pajaritos 400, Maipú', 12000.00, FALSE, 'Tarjeta', 72000.00, 0.00, 0.00, 72000.00),
('ORD-1140', 'Laura Domínguez', 'Tarta de Queso Vasca Horneada Tostada', '2026-06-12', '16:00', 'Confirmado', 38000.00, 'Pudahuel Sur 12, Pudahuel', 12000.00, FALSE, 'Efectivo', 50000.00, 50000.00, 0.00, 0.00);

-- Inserción de Artículos comprados en tabla relacional order_items
INSERT INTO order_items (order_id, product_id, quantity, price_at_sale) VALUES
('ORD-1042', 'PROD-1', 1, 250000.00),
('ORD-1150', 'PROD-2', 1, 65000.00),
('ORD-1088', 'PROD-3', 1, 45000.00),
('ORD-1095', 'PROD-4', 1, 25000.00),
('ORD-1102', 'PROD-5', 1, 55000.00),
('ORD-1130', 'PROD-6', 1, 60000.00);
