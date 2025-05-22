from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import logging
import json
import traceback
from datetime import datetime
import pandas as pd
import numpy as np

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/python_service.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('predictor_futbol_premium')

# Asegurar que exista el directorio de logs
os.makedirs('logs', exist_ok=True)

# Añadir directorio actual al PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Inicializar aplicación Flask
app = Flask(__name__)
CORS(app)  # Permitir solicitudes cross-origin

# Variables globales
predictor = None
model_loaded = False
version = "1.0.0"

# Intentar importar los modelos
try:
    from models.predictor_modelo import PredictorModel
    from utils.data_manager import DataManager
    from utils.auth import verify_api_key
    
    # Inicializar servicios
    data_manager = DataManager()
    
    # Cargar modelo si existe
    model_path = os.environ.get('MODEL_PATH', 'models/saved_model.joblib')
    if os.path.exists(model_path):
        predictor = PredictorModel(model_path=model_path)
        model_loaded = True
        logger.info(f"Modelo cargado exitosamente desde {model_path}")
    else:
        predictor = PredictorModel()  # Instancia sin modelo preentrenado
        logger.warning(f"No se encontró modelo en {model_path}, se usará modelo base")
    
    logger.info("Servicios y modelos inicializados correctamente")
except Exception as e:
    logger.error(f"Error al inicializar servicios: {str(e)}")
    logger.error(traceback.format_exc())
    
    # Implementar modelos básicos para funcionamiento mínimo
    class DataManager:
        def get_match_data(self, match_id=None):
            return {"status": "simulated", "data": {}}
            
        def get_team_stats(self, team_id):
            return {"status": "simulated", "data": {}}
    
    class PredictorModel:
        def __init__(self, model_path=None):
            pass
        
        def predict_match(self, match_data):
            # Simulación básica de predicción
            return {
                'prediction': 'local_win',
                'probabilities': {
                    'local_win': 0.65,
                    'draw': 0.20,
                    'away_win': 0.15
                },
                'confidence': 6.5,
                'timestamp': datetime.now().isoformat()
            }
    
    # Inicializar con modelos básicos
    data_manager = DataManager()
    predictor = PredictorModel()

# Decorador para medir tiempo de respuesta
def timer(func):
    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        result = func(*args, **kwargs)
        end_time = datetime.now()
        execution_time = (end_time - start_time).total_seconds() * 1000  # en milisegundos
        logger.info(f"Endpoint {func.__name__} ejecutado en {execution_time:.2f} ms")
        return result
    return wrapper

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'active',
        'service': 'Predictor de Fútbol Premium API',
        'version': version,
        'model_loaded': model_loaded
    })

@app.route('/api/predict', methods=['POST'])
@timer
def predict():
    try:
        # Obtener datos del partido desde la solicitud
        request_data = request.json
        logger.info(f"Solicitud de predicción recibida: {json.dumps(request_data)}")
        
        if not request_data:
            return jsonify({'error': 'No se proporcionaron datos del partido'}), 400
        
        # Validar datos mínimos necesarios
        required_fields = ['home_team', 'away_team', 'league']
        missing_fields = [field for field in required_fields if field not in request_data]
        if missing_fields:
            return jsonify({'error': f'Faltan campos requeridos: {", ".join(missing_fields)}'}), 400
        
        # Enriquecer datos del partido si es necesario
        match_data = enrich_match_data(request_data)
        
        # Realizar predicción
        result = predictor.predict_match(match_data)
        
        # Añadir metadatos
        result['request_id'] = request_data.get('request_id', f"pred_{int(datetime.now().timestamp())}")
        result['model_version'] = version
        result['timestamp'] = datetime.now().isoformat()
        
        logger.info(f"Predicción generada: {json.dumps(result)}")
        return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error en predicción: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': str(e),
            'status': 'error',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Comprueba el estado de salud del servicio"""
    return jsonify({
        'status': 'ok', 
        'model_loaded': model_loaded,
        'version': version,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/stats', methods=['GET'])
def service_stats():
    """Devuelve estadísticas del servicio"""
    # En una implementación real, se guardarían estadísticas en una base de datos
    stats = {
        'total_predictions': 0,  # Placeholder
        'avg_response_time': 0,  # Placeholder
        'accuracy': 0,           # Placeholder
        'uptime': 0,             # Placeholder
        'timestamp': datetime.now().isoformat()
    }
    return jsonify(stats)

@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Devuelve información sobre el modelo cargado"""
    if not model_loaded or not hasattr(predictor, 'get_model_info'):
        return jsonify({
            'error': 'Información del modelo no disponible',
            'model_loaded': model_loaded
        }), 404
    
    # Obtener información del modelo
    try:
        info = predictor.get_model_info()
        return jsonify(info)
    except Exception as e:
        logger.error(f"Error al obtener información del modelo: {str(e)}")
        return jsonify({'error': str(e)}), 500

def enrich_match_data(request_data):
    """
    Enriquece los datos del partido con información adicional
    
    Args:
        request_data (dict): Datos básicos del partido
        
    Returns:
        dict: Datos enriquecidos
    """
    # Copiar datos originales
    enriched_data = request_data.copy()
    
    try:
        # Obtener estadísticas de equipos si no están incluidas
        if 'home_team_stats' not in enriched_data and 'home_team_id' in enriched_data:
            home_team_id = enriched_data['home_team_id']
            home_stats = data_manager.get_team_stats(home_team_id)
            if home_stats and 'data' in home_stats:
                enriched_data['home_team_stats'] = home_stats['data']
        
        if 'away_team_stats' not in enriched_data and 'away_team_id' in enriched_data:
            away_team_id = enriched_data['away_team_id']
            away_stats = data_manager.get_team_stats(away_team_id)
            if away_stats and 'data' in away_stats:
                enriched_data['away_team_stats'] = away_stats['data']
        
        # Añadir marcadores de tiempo
        enriched_data['processed_timestamp'] = datetime.now().isoformat()
        
        logger.info(f"Datos enriquecidos correctamente")
        return enriched_data
    
    except Exception as e:
        logger.warning(f"Error al enriquecer datos: {str(e)}")
        # Devolver datos originales si hay error
        return request_data

if __name__ == '__main__':
    # Definir puerto (usa variable de entorno o 5000 por defecto)
    port = int(os.environ.get('PORT', 5000))
    
    # Configuración para producción vs desarrollo
    debug_mode = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    logger.info(f"Iniciando servicio en puerto {port}, modo depuración: {debug_mode}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
