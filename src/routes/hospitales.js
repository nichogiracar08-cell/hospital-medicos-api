const express = require('express');
const mongoose = require('mongoose');
const { Hospital } = require('../models/Hospital');

const router = express.Router();

const CAMPOS_HOSPITAL = ['nombre', 'ciudad', 'direccion'];
const CAMPOS_MEDICO = ['nombre', 'especialidad', 'email', 'aniosExperiencia'];

// Toma solo los campos permitidos del body y les hace trim si son texto
function limpiar(body, campos) {
  const datos = {};
  for (const campo of campos) {
    if (body[campo] !== undefined) {
      datos[campo] = typeof body[campo] === 'string' ? body[campo].trim() : body[campo];
    }
  }
  return datos;
}

// Valida que el :id sea un ObjectId válido y carga el hospital
async function cargarHospital(req, res, next) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'El id del hospital no es válido' });
  }
  const hospital = await Hospital.findById(id);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital no encontrado' });
  }
  req.hospital = hospital;
  next();
}

// ===================== HOSPITALES =====================

// Listar hospitales (filtro opcional ?ciudad=)
router.get('/', async (req, res) => {
  const filtro = {};
  if (req.query.ciudad) filtro.ciudad = req.query.ciudad.trim();
  const hospitales = await Hospital.find(filtro).sort({ createdAt: -1 });
  res.json(hospitales);
});

// Obtener un hospital
router.get('/:id', cargarHospital, (req, res) => {
  res.json(req.hospital);
});

// Crear hospital (puede venir con médicos)
router.post('/', async (req, res) => {
  const datos = limpiar(req.body, CAMPOS_HOSPITAL);
  if (Array.isArray(req.body.medicos)) {
    datos.medicos = req.body.medicos.map((m) => limpiar(m, CAMPOS_MEDICO));
  }
  const hospital = await Hospital.create(datos);
  res.status(201).json(hospital);
});

// Actualizar hospital
router.put('/:id', cargarHospital, async (req, res) => {
  const datos = limpiar(req.body, CAMPOS_HOSPITAL);
  if (Object.keys(datos).length === 0) {
    return res.status(400).json({ error: 'Envía al menos un campo: nombre, ciudad o direccion' });
  }
  req.hospital.set(datos);
  await req.hospital.save();
  res.json(req.hospital);
});

// Eliminar hospital
router.delete('/:id', cargarHospital, async (req, res) => {
  await req.hospital.deleteOne();
  res.json({ mensaje: 'Hospital eliminado', id: req.hospital._id });
});

// ===================== MÉDICOS (embebidos) =====================

// Listar médicos de un hospital
router.get('/:id/medicos', cargarHospital, (req, res) => {
  res.json(req.hospital.medicos);
});

// Agregar UN médico embebido al hospital
router.post('/:id/medicos', cargarHospital, async (req, res) => {
  const medico = limpiar(req.body, CAMPOS_MEDICO);
  req.hospital.medicos.push(medico);
  await req.hospital.save();
  res.status(201).json(req.hospital.medicos[req.hospital.medicos.length - 1]);
});

// Middleware para ubicar el médico dentro del hospital
function cargarMedico(req, res, next) {
  const { medicoId } = req.params;
  if (!mongoose.isValidObjectId(medicoId)) {
    return res.status(400).json({ error: 'El id del médico no es válido' });
  }
  const medico = req.hospital.medicos.id(medicoId);
  if (!medico) {
    return res.status(404).json({ error: 'Médico no encontrado en este hospital' });
  }
  req.medico = medico;
  next();
}

// Obtener un médico
router.get('/:id/medicos/:medicoId', cargarHospital, cargarMedico, (req, res) => {
  res.json(req.medico);
});

// Actualizar un médico
router.put('/:id/medicos/:medicoId', cargarHospital, cargarMedico, async (req, res) => {
  const datos = limpiar(req.body, CAMPOS_MEDICO);
  if (Object.keys(datos).length === 0) {
    return res.status(400).json({ error: 'Envía al menos un campo: nombre, especialidad, email o aniosExperiencia' });
  }
  req.medico.set(datos);
  await req.hospital.save();
  res.json(req.medico);
});

// Eliminar un médico
router.delete('/:id/medicos/:medicoId', cargarHospital, cargarMedico, async (req, res) => {
  req.medico.deleteOne();
  await req.hospital.save();
  res.json({ mensaje: 'Médico eliminado', id: req.medico._id });
});

module.exports = router;
