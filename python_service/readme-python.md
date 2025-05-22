# Servicio Python - Predictor de Fútbol Premium

Este componente proporciona un servicio de análisis avanzado y predicción para el Predictor de Fútbol Premium, implementando modelos de machine learning para generar pronósticos más precisos.

## Estructura del proyecto

```
python_service/
├── app.py                     # API Flask principal
├── logs/                      # Directorio para archivos de log
├── models/                    # Modelos de predicción
│   ├── estadisticas_modelo.py # Procesamiento de estadísticas
│   ├── predictor_modelo.py    # Modelo principal de predicción
│   └── saved_model.joblib     # Modelo entrenado (cuando exista)
├── utils/                     # Utilidades
│   ├── auth.py                # Autenticación y seguridad
│   └── data_manager.py        # Gestión de datos
└── requirements.txt           # Dependencias
```

## Requisitos

- Python 3.8 o superior
- Dependencias listadas en requirements.txt

## Instalación

### 1. Preparar entorno virtual

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Unix/MacOS:
source venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del directorio con las siguientes variables:

```
API_FOOTBALL_KEY=tu_clave_api_football
PORT=5000
FLASK_ENV=development
MODEL_PATH=models/saved_model.joblib
API_KEYS=clave1,clave2,clave3
JWT_SECRET_KEY=clave_secreta_para_jwt
```

## Uso

### Iniciar el servicio

```bash
python app.py
```

El servidor estará disponible en http://localhost:5000 (o el puerto configurado).

### Endpoints disponibles

1. **Verificación de estado**
   - `GET /`: Información básica del servicio
   - `GET /api/health`: Estado de salud del servicio

2. **Predicciones**
   - `POST /api/predict`: Realizar predicción para un partido
     ```json
     {
       "home_team": "Barcelona",
       "away_team": "Real Madrid",
       "league": "La Liga",
       "home_team_id": 33,
       "away_team_id": 34,
       "date": "2025-05-20"
     }
     ```

3. **Información del modelo**
   - `GET /api/model/info`: Información sobre el modelo cargado

4. **Estadísticas**
   - `GET /api/stats`: Estadísticas de uso del servicio

## Modelo de predicción

El servicio utiliza un algoritmo de Gradient Boosting (GBM) que analiza múltiples factores:

- Rendimiento histórico de los equipos
- Forma reciente 
- Historial de enfrentamientos directos
- Factores contextuales (lesiones, cansancio, etc.)
- Estadísticas ofensivas y defensivas

### Mercados de predicción

El modelo genera predicciones para los siguientes mercados:

- Resultado 1X2 (Victoria local, empate, victoria visitante)
- Ambos equipos marcan (BTTS)
- Total de goles (Over/Under)
- Estadísticas esperadas (xG)

### Nivel de confianza

Cada predicción incluye un nivel de confianza en escala 0-10, calculado en base a:
- Cantidad y calidad de los datos disponibles
- Consistencia en el rendimiento de los equipos
- Claridad en la diferencia de fuerza entre equipos
- Historial de enfrentamientos directos

## Integración con el backend principal

Este servicio está diseñado para ser consumido por el backend principal Node.js a través de solicitudes HTTP. La comunicación típica sigue este flujo:

1. El backend Node.js recibe una solicitud para analizar un partido
2. Node.js recopila datos básicos y los envía al servicio Python
3. El servicio Python procesa los datos y aplica el modelo de predicción
4. Las predicciones son devueltas al backend Node.js
5. Node.js enriquece y presenta los resultados al usuario

## Desarrollo

### Entrenamiento del modelo

Para entrenar el modelo con nuevos datos:

```python
from models.predictor_modelo import PredictorModel

# Cargar datos de entrenamiento
X_train = ...  # Características
y_train = ...  # Etiquetas (resultados)

# Crear y entrenar modelo
model = PredictorModel()
model.train(X_train, y_train, optimize=True)

# Guardar modelo entrenado
model.save_model('models/predictor_model_nuevo.joblib')
```

### Testing

Para ejecutar pruebas unitarias:

```bash
python -m unittest discover tests
```

## Solución de problemas

### El modelo no se carga

Verificar que:
- El archivo del modelo existe en la ruta especificada
- La versión de scikit-learn coincide con la usada para entrenamiento
- Los logs muestran errores específicos en `logs/python_service.log`

### Error en las predicciones

Si las predicciones parecen incorrectas:
- Verificar que los datos de entrada están completos
- Comprobar que el formato de los datos es correcto
- Revisar que las estadísticas de los equipos son actuales

### Problemas de rendimiento

Para mejorar el rendimiento:
- Activar el caché
- Reducir la verbosidad de logs
- Configurar un servidor WSGI como Gunicorn en producción

## Licencia

Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE para más detalles.
