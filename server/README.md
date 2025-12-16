# 🚀 Servidor de Sistema de Gestión de Préstamos

Servidor robusto construido con Express y MongoDB para gestionar clientes, créditos, movimientos de caja y alertas.

## 📋 Características

- ✅ **Express.js** - Framework web rápido y minimalista
- ✅ **MongoDB con Mongoose** - Base de datos NoSQL robusta
- ✅ **Seguridad** - Helmet, CORS, Rate Limiting
- ✅ **Manejo de errores** - Middleware centralizado
- ✅ **Estructura modular** - Código organizado y escalable
- ✅ **Validación** - Validación de datos con Mongoose
- ✅ **Logging** - Morgan para logs de requests

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
cd server
npm install
```

2. **Configurar variables de entorno:**
Asegúrate de que el archivo `.env` en la raíz del proyecto tenga:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/prestamos-juan
NODE_ENV=development
```

3. **Iniciar MongoDB:**
Asegúrate de que MongoDB esté corriendo en tu sistema.

4. **Iniciar el servidor:**
```bash
# Modo desarrollo (con watch)
npm run dev

# Modo producción
npm start
```

## 🔐 Autenticación

El servidor utiliza JWT (JSON Web Tokens) para la autenticación.

### Inicializar Usuarios por Defecto

Antes de usar el servidor, ejecuta el script para crear los usuarios iniciales:

```bash
npm run init-users
```

Esto creará tres usuarios:
- **domiciliario** / dom123
- **admin** / admin123
- **ceo** / ceo123

### Endpoints de Autenticación

- `POST /api/auth/login` - Iniciar sesión
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
  Respuesta:
  ```json
  {
    "success": true,
    "token": "jwt_token_aqui",
    "data": {
      "id": "...",
      "username": "admin",
      "nombre": "Administrador",
      "role": "administrador",
      "permissions": {...}
    }
  }
  ```

- `GET /api/auth/me` - Obtener usuario actual (requiere token)
- `PUT /api/auth/change-password` - Cambiar contraseña (requiere token)

### Uso del Token

Incluye el token en el header de las peticiones:
```
Authorization: Bearer <tu_token_jwt>
```

## 📡 Endpoints de la API

### Personas (Usuarios del Sistema)
- `GET /api/personas` - Obtener todas las personas (solo admin/ceo)
- `GET /api/personas/:id` - Obtener una persona por ID
- `POST /api/personas` - Crear una nueva persona (solo admin/ceo)
- `PUT /api/personas/:id` - Actualizar una persona
- `DELETE /api/personas/:id` - Eliminar una persona (solo CEO)
- `GET /api/personas/:id/permissions` - Obtener permisos de una persona

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `GET /api/clientes/:id` - Obtener un cliente por ID
- `POST /api/clientes` - Crear un nuevo cliente
- `PUT /api/clientes/:id` - Actualizar un cliente
- `DELETE /api/clientes/:id` - Eliminar un cliente
- `PUT /api/clientes/:id/coordenadas` - Actualizar coordenadas GPS

### Créditos
- `GET /api/creditos` - Obtener todos los créditos
- `GET /api/creditos/:id` - Obtener un crédito por ID
- `POST /api/creditos` - Crear un nuevo crédito
- `PUT /api/creditos/:id` - Actualizar un crédito
- `DELETE /api/creditos/:id` - Eliminar un crédito
- `PUT /api/creditos/:id/pagos` - Registrar un pago
- `POST /api/creditos/:id/notas` - Agregar una nota

### Movimientos de Caja
- `GET /api/movimientos-caja` - Obtener todos los movimientos
- `GET /api/movimientos-caja/:id` - Obtener un movimiento por ID
- `POST /api/movimientos-caja` - Crear un nuevo movimiento
- `PUT /api/movimientos-caja/:id` - Actualizar un movimiento
- `DELETE /api/movimientos-caja/:id` - Eliminar un movimiento

### Alertas
- `GET /api/alertas` - Obtener todas las alertas
- `GET /api/alertas/:id` - Obtener una alerta por ID
- `POST /api/alertas` - Crear una nueva alerta
- `PUT /api/alertas/:id` - Actualizar una alerta
- `DELETE /api/alertas/:id` - Eliminar una alerta
- `PUT /api/alertas/:id/notificar` - Marcar alerta como notificada

### Salud del Servidor
- `GET /api/health` - Verificar estado del servidor

## 📁 Estructura del Proyecto

```
server/
├── config/
│   └── database.js          # Configuración de MongoDB
├── controllers/
│   ├── authController.js   # Controlador de autenticación
│   ├── personaController.js # Controlador de personas/usuarios
│   ├── clienteController.js
│   ├── creditoController.js
│   ├── movimientoCajaController.js
│   └── alertaController.js
├── middleware/
│   ├── auth.js              # Middleware de autenticación JWT
│   ├── errorHandler.js      # Manejo de errores
│   └── security.js           # Middleware de seguridad
├── models/
│   ├── Persona.js            # Modelo de usuarios del sistema
│   ├── Cliente.js
│   ├── Credito.js
│   ├── MovimientoCaja.js
│   └── Alerta.js
├── routes/
│   ├── authRoutes.js        # Rutas de autenticación
│   ├── personaRoutes.js     # Rutas de personas
│   ├── clienteRoutes.js
│   ├── creditoRoutes.js
│   ├── movimientoCajaRoutes.js
│   ├── alertaRoutes.js
│   └── index.js
├── scripts/
│   └── initUsers.js          # Script para inicializar usuarios
├── utils/
│   └── generateToken.js     # Utilidad para generar tokens JWT
├── server.js                 # Archivo principal
├── package.json
└── README.md
```

## 🔒 Seguridad

El servidor incluye:
- **JWT Authentication** - Autenticación basada en tokens
- **Bcrypt** - Hash de contraseñas
- **Helmet** - Protección de headers HTTP
- **CORS** - Control de acceso cross-origin
- **Rate Limiting** - Prevención de abuso de API (especialmente en login)
- **Validación de datos** - Validación con Mongoose
- **Control de permisos** - Sistema de roles y permisos granular

## 🐛 Manejo de Errores

Todos los errores son manejados centralmente por el middleware `errorHandler.js`, que proporciona respuestas consistentes y mensajes de error apropiados.

## 👥 Roles y Permisos

El sistema tiene tres roles con diferentes permisos:

### Domiciliario
- Ver clientes y créditos
- Registrar pagos
- Agregar notas y multas
- **No puede** crear/editar/eliminar clientes o créditos

### Administrador
- Todos los permisos de Domiciliario
- Crear, editar y eliminar clientes
- Crear y editar créditos
- Ver estadísticas
- Gestionar caja
- Exportar datos

### CEO
- Todos los permisos de Administrador
- Eliminar créditos
- Ver configuración
- Importar datos
- Limpiar datos
- Gestionar usuarios del sistema

## 📝 Notas

- El servidor usa ES6 modules (`import/export`)
- MongoDB debe estar corriendo antes de iniciar el servidor
- Las variables de entorno se cargan automáticamente desde `.env`
- **Importante**: Ejecuta `npm run init-users` después de la primera instalación
- El token JWT expira en 30 días
- Las contraseñas se hashean automáticamente con bcrypt antes de guardarse

