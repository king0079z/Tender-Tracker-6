import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import pg from 'pg';
const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Enable gzip compression
app.use(compression());
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database client
const dbClient = new Client({
  host: process.env.VITE_AZURE_DB_HOST,
  database: process.env.VITE_AZURE_DB_NAME,
  user: process.env.VITE_AZURE_DB_USER,
  password: process.env.VITE_AZURE_DB_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Connect to database on server start
let isConnected = false;
const connectDB = async () => {
  try {
    console.log('Attempting database connection...');
    await dbClient.connect();
    isConnected = true;
    console.log('Successfully connected to database');
  } catch (error) {
    console.error('Database connection error:', error);
    // Retry connection after delay
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Database API endpoint
app.post('/api/query', async (req, res) => {
  console.log('Received query request:', { 
    text: req.body.text,
    params: req.body.params 
  });

  if (!isConnected) {
    console.log('Database not connected, returning 503');
    return res.status(503).json({
      error: true,
      message: 'Database connection not ready'
    });
  }

  try {
    const { text, params } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: true,
        message: 'Query text is required'
      });
    }

    const result = await dbClient.query(text, params);
    console.log('Query executed successfully');
    
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      error: true,
      message: error.message || 'Database query failed'
    });
  }
});

// Serve static files from the dist directory
app.use(express.static(join(__dirname)));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Graceful shutdown
const shutdown = async () => {
  if (isConnected) {
    try {
      await dbClient.end();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});