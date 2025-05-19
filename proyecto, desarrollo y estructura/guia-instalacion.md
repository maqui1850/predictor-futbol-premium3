# Guía de Instalación - Predictor de Fútbol Premium

Este archivo explica cómo configurar y ejecutar el proyecto Predictor de Fútbol Premium.

## Requisitos previos

- Node.js (v14 o superior)
- NPM (normalmente se instala con Node.js)
- Navegador web moderno (Chrome, Firefox, Edge, etc.)

## Estructura de directorios

Asegúrate de que el proyecto tenga la siguiente estructura de carpetas:

```
📁 predictor-futbol-premium/
│
├── 📁 backend/
│   ├── 📁 controllers/
│   ├── 📁 models/
│   ├── 📁 routes/
│   ├── 📁 services/
│   └── 📁 utils/
│
├── 📁 frontend/
│   ├── 📁 css/
│   ├── 📁 js/
│   └── 📁 assets/
│       ├── 📁 icons/
│       └── 📁 images/
│
├── 📄 package.json
├── 📄 .env
└── 📄 README.md
```

## Pasos para la instalación

1. **Instalar dependencias**

   Abre una terminal o línea de comandos, navega hasta la carpeta principal del proyecto y ejecuta:

   ```bash
   npm install
   ```

   Esto instalará todas las dependencias necesarias definidas en el archivo package.json.

2. **Configurar variables de entorno**

   El archivo `.env` ya está configurado con valores predeterminados. Si tienes una clave de API para API-Football, puedes actualizarla en la variable `API_FOOTBALL_KEY`.

3. **Imágenes de placeholder (opcional)**

   Para evitar errores visuales, puedes crear un archivo de imagen simple y guardarlo como:
   - `frontend/assets/icons/team-placeholder.png`
   - `frontend/assets/icons/favicon.ico`

## Iniciar el servidor

1. Desde la línea de comandos, en la carpeta principal del proyecto, ejecuta:

   ```bash
   npm start
   ```

2. Deberías ver un mensaje similar a:

   ```
   🚀 Servidor corriendo en http://localhost:3000
   📊 Modo: development
   ```

3. Abre tu navegador web y navega a:

   ```
   http://localhost:3000
   ```

## Uso de la aplicación

1. En la interfaz principal, puedes seleccionar entre "Modo API" y "Modo Web Scraping" usando el interruptor en la parte superior derecha.

2. Para analizar un partido:
   - Selecciona una liga en el menú desplegable
   - Elige una fecha
   - Haz clic en "Buscar Partidos"
   - Selecciona un partido de la lista
   - Haz clic en "Analizar Partido"

3. También puedes realizar un análisis personalizado:
   - Selecciona los equipos local y visitante
   - Haz clic en "Análisis Personalizado"

## Solución de problemas comunes

- **Error "Cannot find module..."**: Asegúrate de haber ejecutado `npm install` y que todas las dependencias se hayan instalado correctamente.

- **Error EADDRINUSE**: El puerto 3000 ya está en uso. Puedes cambiar el puerto en el archivo `.env` o cerrar la aplicación que esté usando ese puerto.

- **No se muestran imágenes de equipos**: Esto es normal ya que estamos usando datos de prueba. En la versión completa, estas imágenes vendrían de las APIs o el web scraping.

- **Faltan gráficos o elementos visuales**: Asegúrate de tener una conexión a Internet ya que algunos recursos (Bootstrap, Chart.js) se cargan desde CDNs.

## Próximos pasos

Esta es una versión básica del Predictor de Fútbol Premium. Para una implementación completa, se recomienda:

1. Obtener una clave API real para API-Football
2. Implementar el web scraping real para fuentes como SofaScore, FBref y Understat
3. Mejorar los algoritmos de predicción con datos históricos reales
4. Añadir más funcionalidades según las necesidades del usuario

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.
