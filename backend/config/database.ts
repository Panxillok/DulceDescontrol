import pg from 'pg';

const pgUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const pool = new pg.Pool({
  connectionString: pgUrl,
  ssl: pgUrl ? { rejectUnauthorized: false } : undefined
});

pool.on('connect', () => {
  console.log('Database connected successfully through pg pool');
});

pool.on('error', (err) => {
  console.error('Unexpected database connection error:', err);
});
