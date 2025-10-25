# 🚀 Guía Rápida de Inicio

## Iniciar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:5173**

## 📝 Primeros Pasos

### Opción 1: Importar Datos de Ejemplo

1. Abre la aplicación en el navegador
2. Ve a **Configuración** (último ítem del menú)
3. En la sección "Importar Datos", haz clic en **"Seleccionar Archivo"**
4. Selecciona el archivo `datos-ejemplo.json` incluido en el proyecto
5. Los datos se cargarán automáticamente con 4 clientes de ejemplo

### Opción 2: Crear Datos Manualmente

1. Ve a la página **Clientes**
2. Haz clic en **"Nuevo Cliente"**
3. Completa el formulario con:
   - Información del cliente (nombre, documento, teléfono, etc.)
   - Información del fiador
4. Guarda el cliente
5. Haz clic en la tarjeta del cliente para ver sus detalles
6. Haz clic en **"Nuevo Crédito"**
7. Configura el crédito:
   - Selecciona el monto
   - Elige tipo de pago (semanal o quincenal)
   - Define la fecha de inicio
8. El sistema calculará automáticamente todo lo demás

## 🎯 Funcionalidades Principales

### Gestión de Clientes
- **Ver todos**: Página principal
- **Buscar**: Usa la barra de búsqueda
- **Crear**: Botón "Nuevo Cliente"
- **Editar**: Botón "Editar" en detalle del cliente
- **Eliminar**: Botón "Eliminar" en detalle del cliente

### Gestión de Créditos
- **Crear**: Desde el detalle del cliente
- **Ver detalle**: Haz clic en cualquier tarjeta de crédito
- **Registrar pago**: En el detalle del crédito, botón "Marcar pagado"
- **Agregar nota**: Campo de texto en la sección de notas

### Navegación
- **Clientes**: Lista completa de clientes
- **Créditos Activos**: Todos los créditos en curso
- **Finalizados**: Historial de créditos completados
- **Estadísticas**: Dashboard con gráficos y métricas
- **Configuración**: Backup y gestión de datos

## 💡 Consejos

1. **Exporta backups regularmente** desde Configuración
2. Los **datos se guardan automáticamente** en tu navegador
3. Usa las **notas** para registrar información importante
4. Los **colores indican el estado**:
   - 🟢 Verde = Al día
   - 🔴 Rojo = En mora
   - 🔵 Azul = Finalizado
5. La aplicación detecta automáticamente **cuotas vencidas**

## 📊 Datos de Ejemplo Incluidos

El archivo `datos-ejemplo.json` contiene:
- **4 clientes** con información completa
- **4 créditos** en diferentes estados:
  - 1 crédito semanal activo (3/10 cuotas pagadas)
  - 1 crédito quincenal activo (2/5 cuotas pagadas)
  - 1 crédito semanal finalizado (10/10 cuotas pagadas)
  - 1 crédito quincenal en mora (1/5 cuotas pagadas)

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Instalar dependencias
npm install
```

## ⚠️ Importante

- Los datos se almacenan en **LocalStorage** del navegador
- Si limpias los datos del navegador, **perderás la información**
- **Exporta backups** antes de limpiar el navegador
- Los datos solo están disponibles en **este navegador y dispositivo**

## 🆘 Solución de Problemas

### La aplicación no carga
1. Verifica que el servidor esté corriendo (`npm run dev`)
2. Abre http://localhost:5173 en tu navegador
3. Revisa la consola del navegador por errores

### Los datos no se guardan
1. Verifica que tu navegador permita LocalStorage
2. Comprueba que no estés en modo incógnito
3. Revisa el espacio disponible en LocalStorage

### Error al importar datos
1. Verifica que el archivo sea un JSON válido
2. Asegúrate de que tenga la estructura correcta
3. Intenta con el archivo `datos-ejemplo.json` incluido

## 📞 Soporte

Para reportar problemas o sugerencias, crea un issue en el repositorio del proyecto.

---

**¡Disfruta gestionando tus créditos! 💰**
