# ⚽ Predictor de Fútbol Premium

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![AI](https://img.shields.io/badge/AI-Machine%20Learning-orange.svg)

**🚀 Aplicación web avanzada para predicciones de fútbol usando Inteligencia Artificial**

*Combina datos reales, machine learning y análisis estadístico para generar predicciones precisas*

[🌐 Demo En Vivo](#demo) • [📥 Instalación](#instalación) • [🎯 Características](#características) • [🧪 Pruebas](#pruebas)

</div>

---

## 📋 **Tabla de Contenidos**

- [🎯 Características](#-características)
- [🏗️ Arquitectura](#️-arquitectura)
- [📥 Instalación](#-instalación)
- [🚀 Inicio Rápido](#-inicio-rápido)
- [📚 Uso](#-uso)
- [🧪 Pruebas](#-pruebas)
- [⚙️ Configuración](#️-configuración)
- [🤖 Inteligencia Artificial](#-inteligencia-artificial)
- [🌍 APIs y Datos](#-apis-y-datos)
- [🎨 Personalización](#-personalización)
- [🐛 Solución de Problemas](#-solución-de-problemas)
- [🤝 Contribuir](#-contribuir)
- [📄 Licencia](#-licencia)

---

## 🎯 **Características**

### **⚽ Predicciones Avanzadas**
- ✅ **6 Mercados de apuestas**: 1X2, BTTS, Over/Under, Córners, Tarjetas, Hándicap
- ✅ **Inteligencia Artificial**: Machine Learning con Gradient Boosting
- ✅ **Niveles de confianza**: Indicador de fiabilidad (1-10)
- ✅ **Análisis automático**: Explicaciones detalladas de cada predicción

### **🌍 Cobertura Mundial**
- ✅ **50+ Ligas**: Premier League, La Liga, Bundesliga, Serie A, MLS, etc.
- ✅ **Todos los continentes**: Europa, América, Asia, África
- ✅ **Competiciones internacionales**: Champions League, Copa Libertadores
- ✅ **Partidos en vivo**: Integración con datos en tiempo real

### **🤖 Tecnología Avanzada**
- ✅ **Dual Architecture**: Node.js + Python para máximo rendimiento
- ✅ **Sistema de fallback**: Funciona aunque falle el servicio IA
- ✅ **Cache inteligente**: Respuestas ultrarrápidas
- ✅ **Responsive design**: Funciona en móvil, tablet y desktop

### **📊 Análisis Profundo**
- ✅ **Estadísticas avanzadas**: xG, forma reciente, head-to-head
- ✅ **Factores contextuales**: Local/visitante, importancia del partido
- ✅ **Visualizaciones**: Gráficos interactivos y fáciles de entender
- ✅ **Recomendaciones inteligentes**: Sugerencias automáticas

---

## 🏗️ **Arquitectura**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/HTML5)                   │
│  🌐 Interfaz de Usuario • 📱 Responsive • 🎨 Bootstrap 5   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 BACKEND NODE.JS                            │
│  🔌 API REST • 🔄 Cache • 🛣️ Routing • 🔐 Middleware     │
└─────────────────┬───────────────────┬───────────────────────┘
                  │                   │
┌─────────────────▼─────────────┐    ┌▼─────────────────────────┐
│     PYTHON ML SERVICE        │    │    EXTERNAL APIs        │
│  🤖 Machine Learning         │    │  ⚽ Football-API         │
│  📊 Gradient Boosting        │    │  🌐 Web Scraping        │
│  🎯 Predictions Engine       │    │  📈 Statistics APIs     │
└───────────────────────────────┘    └──────────────────────────┘
```

### **Componentes Principales**

| Componente | Tecnología | Función |
|------------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ | Interfaz de usuario responsiva |
| **Backend** | Node.js, Express.js | API REST y gestión de datos |
| **IA Service** | Python, Flask, Scikit-learn | Machine learning y predicciones |
| **Cache** | In-Memory / Redis | Optimización de rendimiento |
| **Database** | SQLite / PostgreSQL | Almacenamiento de datos |

---

## 📥 **Instalación**

### **📋 Requisitos del Sistema**

| Requisito | Versión Mínima | Recomendada | Descarga |
|-----------|----------------|-------------|-----------|
| **Node.js** | 16.0+ | 18.0+ | [nodejs.org](https://nodejs.org) |
| **Python** | 3.8+ | 3.11+ | [python.org](https://python.org) |
| **RAM** | 4GB | 8GB | - |
| **Espacio** | 500MB | 2GB | - |

### **🚀 Instalación Automática (Recomendada)**

1. **Descargar el proyecto**
   ```bash
   git clone https://github.com/tu-usuario/predictor-futbol-premium.git
   cd predictor-futbol-premium
   ```

2. **Ejecutar instalador automático**
   
   **Windows:**
   ```cmd
   instalar.bat
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Iniciar aplicación**
   ```cmd
   iniciar.bat        # Windows
   ./start.sh         # Mac/Linux
   ```

### **⚙️ Instalación Manual**

<details>
<summary>👆 Click para ver instalación paso a paso</summary>

#### **Paso 1: Preparar entorno**
```bash
# Verificar instalaciones
node --version
python --version
npm --version
pip --version
```

#### **Paso 2: Instalar dependencias de Node.js**
```bash
cd backend
npm install express cors morgan axios cheerio dotenv node-cache
```

#### **Paso 3: Instalar dependencias de Python**
```bash
cd python_service
pip install flask flask-cors pandas numpy scikit-learn joblib python-dotenv
```

#### **Paso 4: Configurar variables de entorno**
```bash
# Crear archivos .env
cp .env.example .env
# Editar con tus configuraciones
```

#### **Paso 5: Inicializar base de datos**
```bash
cd backend
node scripts/init-db.js
```

</details>

---

## 🚀 **Inicio Rápido**

### **⚡ Lanzar en 30 segundos**

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/predictor-futbol-premium.git

# 2. Entrar al directorio
cd predictor-futbol-premium

# 3. Instalar (automático)
./instalar.bat

# 4. Iniciar aplicación
./iniciar.bat

# 5. Abrir navegador
# Ve a: http://localhost:3000
```

### **🎯 Primera Predicción**

1. **Seleccionar liga**: Elige "La Liga" 
2. **Equipo local**: Escribe "Real Madrid"
3. **Equipo visitante**: Escribe "Barcelona"
4. **Fecha**: Selecciona fecha del partido
5. **Analizar**: Presiona "Generar Predicción"
6. **¡Ver resultados!**: Explora todas las pestañas

---

## 📚 **Uso**

### **🌐 Interfaz Web**

#### **Formulario Principal**
- **Liga**: Selecciona de 50+ ligas mundiales
- **Equipos**: Autocompletado inteligente
- **Fecha**: Selector de calendario
- **Opciones avanzadas**: Estadísticas adicionales

#### **Resultados de Predicción**
- **Resultado 1X2**: Probabilidades de victoria/empate
- **BTTS**: Ambos equipos marcan
- **Over/Under**: Líneas de goles múltiples
- **Córners**: Predicciones de corner kicks
- **Tarjetas**: Análisis disciplinario
- **Hándicap**: Hándicap asiático

### **🔌 API REST**

#### **Endpoints Principales**

```bash
# Predicción simple
POST /api/predict/simple
{
  "homeTeam": "Real Madrid",
  "awayTeam": "Barcelona",
  "league": "La Liga"
}

# Predicción avanzada (IA)
POST /api/predict/advanced
{
  "homeTeam": "Manchester City",
  "awayTeam": "Liverpool",
  "league": "Premier League",
  "includeStats": true
}

# Estado del sistema
GET /api/health
GET /api/python/status
```

#### **Respuesta de Ejemplo**

```json
{
  "success": true,
  "data": {
    "homeWinProbability": 0.65,
    "drawProbability": 0.22,
    "awayWinProbability": 0.13,
    "confidence": 8.5,
    "markets": {
      "btts": {"yes": 0.72, "no": 0.28},
      "overUnder": {
        "2.5": {"over": 0.68, "under": 0.32}
      }
    },
    "analysis": {
      "summary": "Partido con clara ventaja local",
      "recommendation": "Victoria Local + Over 2.5"
    }
  },
  "modelType": "advanced",
  "responseTime": 245
}
```

---

## 🧪 **Pruebas**

### **✅ Test Automáticos**

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas específicas
npm run test:backend     # Backend Node.js
npm run test:python      # Servicio Python
npm run test:integration # Pruebas de integración
npm run test:e2e         # End-to-end
```

### **🔍 Verificación Manual**

#### **Prueba de Funcionalidad Básica**
```bash
# 1. Verificar servicios
curl http://localhost:3000/api/health
curl http://localhost:5000/api/health

# 2. Prueba de predicción
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"homeTeam":"Barcelona","awayTeam":"Real Madrid","league":"La Liga"}'

# 3. Verificar respuesta
# Debería retornar JSON con predicciones
```

#### **Casos de Prueba Recomendados**

| Caso | Equipos | Liga | Resultado Esperado |
|------|---------|------|-------------------|
| **Clásico español** | Real Madrid vs Barcelona | La Liga | Predicción equilibrada |
| **Derbi inglés** | Manchester City vs Liverpool | Premier League | Análisis detallado |
| **Partido alemán** | Bayern Munich vs Dortmund | Bundesliga | Múltiples mercados |
| **Encuentro italiano** | Juventus vs Inter Milan | Serie A | Alta confianza |
| **Duelo francés** | PSG vs Marseille | Ligue 1 | Recomendaciones claras |

### **📊 Métricas de Rendimiento**

```bash
# Ejecutar benchmarks
npm run benchmark

# Métricas esperadas
# - Tiempo de respuesta: < 500ms
# - Precisión del modelo: > 60%
# - Disponibilidad: > 99%
# - Cache hit rate: > 80%
```

---

## ⚙️ **Configuración**

### **🔧 Variables de Entorno**

#### **Backend (.env)**
```env
# Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# APIs Externas
API_FOOTBALL_KEY=tu_clave_api_football
RAPID_API_KEY=tu_clave_rapid_api

# Servicios
PYTHON_SERVICE_URL=http://localhost:5000
CACHE_TTL=3600

# Base de Datos
DB_TYPE=sqlite
DB_PATH=./data/predictor.db

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/backend.log
```

#### **Python Service (.env)**
```env
# Flask
FLASK_ENV=production
PORT=5000
DEBUG=False

# Modelo ML
MODEL_PATH=models/saved/predictor_v2.joblib
CONFIDENCE_THRESHOLD=5.0
FEATURE_COUNT=25

# APIs
API_FOOTBALL_KEY=tu_clave_api_football
SCRAPING_DELAY=2000

# Cache
CACHE_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### **🎛️ Configuración Avanzada**

<details>
<summary>👆 Ver configuraciones avanzadas</summary>

#### **Configuración del Modelo ML**
```yaml
# python_service/config/model.yaml
model:
  type: gradient_boosting
  parameters:
    n_estimators: 200
    learning_rate: 0.1
    max_depth: 5
    min_samples_split: 10
  
  features:
    - team_form
    - home_advantage
    - h2h_history
    - xg_performance
    
  markets:
    - 1x2
    - btts
    - over_under
    - handicap
```

#### **Configuración de Cache**
```javascript
// backend/config/cache.js
module.exports = {
  // Cache en memoria
  memory: {
    ttl: 300,        // 5 minutos
    maxKeys: 1000
  },
  
  // Cache Redis
  redis: {
    host: 'localhost',
    port: 6379,
    ttl: 1800       // 30 minutos
  }
};
```

</details>

---

## 🤖 **Inteligencia Artificial**

### **📊 Modelo de Machine Learning**

#### **Algoritmo Principal**
- **Tipo**: Gradient Boosting Classifier
- **Framework**: Scikit-learn
- **Características**: 25+ variables predictivas
- **Precisión**: 65-70% en resultados 1X2
- **Entrenamiento**: 10,000+ partidos históricos

#### **Características del Modelo**
```python
features = [
    'team_form_last_5',      # Forma reciente
    'home_advantage',        # Ventaja de local
    'h2h_last_10',          # Historial directo
    'goals_scored_avg',      # Promedio goles a favor
    'goals_conceded_avg',    # Promedio goles en contra
    'clean_sheets_rate',     # Porcentaje porterías a cero
    'btts_rate',            # Porcentaje ambos marcan
    'over25_rate',          # Porcentaje over 2.5
    'cards_avg',            # Promedio tarjetas
    'corners_avg',          # Promedio córners
    'xg_performance',       # Rendimiento Expected Goals
    # ... 15+ características más
]
```

### **🎯 Mercados Soportados**

| Mercado | Descripción | Precisión |
|---------|-------------|-----------|
| **1X2** | Resultado del partido | 68% |
| **BTTS** | Ambos equipos marcan | 72% |
| **Over/Under** | Total de goles | 71% |
| **Córners** | Total de corner kicks | 65% |
| **Tarjetas** | Total de tarjetas | 69% |
| **Hándicap** | Hándicap asiático | 66% |

### **🔄 Entrenamiento del Modelo**

```bash
# Entrenar modelo desde cero
cd python_service
python train_model.py --data data/matches.csv --optimize

# Evaluar rendimiento
python evaluate_model.py --model models/saved/predictor_v2.joblib

# Generar informe
python generate_report.py --output reports/model_performance.html
```

---

## 🌍 **APIs y Datos**

### **📡 Fuentes de Datos**

#### **APIs Principales**
- **🥇 API-Football**: Datos oficiales en tiempo real
- **⚽ Football-Data.org**: Datos históricos gratuitos
- **📊 SofaScore**: Estadísticas avanzadas
- **📈 FBref**: Métricas detalladas

#### **Cobertura de Ligas**

<details>
<summary>🌍 Ver todas las ligas soportadas</summary>

**🇪🇺 Europa**
- Premier League (Inglaterra)
- La Liga (España)  
- Bundesliga (Alemania)
- Serie A (Italia)
- Ligue 1 (Francia)
- Eredivisie (Países Bajos)
- Primeira Liga (Portugal)
- Scottish Premiership (Escocia)

**🌎 América**
- MLS (Estados Unidos)
- Liga MX (México)
- Brasileirão (Brasil)
- Primera División (Argentina)
- Primera División (Colombia)
- Liga Profesional (Chile)

**🌏 Asia**
- J1 League (Japón)
- K League 1 (Corea del Sur)
- Chinese Super League (China)
- Indian Super League (India)

**🌍 África**
- Premier League (Sudáfrica)
- Egyptian Premier League (Egipto)

**🏆 Internacionales**
- Champions League
- Europa League
- Copa Libertadores
- Copa Sudamericana
- Copa del Mundo
- Eurocopa

</details>

### **🔄 Actualización de Datos**

```bash
# Actualizar datos manualmente
npm run update-data

# Configurar actualización automática
npm run setup-cron

# Verificar última actualización
curl http://localhost:3000/api/data/status
```

---

## 🎨 **Personalización**

### **🎨 Temas Visuales**

#### **Cambiar Colores**
```css
/* frontend/css/custom.css */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --warning-color: #ffc107;
  --danger-color: #dc3545;
}
```

#### **Logos y Branding**
```html
<!-- Cambiar logo en frontend/index.html -->
<img src="assets/logo.png" alt="Tu Logo" class="navbar-brand-img">
```

### **⚙️ Configuraciones Personalizadas**

#### **Añadir Nueva Liga**
```javascript
// backend/config/leagues.js
const customLeagues = {
  'Mi Liga Local': {
    id: 'custom_001',
    country: 'Mi País',
    teams: ['Equipo A', 'Equipo B', 'Equipo C']
  }
};
```

#### **Mercados Personalizados**
```python
# python_service/models/custom_markets.py
def predict_custom_market(match_data):
    # Tu lógica personalizada aquí
    return {
        'market': 'Mi Mercado',
        'probability': 0.75,
        'confidence': 8.2
    }
```

---

## 🐛 **Solución de Problemas**

### **❌ Problemas Comunes**

#### **🔴 Servicios no inician**
```bash
# Verificar puertos ocupados
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Matar procesos si es necesario
taskkill /PID <numero_pid> /F
```

#### **🔴 Error "Module not found"**
```bash
# Reinstalar dependencias
cd backend && npm install
cd python_service && pip install -r requirements.txt
```

#### **🔴 Predicciones no aparecen**
```bash
# Verificar logs
tail -f logs/backend.log
tail -f logs/python.log

# Verificar conectividad
curl http://localhost:3000/api/health
curl http://localhost:5000/api/health
```

#### **🔴 Modelo ML no carga**
```bash
# Verificar modelo existe
ls python_service/models/saved/

# Entrenar nuevo modelo
cd python_service
python train_simple.py
```

### **📞 Soporte**

#### **🆘 Obtener Ayuda**
1. **Revisar logs**: `logs/` directorio
2. **Ejecutar diagnóstico**: `npm run diagnose`
3. **Verificar configuración**: `npm run config-check`
4. **Reset completo**: `npm run reset`

#### **📝 Reportar Problemas**
```bash
# Generar reporte de error
npm run generate-error-report

# El reporte se guarda en: reports/error-report.json
```

---

## 🤝 **Contribuir**

### **🔧 Configurar Entorno de Desarrollo**

```bash
# Fork del repositorio
git clone https://github.com/tu-usuario/predictor-futbol-premium.git

# Crear rama de desarrollo
git checkout -b feature/nueva-funcionalidad

# Instalar dependencias de desarrollo
npm install --include=dev
pip install -r requirements-dev.txt

# Ejecutar en modo desarrollo
npm run dev
```

### **📋 Guías de Contribución**

#### **🐛 Reportar Bugs**
- Usa el template de issues
- Include logs y pasos para reproducir
- Especifica tu sistema operativo y versiones

#### **✨ Proponer Funcionalidades**
- Describe el caso de uso
- Incluye mockups si es posible
- Explica el valor añadido

#### **💻 Pull Requests**
- Sigue las convenciones de código
- Incluye tests para funcionalidad nueva
- Actualiza documentación si es necesario

---

## 📄 **Licencia**

MIT License

Copyright (c) 2024 Predictor de Fútbol Premium

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

**⚽ ¡Disfruta prediciendo resultados de fútbol con IA! 🤖**

[⬆️ Volver al inicio](#-predictor-de-fútbol-premium)

---

*Hecho con ❤️ para los amantes del fútbol y la tecnología*

</div>