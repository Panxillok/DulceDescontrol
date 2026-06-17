import express from 'express';
import orderRoutes from './routes/orderRoutes';
import ingredientRoutes from './routes/ingredientRoutes';

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS cleanly with native middleware so the frontend can communicate safely
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Body parser middleware
app.use(express.json());

// Main Modularized REST API Routes
app.use('/api/orders', orderRoutes);
app.use('/api/ingredients', ingredientRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend pastelería server is healthy and running.' });
});

// Start the backend server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Backend Server successfully initialized!`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===================================================`);
});

export default app;
