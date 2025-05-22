from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import logging
import json
import datetime

# Configurar logging para consola además de archivo
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('python_service.log'),
        logging.StreamHandler()  # Añadir logging a consola
    ]
)
logger = logging.getLogger('python_service')

# Añadir directorio actual al PATH
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar modelos
try:
    from models.predictor_model_v2 import PredictorFutbolPremium
    logger.info("Modelos importados correctamente")
except Exception as e:
    logger.error(f"Error al importar modelos: {str(e)}")
    # Crear una clase simulada si falla la importación
    class PredictorFutbolPremium:
        def __init__(self, model_path=None):
            pass
        
        def predict_match(self, match_data):
            # Leer datos del partido para logs
            local_team = match_data.get('local_team', 'Desconocido')
            away_team = match_data.get('away_team', 'Desconocido')
            logger.info(f"Generando predicción simulada para: {local_team} vs {away_team}")
            
            # Simular respuesta
            return {
                'prediction': 'local_win',
                'probabilities': {
                    'local_win': 0.7,
                    'draw': 0.2,
                    'away_win': 0.1
                },
                'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }

# Inicializar aplicación Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Permitir solicitudes de cualquier origen

# Inicializar modelo (puedes cargarlo desde un archivo si existe)
predictor = None
try:
    # Si tienes un modelo entrenado guardado:
    # predictor = PredictorFutbolPremium(model_path='models/saved_model.joblib')
    
    # Por ahora, instanciamos sin cargar un modelo:
    predictor = PredictorFutbolPremium()
    logger.info("Modelo inicializado correctamente")
except Exception as e:
    logger.error(f"Error al inicializar modelo: {str(e)}")

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'active',
        'service': 'Predictor de Fútbol Premium API',
        'version': '1.0.0'
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        # Obtener datos del partido desde la solicitud
        match_data = request.json
        logger.info(f"Solicitud de predicción recibida: {json.dumps(match_data)}")
        
        if not match_data:
            logger.warning("No se proporcionaron datos del partido")
            return jsonify({'error': 'No se proporcionaron datos del partido'}), 400
        
        # Log para depuración
        logger.info(f"Campos recibidos: {list(match_data.keys())}")
        
        # Validar datos mínimos necesarios - ser flexibles con los nombres de campo
        required_fields_mapping = {
            'local_team': ['local_team', 'equipoLocal', 'homeTeam', 'home_team', 'local'],
            'away_team': ['away_team', 'equipoVisitante', 'awayTeam', 'away_team', 'visitante'],
            'competition': ['competition', 'liga', 'league', 'competicion']
        }
        
        normalized_data = {}
        missing_fields = []
        
        for standard_field, possible_names in required_fields_mapping.items():
            found = False
            for field_name in possible_names:
                if field_name in match_data and match_data[field_name]:
                    normalized_data[standard_field] = match_data[field_name]
                    found = True
                    break
            
            if not found:
                missing_fields.append(standard_field)
        
        if missing_fields:
            error_msg = f'Faltan campos requeridos: {", ".join(missing_fields)}'
            logger.warning(error_msg)
            return jsonify({'error': error_msg}), 400
        
        # Incluir fecha si está disponible
        if 'fecha' in match_data:
            normalized_data['match_date'] = match_data['fecha']
        elif 'date' in match_data:
            normalized_data['match_date'] = match_data['date']
        
        logger.info(f"Datos normalizados para predicción: {json.dumps(normalized_data)}")
        
        # Realizar predicción
        if predictor:
            result = predictor.predict_match(normalized_data)
            logger.info(f"Predicción generada: {json.dumps(result)}")
            return jsonify(result)
        else:
            logger.error("El modelo no está disponible")
            return jsonify({'error': 'El modelo no está disponible'}), 500
            
    except Exception as e:
        logger.error(f"Error en predicción: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'model_loaded': predictor is not None})

# Ruta adicional para depuración
@app.route('/api/echo', methods=['POST'])
def echo():
    data = request.json
    logger.info(f"Solicitud de eco recibida: {json.dumps(data)}")
    return jsonify({
        'received': data,
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

if __name__ == '__main__':
    # Definir puerto (usa variable de entorno o 5000 por defecto)
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Iniciando servidor en http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)