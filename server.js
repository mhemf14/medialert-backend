const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Configura la conexión con la base de datos de Render PostgreSQL
const pool = new Pool({
  user: 'medialert_user',
  host: 'dpg-d1t8i2a4d50c73b4etng-a.oregon-postgres.render.com',
  database: 'medialert',
  password: 'rXzA1KwC453MqwgUXjexAGHz8x6tId2h',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error al conectar a PostgreSQL:', err.stack);
  }
  console.log('✅ Conectado exitosamente a PostgreSQL');
  release();
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Ruta principal para comprobar que el servidor está corriendo
app.get('/', (req, res) => {
  res.send('Servidor Express conectado a PostgreSQL 🚀');
});

// Obtener todos los medicamentos
app.get('/api/medicamentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicamentos');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error en la consulta a /api/medicamentos:', err.message);
    res.status(500).json({ error: 'Error al consultar medicamentos' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
