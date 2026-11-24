# API REST Hospital – Médicos

API REST en JSON hecha con **Node.js + Express + MongoDB (Mongoose)**.

Tiene dos modelos con relación **1:N**: un **Hospital** tiene muchos **Médicos**. Los médicos se guardan **embebidos** dentro del documento del hospital (arreglo `medicos: []`).

```json
{
  "_id": "6740...",
  "nombre": "Clínica Santa Sofía",
  "ciudad": "Pereira",
  "direccion": "Calle 18 # 12-35",
  "medicos": [
    { "_id": "6740...", "nombre": "Andrés Muñoz", "especialidad": "Cardiología", "email": "andres.munoz@santasofia.co", "aniosExperiencia": 12 }
  ]
}
```

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- Una base de datos MongoDB: **MongoDB Atlas** (en la nube, la que usa este proyecto) o MongoDB local

## Base de datos (MongoDB Atlas)

El proyecto está conectado a un cluster gratuito de **MongoDB Atlas**:

| Dato | Valor |
|------|-------|
| Cluster | `Cluster0` (M0 Free, AWS N. Virginia) |
| Base de datos | `hospital_medicos` |
| Colección | `hospitales` (cada documento trae sus `medicos` embebidos) |

Para conectarse a Atlas:

1. En [cloud.mongodb.com](https://cloud.mongodb.com) → **Database & Network Access → IP Access List**, agrega tu IP (**Add Current IP Address**).
2. En **Database Users**, usa un usuario con contraseña (o crea uno nuevo).
3. En **Clusters → Connect → Drivers**, copia la URI `mongodb+srv://...`.
4. Pégala en el archivo `.env` (ver paso 3 de abajo), con `hospital_medicos` como nombre de la base.

> El archivo `.env` **no se sube al repositorio** (está en `.gitignore`) porque contiene la contraseña. En el repo solo está `.env.example` como plantilla.

## Cómo correrlo

```bash
# 1. Clonar el repositorio
git clone https://github.com/nichogiracar08-cell/hospital-medicos-api.git
cd hospital-medicos-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
#   Abre .env y reemplaza TU_PASSWORD por la contraseña del usuario de Atlas:
#   MONGODB_URI=mongodb+srv://usuario:TU_PASSWORD@cluster0.zwahysm.mongodb.net/hospital_medicos?...
#   (o usa mongodb://127.0.0.1:27017/hospital_medicos si tienes MongoDB local)

# 4. Iniciar el servidor
npm start          # o "npm run dev" para que se reinicie al guardar cambios
```

Si todo está bien, en consola aparece:

```
Conectado a MongoDB
API escuchando en http://localhost:3000
```

Luego abre en el navegador [http://localhost:3000/hospitales](http://localhost:3000/hospitales) para ver los hospitales guardados en Atlas.

> Si no tienes `.env`, la API usa por defecto el puerto `3000` y la base local `mongodb://127.0.0.1:27017/hospital_medicos`.

## Modelos y validaciones

### Hospital (1)

| Campo       | Tipo   | Reglas |
|-------------|--------|--------|
| `nombre`    | String | Obligatorio, 3–100 caracteres, solo letras (acepta tildes y ñ) |
| `ciudad`    | String | Obligatorio, 3–60 caracteres, solo letras (acepta tildes y ñ) |
| `direccion` | String | Obligatorio, 5–120 caracteres, letras, números y `# - . , °` |
| `medicos`   | Array  | Lista de médicos embebidos |

### Médico (N, embebido)

| Campo              | Tipo   | Reglas |
|--------------------|--------|--------|
| `nombre`           | String | Obligatorio, 3–80 caracteres, solo letras (acepta tildes y ñ) |
| `especialidad`     | String | Obligatorio, debe ser una de la lista (ver abajo) |
| `email`            | String | Obligatorio, formato de email válido, se guarda en minúsculas |
| `aniosExperiencia` | Number | Opcional, entre 0 y 60 (por defecto 0) |

Especialidades permitidas: `Medicina General`, `Pediatría`, `Cardiología`, `Neurología`, `Ginecología`, `Dermatología`, `Ortopedia`, `Psiquiatría`, `Oftalmología`, `Cirugía General`.

**Validaciones implementadas**

1. **Campos obligatorios**: `nombre`, `ciudad`, `direccion` (hospital) y `nombre`, `especialidad`, `email` (médico).
2. **Longitud mínima y máxima** en todos los textos.
3. **Formato**: nombres y ciudad solo letras (con tildes y ñ), email válido, especialidad dentro de una lista cerrada, años de experiencia entre 0 y 60.
4. **IDs válidos**: si el `:id` o `:medicoId` no es un ObjectId válido responde `400`; si no existe responde `404`.

**Trim**: todos los textos se limpian con `trim` (en las rutas y en el esquema), así `"   Pereira   "` se guarda como `"Pereira"`.

**Tildes y ñ**: las expresiones regulares aceptan `á é í ó ú ü ñ` (mayúsculas y minúsculas) y las respuestas se envían en `UTF-8`. Además, la API lee el cuerpo como UTF-8 y, si no lo es (por ejemplo, `curl` en Windows envía los acentos en Latin-1), lo decodifica como Windows-1252, así las tildes llegan bien desde cualquier terminal.

## Tabla resumen de endpoints

| Método | Endpoint                                   | Descripción                                   | Respuesta OK |
|--------|--------------------------------------------|-----------------------------------------------|--------------|
| GET    | `/`                                        | Info de la API y especialidades permitidas     | 200 |
| GET    | `/hospitales`                              | Listar hospitales (filtro opcional `?ciudad=`) | 200 |
| GET    | `/hospitales/:id`                          | Obtener un hospital con sus médicos            | 200 |
| POST   | `/hospitales`                              | Crear un hospital (puede incluir `medicos`)    | 201 |
| PUT    | `/hospitales/:id`                          | Actualizar un hospital                         | 200 |
| DELETE | `/hospitales/:id`                          | Eliminar un hospital                           | 200 |
| GET    | `/hospitales/:id/medicos`                  | Listar los médicos de un hospital              | 200 |
| **POST** | **`/hospitales/:id/medicos`**            | **Agregar 1 médico embebido al hospital**      | 201 |
| GET    | `/hospitales/:id/medicos/:medicoId`        | Obtener un médico                              | 200 |
| PUT    | `/hospitales/:id/medicos/:medicoId`        | Actualizar un médico                           | 200 |
| DELETE | `/hospitales/:id/medicos/:medicoId`        | Eliminar un médico                             | 200 |

Errores: `400` (validación, JSON inválido o id inválido), `404` (no encontrado), `500` (error interno).

## Comandos curl para probar todo

> Los comandos están pensados para **Git Bash / Linux / macOS**. En PowerShell usa `curl.exe` en vez de `curl`.
> Reemplaza `HOSPITAL_ID` y `MEDICO_ID` por los `_id` que te devuelva la API.

### Info de la API

```bash
curl http://localhost:3000/
```

### Hospitales

**Crear hospital** (con espacios extra para ver el trim y con tildes/ñ):

```bash
curl -X POST http://localhost:3000/hospitales \
  -H "Content-Type: application/json" \
  -d '{"nombre":"   Clínica Santa Sofía   ","ciudad":"  Pereira ","direccion":"Calle 18 # 12-35"}'
```

**Crear hospital con médicos incluidos**:

```bash
curl -X POST http://localhost:3000/hospitales \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Hospital San Jorge","ciudad":"Bogotá","direccion":"Carrera 7 # 45-10","medicos":[{"nombre":"Señora María Peña","especialidad":"Pediatría","email":"maria.pena@sanjorge.co","aniosExperiencia":8}]}'
```

**Listar hospitales**:

```bash
curl http://localhost:3000/hospitales
```

**Filtrar por ciudad**:

```bash
curl "http://localhost:3000/hospitales?ciudad=Pereira"
```

**Obtener un hospital**:

```bash
curl http://localhost:3000/hospitales/HOSPITAL_ID
```

**Actualizar hospital**:

```bash
curl -X PUT http://localhost:3000/hospitales/HOSPITAL_ID \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Clínica Santa Sofía del Café","ciudad":"Medellín"}'
```

**Eliminar hospital**:

```bash
curl -X DELETE http://localhost:3000/hospitales/HOSPITAL_ID
```

### Médicos (embebidos en el hospital)

**Agregar un médico a un hospital** (endpoint del registro embebido):

```bash
curl -X POST http://localhost:3000/hospitales/HOSPITAL_ID/medicos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"  Andrés Muñoz  ","especialidad":"Cardiología","email":"  Andres.Munoz@SantaSofia.co ","aniosExperiencia":12}'
```

**Listar médicos de un hospital**:

```bash
curl http://localhost:3000/hospitales/HOSPITAL_ID/medicos
```

**Obtener un médico**:

```bash
curl http://localhost:3000/hospitales/HOSPITAL_ID/medicos/MEDICO_ID
```

**Actualizar un médico**:

```bash
curl -X PUT http://localhost:3000/hospitales/HOSPITAL_ID/medicos/MEDICO_ID \
  -H "Content-Type: application/json" \
  -d '{"especialidad":"Neurología","aniosExperiencia":13}'
```

**Eliminar un médico**:

```bash
curl -X DELETE http://localhost:3000/hospitales/HOSPITAL_ID/medicos/MEDICO_ID
```

### Probar las validaciones (deben responder 400)

**Campos obligatorios vacíos**:

```bash
curl -X POST http://localhost:3000/hospitales \
  -H "Content-Type: application/json" \
  -d '{"nombre":"   ","ciudad":"","direccion":""}'
```

**Nombre con números y texto muy corto**:

```bash
curl -X POST http://localhost:3000/hospitales \
  -H "Content-Type: application/json" \
  -d '{"nombre":"H1","ciudad":"Cali","direccion":"Av 3N # 20-15"}'
```

**Médico con email inválido, especialidad no permitida y experiencia negativa**:

```bash
curl -X POST http://localhost:3000/hospitales/HOSPITAL_ID/medicos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","especialidad":"Astrología","email":"correo-malo","aniosExperiencia":-3}'
```

**Id inválido**:

```bash
curl http://localhost:3000/hospitales/123
```

## Estructura del proyecto

```
hospital-medicos-api/
├── src/
│   ├── models/
│   │   └── Hospital.js      # Esquemas Hospital y Médico (embebido) + validaciones
│   ├── routes/
│   │   └── hospitales.js    # CRUD de hospitales y de médicos
│   ├── app.js               # Configuración de Express y manejo de errores
│   └── server.js            # Conexión a MongoDB y arranque del servidor
├── .env.example
├── package.json
└── README.md
```
