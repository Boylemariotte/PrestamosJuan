# 📝 Instrucciones para Crear Usuario en MongoDB

## Opción 1: Usando MongoDB Compass (Recomendado)

1. Abre MongoDB Compass
2. Conéctate a tu base de datos (por defecto: `mongodb://localhost:27017`)
3. Selecciona la base de datos `prestamos-juan`
4. Selecciona la colección `personas`
5. Haz clic en "Insert Document"
6. Copia y pega el siguiente JSON (reemplaza el password hasheado con uno real):

```json
{
  "username": "admin",
  "password": "admin123",
  "nombre": "Administrador",
  "email": "admin@prestamosjuan.com",
  "role": "administrador",
  "activo": true
}
```

**Nota:** El password se hasheará automáticamente cuando se guarde gracias al middleware de Mongoose.

## Opción 2: Usando MongoDB Shell (mongosh)

```javascript
use prestamos-juan

db.personas.insertOne({
  username: "admin",
  password: "admin123",
  nombre: "Administrador",
  email: "admin@prestamosjuan.com",
  role: "administrador",
  activo: true
})
```

## Opción 3: Usando un Script de Node.js

Crea un archivo `createUser.js` en la raíz del proyecto:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Persona from './server/models/Persona.js';

dotenv.config();

const createUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const usuario = await Persona.create({
      username: 'admin',
      password: 'admin123',
      nombre: 'Administrador',
      email: 'admin@prestamosjuan.com',
      role: 'administrador'
    });

    console.log('✅ Usuario creado:', usuario);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createUser();
```

Ejecuta: `node createUser.js`

## Usuarios de Ejemplo

### Administrador
```json
{
  "username": "admin",
  "password": "admin123",
  "nombre": "Administrador",
  "email": "admin@prestamosjuan.com",
  "role": "administrador"
}
```

### Domiciliario
```json
{
  "username": "domiciliario",
  "password": "dom123",
  "nombre": "Domiciliario",
  "email": "domiciliario@prestamosjuan.com",
  "role": "domiciliario"
}
```

### CEO
```json
{
  "username": "ceo",
  "password": "ceo123",
  "nombre": "CEO",
  "email": "ceo@prestamosjuan.com",
  "role": "ceo"
}
```

## ⚠️ Importante

- El campo `password` debe ser texto plano (sin hashear)
- Mongoose automáticamente hasheará la contraseña antes de guardarla
- El campo `email` debe ser único
- El campo `username` debe ser único y en minúsculas
- Los roles válidos son: `domiciliario`, `administrador`, `ceo`

