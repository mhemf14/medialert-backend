const { Pool } = require('pg');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// 🔧 Verifica variables de entorno
const requiredEnv = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ FALTA variable de entorno: ${envVar}`);
    process.exit(1);
  }
});

// 🔌 Configura conexión PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
  ssl: { rejectUnauthorized: false }
});

// 🔍 Verificar conexión inicial
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

// 🟢 Ruta base
app.get('/', (req, res) => {
  res.send('Servidor Express conectado a PostgreSQL 🚀');
});

// 🔐 Login
app.post('/login', async (req, res) => {
  const { rut, contrasena } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE rut = $1 AND contrasena = $2',
      [rut, contrasena]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];
    delete usuario.contrasena;
    res.json(usuario);
  } catch (err) {
    console.error('Error en /login:', err.message);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// 📝 Registro
app.post('/registro', async (req, res) => {
  const { rut, contrasena, rol, nombre, telefono } = req.body;

  try {
    const existe = await pool.query('SELECT * FROM usuarios WHERE rut = $1', [rut]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    await pool.query(
      'INSERT INTO usuarios (rut, contrasena, rol, nombre, telefono) VALUES ($1, $2, $3, $4, $5)',
      [rut, contrasena, rol, nombre, telefono]
    );

    res.json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (err) {
    console.error('❌ Error al registrar:', err.message);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
});

// ➕ Agregar medicamento
app.post('/medicamentos_por_rut', async (req, res) => {
  const { nombre, dosis, dias, horas, rut_paciente } = req.body;

  if (!nombre || !dosis || !dias || !horas || !rut_paciente) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO medicamentos (nombre, dosis, dias, horas, rut_paciente)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        nombre,
        dosis,
        dias.join(','),  // Array → string
        horas.join(','), // Array → string
        rut_paciente
      ]
    );

    res.status(201).json({ mensaje: 'Medicamento agregado exitosamente', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error al insertar medicamento:', err.message);
    res.status(500).json({ error: 'Error al agregar medicamento' });
  }
});

// 🔍 Obtener medicamentos por RUT
app.get('/medicamentos_por_rut/:rut', async (req, res) => {
  const rut = req.params.rut;

  try {
    const result = await pool.query(
      'SELECT * FROM medicamentos WHERE rut_paciente = $1',
      [rut]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al consultar medicamentos:', err.message);
    res.status(500).json({ error: 'Error al consultar medicamentos del paciente' });
  }
});

// 👁️‍🗨️ Obtener todos los medicamentos
app.get('/api/medicamentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicamentos');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener medicamentos:', err.message);
    res.status(500).json({ error: 'Error al consultar medicamentos' });
  }
});

app.get('/admin/asignaciones', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        u2.nombre AS cuidador,
        u1.nombre AS paciente,
        m.nombre AS medicamento,
        m.dias,
        m.horas
      FROM medicamentos m
      JOIN usuarios u1 ON m.rut_paciente = u1.rut
      LEFT JOIN usuarios u2 ON u1.rut_cuidador = u2.rut
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener asignaciones:', err);
    res.status(500).send('Error al obtener asignaciones');
  }
});



// 🚀 Lanzar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
