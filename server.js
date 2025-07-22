const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Verifica que las variables de entorno necesarias estén definidas
const requiredEnv = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ FALTA variable de entorno: ${envVar}`);
    process.exit(1);
  }
});

// Configura la conexión con la base de datos PostgreSQL en Render
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: { rejectUnauthorized: false }
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

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor Express conectado a PostgreSQL 🚀');
});

// Ruta de inicio de sesión
app.post('/login', async (req, res) => {
  const { rut, contrasena } = req.body;

  if (!rut || !contrasena) {
    return res.status(400).json({ error: 'RUT y contraseña son obligatorios' });
  }

  try {
    const query = 'SELECT * FROM usuarios WHERE rut = $1 AND contrasena = $2';
    const values = [rut, contrasena];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      rut: usuario.rut,
      rol: usuario.rol
    });
  } catch (err) {
    console.error('❌ Error en /login:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener medicamentos
app.get('/api/medicamentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicamentos');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error en /api/medicamentos:', err.message);
    res.status(500).json({ error: 'Error al consultar medicamentos' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
