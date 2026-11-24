const mongoose = require('mongoose');

// Letras (incluye tildes, ü y ñ), espacios, puntos, guiones y apóstrofes
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]+$/;
// Letras, números y signos comunes de una dirección (# - . , °)
const DIRECCION = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s#.,°-]+$/;

const ESPECIALIDADES = [
  'Medicina General',
  'Pediatría',
  'Cardiología',
  'Neurología',
  'Ginecología',
  'Dermatología',
  'Ortopedia',
  'Psiquiatría',
  'Oftalmología',
  'Cirugía General',
];

// ---- Modelo N: Médico (documento embebido dentro de Hospital) ----
const medicoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del médico es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre del médico debe tener al menos 3 caracteres'],
      maxlength: [80, 'El nombre del médico no puede superar 80 caracteres'],
      match: [SOLO_LETRAS, 'El nombre del médico solo puede contener letras (se aceptan tildes y ñ)'],
    },
    especialidad: {
      type: String,
      required: [true, 'La especialidad es obligatoria'],
      trim: true,
      enum: {
        values: ESPECIALIDADES,
        message: `Especialidad no válida. Opciones: ${ESPECIALIDADES.join(', ')}`,
      },
    },
    email: {
      type: String,
      required: [true, 'El email del médico es obligatorio'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no tiene un formato válido'],
    },
    aniosExperiencia: {
      type: Number,
      min: [0, 'Los años de experiencia no pueden ser negativos'],
      max: [60, 'Los años de experiencia no pueden superar 60'],
      default: 0,
    },
  },
  { timestamps: true }
);

// ---- Modelo 1: Hospital ----
const hospitalSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del hospital es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre del hospital debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre del hospital no puede superar 100 caracteres'],
      match: [SOLO_LETRAS, 'El nombre del hospital solo puede contener letras (se aceptan tildes y ñ)'],
    },
    ciudad: {
      type: String,
      required: [true, 'La ciudad es obligatoria'],
      trim: true,
      minlength: [3, 'La ciudad debe tener al menos 3 caracteres'],
      maxlength: [60, 'La ciudad no puede superar 60 caracteres'],
      match: [SOLO_LETRAS, 'La ciudad solo puede contener letras (se aceptan tildes y ñ)'],
    },
    direccion: {
      type: String,
      required: [true, 'La dirección es obligatoria'],
      trim: true,
      minlength: [5, 'La dirección debe tener al menos 5 caracteres'],
      maxlength: [120, 'La dirección no puede superar 120 caracteres'],
      match: [DIRECCION, 'La dirección contiene caracteres no permitidos'],
    },
    medicos: [medicoSchema], // Relación 1:N embebida
  },
  { timestamps: true, versionKey: false }
);

module.exports = {
  Hospital: mongoose.model('Hospital', hospitalSchema, 'hospitales'),
  ESPECIALIDADES,
};
