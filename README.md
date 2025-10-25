# 💰 Sistema de Gestión de Créditos

Aplicación web completa para gestionar créditos, usuarios y pagos, funcionando completamente en el navegador sin necesidad de servidor.

## 🚀 Características

### 👥 Gestión de Clientes
- **CRUD completo** de clientes con información detallada
- Registro de fiador para cada cliente
- Búsqueda rápida por nombre, documento o teléfono
- Vista detallada de cada cliente con todos sus créditos

### 💳 Gestión de Créditos
- Montos predefinidos: $200,000, $300,000, $400,000, $500,000
- **Interés automático del 20% mensual**
- Dos tipos de pago:
  - **Semanal**: 10 cuotas (cada sábado)
  - **Quincenal**: 5 cuotas (días 1-16 o 5-20)
- Cálculo automático de fechas de pago
- Estados del crédito: Activo, En Mora, Finalizado
- Barra de progreso visual

### 💵 Registro de Pagos
- Marcar cuotas como pagadas con fecha
- Historial completo de pagos
- Detección automática de cuotas vencidas
- Cálculo de días de mora

### 📝 Sistema de Notas
- Agregar comentarios personalizados por crédito
- Registro cronológico de anotaciones
- Eliminar notas cuando sea necesario

### 📊 Estadísticas y Reportes
- Dashboard con métricas clave
- Gráficos interactivos:
  - Créditos por estado (activos, mora, finalizados)
  - Créditos por tipo de pago
  - Análisis de montos
- Tabla de resumen detallado

### ⚙️ Configuración
- Exportar datos (backup en JSON)
- Importar datos desde backup
- Eliminar todos los datos
- Información del sistema

## 🛠️ Tecnologías Utilizadas

- **React** - Framework de UI
- **TailwindCSS** - Estilos y diseño
- **React Router DOM** - Navegación
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos modernos
- **date-fns** - Manejo de fechas
- **LocalStorage** - Almacenamiento local

## 📦 Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

4. **Abrir en el navegador**
```
http://localhost:5173
```

## 🎯 Uso de la Aplicación

### 1. Agregar un Cliente
1. Ve a la página "Clientes"
2. Haz clic en "Nuevo Cliente"
3. Completa la información del cliente y su fiador
4. Guarda el cliente

### 2. Crear un Crédito
1. Haz clic en una tarjeta de cliente
2. En la vista de detalle, haz clic en "Nuevo Crédito"
3. Selecciona:
   - Monto del préstamo
   - Tipo de pago (semanal o quincenal)
   - Fecha de inicio
4. El sistema calculará automáticamente:
   - Total a pagar (con 20% de interés)
   - Valor de cada cuota
   - Fechas programadas de cobro

### 3. Registrar Pagos
1. Abre el detalle de un crédito
2. Haz clic en "Marcar pagado" en la cuota correspondiente
3. El sistema registrará la fecha del pago
4. El progreso se actualizará automáticamente

### 4. Agregar Notas
1. En el detalle del crédito, ve a la sección "Notas"
2. Escribe tu comentario
3. Haz clic en "Agregar"
4. Las notas se guardan con fecha y hora

### 5. Ver Estadísticas
1. Ve a la página "Estadísticas"
2. Visualiza:
   - Total de clientes y créditos
   - Montos cobrados y por cobrar
   - Gráficos interactivos
   - Tabla de resumen

### 6. Backup de Datos
1. Ve a "Configuración"
2. Haz clic en "Descargar Backup" para exportar
3. Usa "Seleccionar Archivo" para importar un backup previo

## 📱 Navegación

- **Clientes**: Lista de todos los clientes registrados
- **Créditos Activos**: Créditos en curso y en mora
- **Finalizados**: Historial de créditos completados
- **Estadísticas**: Dashboard con análisis y gráficos
- **Configuración**: Gestión de datos y backups

## 💾 Almacenamiento

Los datos se guardan en **LocalStorage** del navegador:
- ✅ No requiere servidor ni base de datos
- ✅ Funciona completamente offline
- ✅ Privacidad total (datos solo en tu navegador)
- ⚠️ Los datos se pierden si limpias el navegador
- 💡 **Recomendación**: Exporta backups regularmente

## 🎨 Características de Diseño

- **Responsive**: Funciona en móviles, tablets y desktop
- **Interfaz moderna**: Diseño limpio con TailwindCSS
- **Indicadores visuales**: Colores según estado del crédito
  - 🟢 Verde: Crédito al día
  - 🔴 Rojo: En mora
  - 🔵 Azul: Finalizado
- **Animaciones suaves**: Transiciones y efectos hover

## 📋 Estructura del Proyecto

```
src/
├── components/
│   ├── Layout/
│   │   ├── Navbar.jsx
│   │   └── Layout.jsx
│   ├── Clientes/
│   │   ├── ClienteCard.jsx
│   │   └── ClienteForm.jsx
│   └── Creditos/
│       ├── CreditoCard.jsx
│       ├── CreditoForm.jsx
│       └── CreditoDetalle.jsx
├── context/
│   └── AppContext.jsx
├── pages/
│   ├── Clientes.jsx
│   ├── ClienteDetalle.jsx
│   ├── CreditosActivos.jsx
│   ├── CreditosFinalizados.jsx
│   ├── Estadisticas.jsx
│   └── Configuracion.jsx
├── services/
│   └── storage.js
├── utils/
│   └── creditCalculations.js
├── App.jsx
├── main.jsx
└── index.css
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📊 Ejemplo de Flujo Completo

1. **Crear cliente**: Juan Pérez con su fiador Carlos López
2. **Asignar crédito**: $300,000 con pagos quincenales
3. **Sistema genera**: 5 fechas de cobro automáticas
4. **Total a pagar**: $360,000 (20% de interés)
5. **Valor cuota**: $72,000
6. **Cliente paga**: Marcar cuota como pagada
7. **Progreso**: 1/5 cuotas (20% completado)
8. **Agregar nota**: "Pagó el 5 de octubre a tiempo"
9. **Finalizar**: Cuando todas las cuotas están pagadas

## 🔒 Seguridad y Privacidad

- Sin conexión a internet requerida
- Datos almacenados localmente en tu navegador
- No se envía información a servidores externos
- Control total sobre tus datos

## 🤝 Soporte

Para reportar problemas o sugerencias, crea un issue en el repositorio.

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**Desarrollado con ❤️ usando React y TailwindCSS**
