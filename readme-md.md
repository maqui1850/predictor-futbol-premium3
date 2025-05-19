# Predictor de Fútbol Premium

Una aplicación avanzada para la predicción de resultados de fútbol que combina web scraping y APIs para ofrecer análisis detallado y recomendaciones.

## Características

- **Sistema dual de obtención de datos**: Web scraping directo + API-Football
- **Análisis avanzado de partidos**: Algoritmos estadísticos para generar predicciones
- **Predicciones completas** para todos los mercados:
  - Resultado 1X2 (Victoria local, empate, victoria visitante)
  - Over/Under goles (1.5, 2.5, 3.5)
  - Ambos equipos marcan (BTTS)
  - Córners
  - Tarjetas
  - Hándicap asiático
- **Interfaz limpia e intuitiva**
- **Visualización de datos** con gráficos
- **Caché inteligente** para optimizar consultas
- **Indicador de apuesta segura** para cada partido
- **Análisis visual** con códigos de color según confianza

## Requisitos previos

- Node.js (v14 o superior)
- NPM o Yarn
- Clave de API para API-Football (opcional, pero recomendado)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/predictor-futbol-premium.git
   cd predictor-futbol-premium
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` basado en `.env.example`
   - Añade tu clave de API-Football

4. Inicia el servidor:
   ```bash
   npm start
   ```

5. Abre tu navegador en `http://localhost:3000`

## Modos de uso

### Modo API

El modo API utiliza API-Football para obtener datos estructurados y completos. Este modo ofrece:
- Mayor precisión en las predicciones
- Más información detallada
- Datos históricos completos
- Información sobre lesiones y alineaciones

### Modo Web Scraping

El modo Web Scraping obtiene datos directamente de sitios web como SofaScore, FBref y Understat. Este modo:
- No requiere clave de API
- Actualización en tiempo real
- Acceso a datos estadísticos avanzados
- Opera sin limitaciones de solicitudes

## Estructura del proyecto

```
📁 predictor-futbol-premium/
│
├── 📁 backend/             # Servidor y lógica
│   ├── app.js              # Servidor principal
│   ├── 📁 controllers/     # Controladores
│   ├── 📁 models/          # Modelos de datos
│   ├── 📁 routes/          # Rutas API y web
│   ├── 📁 services/        # Servicios (API, scraping)
│   └── 📁 utils/           # Utilidades
│
├── 📁 frontend/            # Interfaz de usuario
│   ├── index.html          # Página principal
│   ├── 📁 css/             # Estilos
│   ├── 📁 js/              # Scripts cliente
│   └── 📁 assets/          # Recursos estáticos
│
├── package.json            # Dependencias
└── .env                    # Variables de entorno
```

## Tecnologías utilizadas

- **Backend**: Node.js, Express, Axios, Cheerio
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap, Chart.js
- **Datos**: API-Football, web scraping (SofaScore, FBref, Understat)

## Uso

1. Selecciona una liga en el menú desplegable
2. Elige una fecha para los partidos
3. Selecciona los equipos local y visitante
4. Haz clic en "Analizar Partido"
5. Revisa las predicciones detalladas en las diferentes pestañas
6. Observa la "Apuesta Recomendada" destacada

## Consejos

- Las predicciones con confianza superior a 7.0 se consideran de alto valor
- Usa el sistema de código de colores para identificar rápidamente las mejores apuestas:
  - **Verde**: Alta confianza (7.0+)
  - **Amarillo**: Confianza media (5.0-6.9)
  - **Rojo**: Baja confianza (<5.0)
- Alterna entre API y Web Scraping para comparar predicciones
- Actualiza datos específicos usando los botones de fuentes individuales

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo LICENSE para más detalles.
