# Predictor de Fútbol Premium

![Predictor de Fútbol Premium](https://via.placeholder.com/800x200?text=Predictor+de+F%C3%BAtbol+Premium)

## Descripción

Predictor de Fútbol Premium es una plataforma web que utiliza algoritmos avanzados de machine learning para generar predicciones precisas de resultados de partidos de fútbol. El sistema analiza miles de datos históricos y factores relevantes para ofrecer predicciones con diferentes niveles de confianza.

## Estado del Proyecto

### ✅ Implementado
- **Arquitectura híbrida**: Sistema dual Node.js + Python completamente estructurado
- **Backend Node.js**: Completo con rutas, caché, controladores y modelos
- **Servicio Python**: Base implementada con Flask, modelos de ML y gestión de datos
- **Modelo de predicción**: Algoritmo Gradient Boosting con características avanzadas
- **Sistema de evaluación**: Métricas completas y visualizaciones
- **Gestión de datos**: DataManager con caché, base de datos SQLite y API integration
- **Sistema de autenticación**: API keys y JWT tokens
- **Configuración de despliegue**: Docker, Gunicorn, Nginx

### 🔄 En Progreso
- **Entrenamiento del modelo**: Script completo disponible, requiere datos históricos
- **Integración Node.js-Python**: Cliente HTTP implementado, requiere pruebas
- **Interface de usuario**: Base implementada, requiere conexión con predicciones avanzadas

### 📋 Pendiente
- **Datos de entrenamiento**: Recopilación de datos históricos de partidos
- **Despliegue en producción**: Configuración de servidores
- **Dashboard de métricas**: Monitoreo de rendimiento del modelo

## Arquitectura

```
Predictor-Futbol-Premium/
├── backend/                    # Servidor Node.js
│   ├── controllers/           # Controladores de API
│   ├── models/               # Modelos de datos
│   ├── routes/               # Rutas de API
│   ├── services/             # Servicios (API, scraping, pythonClient)
│   ├── middleware/           # Middleware de integración
│   └── utils/                # Utilidades (cache, dataProcessor)
├── python_service/           # Servicio de ML en Python
│   ├── models/              # Modelos de predicción ML
│   ├── utils/               # Gestión de datos y autenticación
│   ├── config/              # Configuración de despliegue
│   └── scripts/             # Scripts de entrenamiento
├── frontend/                # Interfaz de usuario
│   ├── css/                 # Estilos
│   ├── js/                  # JavaScript del cliente
│   └── index.html           # Página principal
└── docs/                    # Documentación
```

## Características Principales

### Predicciones Avanzadas
- **Algoritmo de ML**: Gradient Boosting con más de 30 características
- **Múltiples mercados**: 1X2, BTTS, Over/Under, xG, hándicap asiático, córners
- **Niveles de confianza**: Indicador de fiabilidad (escala 1-10)
- **Sistema de fallback**: Modelo alternativo cuando el servicio ML no está disponible

### Datos y Análisis
- **Fuentes múltiples**: API-Football + Web scraping como respaldo
- **Gestión inteligente**: Cache multinivel (memoria + Redis + base de datos)
- **Estadísticas avanzadas**: xG, forma reciente, head-to-head, factores contextuales
- **Procesamiento de datos**: Normalización y feature engineering automático

### Tecnologías

#### Backend Principal
- **Node.js + Express**: Servidor principal
- **SQLite/PostgreSQL**: Base de datos
- **Redis**: Cache distribuido
- **Axios**: Cliente HTTP

#### Servicio ML
- **Python + Flask**: API de machine learning
- **Scikit-learn**: Algoritmos de ML
- **Pandas + NumPy**: Procesamiento de datos
- **Joblib**: Persistencia de modelos

#### Frontend
- **HTML5 + CSS3**: Estructura y estilos modernos
- **JavaScript ES6+**: Lógica del cliente
- **Bootstrap 5**: Framework CSS responsivo
- **Chart.js**: Visualizaciones interactivas

#### Despliegue
- **Docker**: Containerización
- **Gunicorn + Nginx**: Servidor de producción
- **YAML**: Configuración declarativa

## Instalación y Configuración

### Requisitos Previos
- Node.js 16+
- Python 3.8+
- SQLite/PostgreSQL
- Redis (opcional, para producción)

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/predictor-futbol-premium.git
cd predictor-futbol-premium
```

### 2. Configurar Backend Node.js
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm start
```

### 3. Configurar Servicio Python
```bash
cd python_service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tus configuraciones
python app.py
```

### 4. Variables de Entorno Requeridas

#### Backend (.env)
```
NODE_ENV=development
PORT=3000
API_FOOTBALL_KEY=tu_clave_api_football
PYTHON_SERVICE_URL=http://localhost:5000
CACHE_TTL=3600
```

#### Python Service (.env)
```
FLASK_ENV=development
PORT=5000
API_FOOTBALL_KEY=tu_clave_api_football
MODEL_PATH=models/saved_model.joblib
API_KEYS=clave1,clave2,clave3
JWT_SECRET_KEY=clave_secreta_jwt
```

## Uso de la API

### Endpoints Principales

#### Predicciones
```bash
# Predicción simple (siempre disponible)
POST /api/predict/simple
{
  "homeTeam": "Barcelona",
  "awayTeam": "Real Madrid",
  "league": "La Liga",
  "date": "2024-05-20"
}

# Predicción avanzada (con ML)
POST /api/predict/advanced
{
  "homeTeam": "Barcelona",
  "awayTeam": "Real Madrid",
  "league": "La Liga",
  "date": "2024-05-20",
  "includeStats": true
}

# Predicción inteligente (avanzada si disponible, simple como fallback)
POST /api/predict
{
  "homeTeam": "Barcelona",
  "awayTeam": "Real Madrid",
  "league": "La Liga"
}
```

#### Estado del Sistema
```bash
# Estado general
GET /api/health

# Estado del servicio Python
GET /api/python/status

# Métricas del servicio
GET /api/stats
```

### Respuesta de Predicción
```json
{
  "success": true,
  "data": {
    "homeWinProbability": 0.65,
    "drawProbability": 0.22,
    "awayWinProbability": 0.13,
    "expectedGoals": {
      "home": 2.1,
      "away": 0.8,
      "total": 2.9
    },
    "markets": {
      "btts": {
        "yes": 0.45,
        "no": 0.55
      },
      "overUnder": {
        "over2_5": 0.62,
        "under2_5": 0.38
      }
    },
    "confidence": 7.5,
    "analisis": {
      "local": "Barcelona tiene una probabilidad del 65% de ganar",
      "visitante": "Real Madrid tiene una probabilidad del 13% de ganar",
      "general": "Partido con clara ventaja para el equipo local"
    }
  },
  "modelType": "advanced",
  "serviceStatus": "online",
  "responseTime": 245
}
```

## Entrenamiento del Modelo

### Preparar Datos
```bash
cd python_service
python train_model.py --data datos_historicos.csv --format csv --optimize
```

### Configuración de Entrenamiento
El archivo `config/deployment.yaml` contiene toda la configuración:
- Parámetros del modelo
- Características a utilizar
- Configuración de optimización
- Métricas de evaluación

## Despliegue en Producción

### Docker Compose
```bash
# Construir y ejecutar todos los servicios
docker-compose up -d

# Solo el backend
docker-compose up backend

# Solo el servicio Python
docker-compose up python-service
```

### Configuración Manual
```bash
# Backend Node.js con PM2
pm2 start backend/app.js --name predictor-backend

# Servicio Python con Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 python_service.app:app
```

## Monitoreo y Métricas

### Métricas Disponibles
- **Precisión del modelo**: Accuracy, precision, recall, F1-score
- **Métricas de apuestas**: ROI simulado, predicciones de alta confianza
- **Rendimiento**: Tiempo de respuesta, disponibilidad
- **Uso**: Número de predicciones, cache hit rate

### Dashboard de Monitoreo
- Prometheus + Grafana (opcional)
- Logs estructurados
- Alertas de rendimiento

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## Roadmap

### Versión 1.1
- [ ] Dashboard de métricas en tiempo real
- [ ] Predicciones personalizadas por usuario
- [ ] Sistema de alertas para oportunidades

### Versión 1.2
- [ ] Soporte para más ligas
- [ ] Modelo de ensemble (múltiples algoritmos)
- [ ] API pública con rate limiting

### Versión 2.0
- [ ] Predicciones en tiempo real durante partidos
- [ ] Integración con casas de apuestas
- [ ] Machine learning automático (AutoML)

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

- 📧 Email: soporte@predictor-futbol-premium.com
- 📚 Documentación: [docs.predictor-futbol-premium.com](https://docs.predictor-futbol-premium.com)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/predictor-futbol-premium/issues)

---

**Predictor de Fútbol Premium** - Predicciones inteligentes con tecnología avanzada 🚀⚽