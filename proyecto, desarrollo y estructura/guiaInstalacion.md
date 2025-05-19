# Guía de Instalación del Predictor de Fútbol Premium

Esta guía te explicará paso a paso cómo instalar y ejecutar el Predictor de Fútbol Premium, incluso si no tienes experiencia en programación.

## Requisitos Previos

Antes de comenzar, necesitarás tener instalado:

1. **Node.js**: La plataforma que permite ejecutar el código del proyecto.
2. **NPM**: El gestor de paquetes que viene incluido con Node.js.
3. **Git**: Para descargar el código (opcional si ya tienes los archivos).
4. **API key de API-Football**: Necesitarás una clave de acceso para obtener datos de fútbol.

## Paso 1: Instalar Node.js y NPM

1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión LTS (Long Term Support) - es la más estable
3. Sigue el instalador y acepta todas las opciones por defecto
4. Para verificar que se ha instalado correctamente, abre una terminal (símbolo del sistema en Windows) y escribe:
   ```
   node --version
   npm --version
   ```
   Deberías ver los números de versión para ambos.

## Paso 2: Descargar o Preparar el Proyecto

### Opción A: Si ya tienes los archivos
1. Coloca todos los archivos en una carpeta llamada "predictor-futbol-premium"
2. Asegúrate de mantener la estructura de carpetas que se muestra en el archivo README

### Opción B: Si vas a usar Git
1. Abre una terminal
2. Navega hasta la carpeta donde quieres guardar el proyecto
3. Ejecuta el siguiente comando:
   ```
   git clone https://github.com/tuusuario/predictor-futbol-premium.git
   cd predictor-futbol-premium
   ```

## Paso 3: Instalar las Dependencias

1. Abre una terminal
2. Navega hasta la carpeta del proyecto:
   ```
   cd ruta/a/predictor-futbol-premium
   ```
3. Instala todas las dependencias con este comando:
   ```
   npm install
   ```
   Este proceso puede tardar unos minutos. Verás mucho texto en la terminal, lo cual es normal.

## Paso 4: Configurar la API Key

1. En la carpeta principal del proyecto, busca el archivo `.env.example`
2. Crea una copia de este archivo y renómbrala a `.env` (sin la extensión .example)
3. Abre el archivo `.env` con cualquier editor de texto (Notepad, VS Code, etc.)
4. Verás una línea como esta:
   ```
   API_FOOTBALL_KEY=your_api_key_here
   ```
5. Reemplaza "your_api_key_here" con tu clave de API-Football
6. Guarda el archivo

## Paso 5: Actualizar Archivos

Si necesitas actualizar archivos existentes:

1. Identifica la ubicación del archivo original usando la ruta indicada en el título del nuevo archivo
   - Por ejemplo: `backend/services/apiService.js`
2. Navega a esa carpeta en tu explorador de archivos
3. Haz una copia de seguridad del archivo original (renómbralo a algo como `apiService.js.backup`)
4. Guarda el nuevo archivo en esa ubicación con el nombre correcto

## Paso 6: Iniciar el Servidor

1. Abre una terminal
2. Navega hasta la carpeta del proyecto:
   ```
   cd ruta/a/predictor-futbol-premium
   ```
3. Inicia el servidor con este comando:
   ```
   npm run dev
   ```
4. Deberías ver un mensaje indicando que el servidor está funcionando, normalmente algo como:
   ```
   Server running on http://localhost:3000
   ```

## Paso 7: Acceder a la Aplicación

1. Abre tu navegador web (Chrome, Firefox, Edge, etc.)
2. En la barra de direcciones, escribe:
   ```
   http://localhost:3000
   ```
3. ¡La aplicación debería cargarse y estar lista para usar!

## Solución de Problemas Comunes

### Si ves un error sobre "puerto ya en uso"
Esto significa que el puerto 3000 está siendo usado por otra aplicación.
1. Cierra esa aplicación si la conoces, o
2. Cambia el puerto en el archivo `backend/app.js` (busca una línea con `const PORT = 3000` y cámbiala a otro número como 3001)

### Si ves un error sobre "módulo no encontrado"
Significa que falta alguna dependencia:
1. Asegúrate de haber ejecutado `npm install` correctamente
2. Intenta ejecutar `npm install [nombre-del-modulo]` donde [nombre-del-modulo] es el módulo que falta

### Si no puedes acceder a datos de la API
1. Verifica que tu clave API esté correctamente configurada en el archivo `.env`
2. Comprueba tu conexión a internet
3. Verifica que tu cuenta de API-Football esté activa y con peticiones disponibles

## Dónde Encontrar Ayuda

Si continúas teniendo problemas con la instalación:
1. Revisa la documentación oficial en el archivo README.md
2. Busca el error específico en Google
3. Pregunta en foros como Stack Overflow o comunidades de Node.js

## Nota sobre la Ampliación de Listas de Fútbol

Para ampliar las ligas de fútbol disponibles, necesitarás:

1. Verificar que tu plan de API-Football incluya esas ligas
2. No necesitas modificar el código, ya que el sistema cargará automáticamente todas las ligas disponibles en tu plan

En una próxima sesión, desarrollaremos funcionalidades específicas para personalizar y ampliar las ligas de fútbol según tus necesidades.
