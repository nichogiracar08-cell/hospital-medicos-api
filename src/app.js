const express = require('express');
const mongoose = require('mongoose');
const hospitalesRouter = require('./routes/hospitales');
const { ESPECIALIDADES } = require('./models/Hospital');

const app = express();

// Lee el cuerpo JSON aceptando tildes y ñ aunque el cliente no envíe UTF-8.
// (curl en Windows manda los acentos en Latin-1 / Windows-1252.)
const utf8 = new TextDecoder('utf-8', { fatal: true });
const latin1 = new TextDecoder('windows-1252');
app.use(express.raw({ type: 'application/json', limit: '100kb' }));
app.use((req, res, next) => {
  if (!Buffer.isBuffer(req.body)) {
    req.body = {};
    return next();
  }
  let texto;
  try {
    texto = utf8.decode(req.body);
  } catch {
    texto = latin1.decode(req.body);
  }
  try {
    req.body = texto.trim() === '' ? {} : JSON.parse(texto);
  } catch {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (req.body === null || typeof req.body !== 'object') req.body = {};
  next();
});

// Respuestas JSON en UTF-8 para que tildes y ñ se vean bien
app.use((req, res, next) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.get('/', (req, res) => {
  res.json({
    api: 'Hospital - Médicos',
    version: '1.0.0',
    endpoints: '/hospitales',
    especialidades: ESPECIALIDADES,
  });
});

app.use('/hospitales', hospitalesRouter);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no existe` });
});

// Manejo central de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const errores = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Error de validación', detalles: errores });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Valor inválido para el campo ${err.path}` });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
