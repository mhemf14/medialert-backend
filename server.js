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

// Configura la conexión con la base de datos de Render PostgreSQL
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

// Ruta principal
app.get('/', (req, res) => {
  res.send('Servidor Express conectado a PostgreSQL 🚀');
});

// Ruta de login
// Ruta de login
app.post('/login', async (req, res) => {
  const { rut, contrasena } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE rut = $1 AND contrasena = $2';
    const values = [rut, contrasena];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    // Opcional: no enviar la contraseña en la respuesta
    delete usuario.contrasena;

    res.json(usuario);
  } catch (err) {
    console.error('❌ Error en /login:', err.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});


// Ruta de registro
app.post('/registro', async (req, res) => {
  const { rut, contrasena, rol } = req.body;
  try {
    const existe = await pool.query('SELECT * FROM usuarios WHERE rut = $1', [rut]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    await pool.query(
      'INSERT INTO usuarios (rut, contrasena, rol) VALUES ($1, $2, $3)',
      [rut, contrasena, rol]
    );

    res.json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('❌ Error al registrar:', err.message);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
});

// Obtener medicamentos
app.get('/api/medicamentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicamentos');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener medicamentos:', err.message);
    res.status(500).json({ error: 'Error al consultar medicamentos' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
