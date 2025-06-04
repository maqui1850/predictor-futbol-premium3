# 🚀 Inicio Rápido - Predictor de Fútbol Premium

## ⚡ Lanzar la Aplicación en 3 Minutos

### Opción 1: Automático (Recomendado)
```bash
# Descargar y ejecutar en un solo comando
chmod +x launch_app.sh
./launch_app.sh
```

### Opción 2: Manual (Control paso a paso)
```bash
# 1. Configuración inicial
chmod +x quick_start.sh
./quick_start.sh

# 2. Terminal 1: Servicio Python (ML)
chmod +x start_python.sh
./start_python.sh

# 3. Terminal 2: Backend Node.js
chmod +x start_backend.sh  
./start_backend.sh

# 4. Abrir navegador
open http://localhost:3000
```

## 🎯 URLs de la Aplicación

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Interfaz Web** | http://localhost:3000 | Aplicación principal |
| **API Backend** | http://localhost:3000/api | API REST de Node.js |
| **Servicio ML** | http://localhost:5000/api | API de Machine Learning |
| **Estado** | http://localhost:3000/api/health | Health check |

## 🧪 Pruebas Rápidas

### Verificar que todo funciona:
```bash
# Health checks
curl http://localhost:3000/api/health
curl http://localhost:5000/api/health

# Predicción simple
curl -X POST http://localhost:3000/api/predict/simple \
  -H "Content-Type: application/json" \
  -d '{"homeTeam": "Real Madrid", "awayTeam": "Barcelona", "league": "La Liga"}'

# Predicción avanzada (con ML)
curl -X POST http://localhost:3000/api/predict/advanced \
  -H "Content-Type: application/json" \
  -d '{"homeTeam": "Manchester City", "awayTeam": "Liverpool", "league": "Premier League"}'
```

### Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "homeWinProbability": 0.65,
    "drawProbability": 0.22,
    "awayWinProbability": 0.13,
    "confidence": 7.5,
    "analisis": {
      "local": "Real Madrid tiene una probabilidad del 65% de ganar",
      "general": "Partido con clara ventaja para el equipo local"
    }
  },
  "modelType": "advanced"
}
```

## 📊 Funcionalidades Disponibles

### ✅ Inmediatamente Funcional
- **Predicciones básicas**: Modelo estadístico simple
- **Predicciones ML**: Gradient Boosting entrenado  
- **API REST**: Endpoints completos
- **Interfaz web**: Dashboard funcional
- **Sistema de fallback**: Automático si ML falla

### 🔄 En desarrollo (próximas versiones)
- Datos históricos reales (más de 3 temporadas)
- Modelos ensemble (múltiples algoritmos)
- Dashboard de métricas en tiempo real
- Más ligas y competiciones

## 🛠️ Requisitos del Sistema

### Mínimos
- **Node.js** 16+ ([descargar](https://nodejs.org))
- **Python** 3.8+ ([descargar](https://python.org))
- **4GB RAM** disponibles
- **500MB** espacio en disco

### Recomendados
- **Node.js** 18+
- **Python** 3.9+
- **8GB RAM**
- **2GB** espacio en disco

## 🔧 Solución de Problemas

### ❌ "Puerto 3000 ya en uso"
```bash
# Encontrar proceso
lsof -i :3000

# Terminar proceso
kill -9 <PID>
```

### ❌ "Python service no responde"
```bash
# Verificar que Python está funcionando
python3 --version
pip --version

# Reinstalar dependencias
cd python_service
pip install -r requirements.txt
```

### ❌ "Error al entrenar modelo"
```bash
# Verificar datos
ls -la python_service/data/
head python_service/data/partidos_historicos.csv

# Entrenamiento manual
cd python_service
python train_simple.py
```

### ❌ "Node.js no encuentra módulos"
```bash
# Reinstalar dependencias
cd backend
rm -rf node_modules
npm install
```

## 📝 Arquitectura Técnica

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Python ML     │
│   (Port 3000)   │◄──►│   Node.js       │◄──►│   Flask         │
│   HTML/JS/CSS   │    │   (Port 3000)   │    │   (Port 5000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   Cache +       │
                        │   Database      │
                        │   (In-Memory)   │
                        └─────────────────┘
```

## 🚀 Próximos Pasos

### Una vez funcionando:
1. **Probar predicciones** en la interfaz web
2. **Explorar la API** con diferentes equipos
3. **Revisar logs** para entender el funcionamiento
4. **Personalizar** equipos y ligas

### Para desarrollo:
1. **Agregar datos reales** de partidos históricos
2. **Mejorar el modelo** con más características
3. **Personalizar interfaz** con tu diseño
4. **Integrar APIs externas** (API-Football, etc.)

## 📞 Soporte

Si algo no funciona:

1. **Revisar logs**: `logs/node.log` y `logs/python.log`
2. **Verificar puertos**: `lsof -i :3000` y `lsof -i :5000`
3. **Reinstalar dependencias**: Scripts incluidos
4. **Ejecutar tests**: `curl` commands arriba

## 🎉 ¡Listo!

Tu Predictor de Fútbol Premium debería estar funcionando en:
**http://localhost:3000**

¡Disfruta prediciendo resultados de fútbol con IA! ⚽🤖