# Estructura del Proyecto - Predictor de Fútbol Premium

```
📁 predictor-futbol-premium/
│
├── 📁 backend/
│   ├── 📄 app.js              # Servidor principal
│   ├── 📁 controllers/
│   │   ├── 📄 apiController.js   # Control de datos API
│   │   ├── 📄 scrapingController.js  # Control de web scraping
│   │   └── 📄 predictionController.js # Motor de predicciones
│   │
│   ├── 📁 models/
│   │   ├── 📄 match.js        # Modelo de partidos
│   │   ├── 📄 team.js         # Modelo de equipos
│   │   └── 📄 prediction.js   # Modelo de predicciones
│   │
│   ├── 📁 routes/
│   │   ├── 📄 api.js          # Rutas API
│   │   └── 📄 web.js          # Rutas web
│   │
│   ├── 📁 services/
│   │   ├── 📄 apiService.js   # Servicios de API externa
│   │   ├── 📄 scrapingService.js # Servicios de web scraping
│   │   └── 📄 analysisService.js # Servicios de análisis
│   │
│   └── 📁 utils/
│       ├── 📄 cache.js        # Sistema de caché
│       └── 📄 dataProcessor.js # Procesamiento de datos
│
├── 📁 frontend/
│   ├── 📄 index.html          # Página principal
│   ├── 📁 css/
│   │   └── 📄 styles.css      # Estilos principales
│   │
│   ├── 📁 js/
│   │   ├── 📄 main.js         # Script principal
│   │   ├── 📄 api.js          # Conexión con backend
│   │   └── 📄 ui.js           # Funciones de interfaz 
│   │
│   └── 📁 assets/
│       ├── 📁 icons/          # Iconos de la aplicación
│       └── 📁 images/         # Imágenes generales
│
├── 📄 package.json            # Dependencias del proyecto
├── 📄 .env                    # Variables de entorno (API keys)
└── 📄 README.md               # Documentación
```

## Tecnologías Utilizadas

### Backend
- **Node.js**: Plataforma de ejecución
- **Express**: Framework web
- **Axios**: Cliente HTTP para API
- **Cheerio**: Web scraping
- **Puppeteer**: Web scraping avanzado (si es necesario)
- **MongoDB**: Base de datos (opcional)

### Frontend
- **HTML/CSS/JavaScript**: Estructura básica
- **Bootstrap**: Framework CSS para diseño responsivo
- **Chart.js**: Visualización de datos
- **Font Awesome**: Iconos

## Requisitos del Sistema
- Node.js (v14+)
- NPM o Yarn
- Conexión a Internet
- API key de API-Football (o alternativa)
