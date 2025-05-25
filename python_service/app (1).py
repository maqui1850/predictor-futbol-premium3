# python_service/app.py

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

# Configurar logger
logger = logging.getLogger('app')

def create_app(config=None):
    """
    Crea y configura la aplicación Flask
    
    Args:
        config (dict, optional): Configuración de la aplicación
        
    Returns:
        Flask: Aplicación Flask configurada
    """
    app = Flask(__name__)
    
    # Configuración por defecto
    app.config.update({
        'DEBUG': False,
        'TESTING': False,
        'JSON_SORT_KEYS': False,
        'JSONIFY_PRETTYPRINT_REGULAR': True,
    })
    
    # Aplicar configuración personalizada
    if config:
        app.config.update({
            'DEBUG': config.get('debug', False),
            'TESTING': config.get('testing', False),
            'SECRET_KEY': config.get('secret_key', os.urandom(24).hex()),
        })
        
        # Guardar configuración completa para acceso desde otros módulos
        app.config['APP_CONFIG'] = config
    
    # Configurar CORS
    cors_config = config.get('api', {}).get('cors', {})
    if cors_config.get('enabled', True):
        origins = cors_config.get('origins', ['*'])
        CORS(app, resources={r"/api/*": {"origins": origins}})
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Registrar manejadores de errores
    register_error_handlers(app)
    
    # Registrar rutas básicas
    register_routes(app)
    
    # Inicializar extensiones
    init_extensions(app)
    
    logger.info("Aplicación Flask inicializada")
    return app

def register_blueprints(app):
    """Registra los blueprints de la aplicación"""
    try:
        # Importar blueprints
        from app.api.predict import predict_bp
        from app.api.teams import teams_bp
        from app.api.model import model_bp
        
        # Prefijo de API desde configuración
        api_prefix = app.config.get('APP_CONFIG', {}).get('api', {}).get('prefix', '/api')
        
        # Registrar blueprints
        app.register_blueprint(predict_bp, url_prefix=f"{api_prefix}/predict")
        app.register_blueprint(teams_bp, url_prefix=f"{api_prefix}/team")
        app.register_blueprint(model_bp, url_prefix=f"{api_prefix}/model")
        
        logger.info("Blueprints registrados correctamente")
    except Exception as e:
        logger.error(f"Error registrando blueprints: {e}")

def register_error_handlers(app):
    """Registra manejadores de errores personalizados"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'bad_request',
            'message': str(error) or 'Solicitud incorrecta'
        }), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'not_found',
            'message': str(error) or 'Recurso no encontrado'
        }), 404
    
    @app.errorhandler(500)
    def server_error(error):
        logger.error(f"Error interno del servidor: {error}")
        return jsonify({
            'success': False,
            'error': 'server_error',
            'message': 'Error interno del servidor'
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.exception("Excepción no manejada:")
        return jsonify({
            'success': False,
            'error': 'exception',
            'message': str(error) or 'Excepción no manejada'
        }), 500

def register_routes(app):
    """Registra rutas básicas de la aplicación"""
    
    @app.route('/')
    def index():
        return jsonify({
            'name': 'Predictor de Fútbol Premium - API',
            'version': app.config.get('APP_CONFIG', {}).get('api', {}).get('version', 'v1'),
            'status': 'online',
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/api/health')
    def health_check():
        """Endpoint para verificar el estado de la API"""
        # Verificar conexión a base de datos
        db_status = check_database_connection(app)
        
        # Verificar estado del modelo
        model_status = check_model_status(app)
        
        # Verificar estado de cache
        cache_status = check_cache_status(app)
        
        # Calcular estado general
        overall_status = all([db_status['connected'], model_status['loaded'], cache_status['connected']])
        
        return jsonify({
            'status': 'healthy' if overall_status else 'degraded',
            'timestamp': datetime.now().isoformat(),
            'version': app.config.get('APP_CONFIG', {}).get('api', {}).get('version', 'v1'),
            'environment': os.environ.get('FLASK_ENV', 'development'),
            'components': {
                'database': db_status,
                'model': model_status,
                'cache': cache_status
            }
        })

def init_extensions(app):
    """Inicializa extensiones de Flask"""
    try:
        # Importar extensiones
        from app.extensions import db, migrate, cache
        
        # Inicializar SQLAlchemy
        app_config = app.config.get('APP_CONFIG', {})
        db_config = app_config.get('database', {})
        
        if db_config.get('type') == 'sqlite':
            db_path = db_config.get('path', 'data/predictor.db')
            app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
        elif db_config.get('type') == 'postgresql':
            host = db_config.get('host', 'localhost')
            port = db_config.get('port', 5432)
            name = db_config.get('name', 'predictor')
            user = db_config.get('user', 'predictor')
            password = db_config.get('password', '')
            
            app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{user}:{password}@{host}:{port}/{name}'
        else:
            # Default to SQLite in-memory
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        # Inicializar extensiones con la app
        db.init_app(app)
        migrate.init_app(app, db)
        
        # Configurar caché
        cache_config = app_config.get('cache', {})
        if cache_config.get('type') == 'redis':
            cache_host = cache_config.get('host', 'localhost')
            cache_port = cache_config.get('port', 6379)
            cache_password = cache_config.get('password', None)
            
            cache_config = {
                'CACHE_TYPE': 'redis',
                'CACHE_REDIS_HOST': cache_host,
                'CACHE_REDIS_PORT': cache_port,
                'CACHE_DEFAULT_TIMEOUT': cache_config.get('timeout', 300)
            }
            
            if cache_password:
                cache_config['CACHE_REDIS_PASSWORD'] = cache_password
        else:
            # Default to simple cache
            cache_config = {
                'CACHE_TYPE': 'SimpleCache',
                'CACHE_DEFAULT_TIMEOUT': cache_config.get('timeout', 300)
            }
        
        app.config.update(cache_config)
        cache.init_app(app)
        
        logger.info("Extensiones de Flask inicializadas")
    except Exception as e:
        logger.error(f"Error inicializando extensiones: {e}")

def check_database_connection(app):
    """Verifica la conexión a la base de datos"""
    try:
        from app.extensions import db
        
        with app.app_context():
            db.engine.execute('SELECT 1')
            
        return {
            'connected': True,
            'message': 'Conectado a la base de datos'
        }
    except Exception as e:
        logger.warning(f"Error verificando conexión a base de datos: {e}")
        return {
            'connected': False,
            'message': str(e)
        }

def check_model_status(app):
    """Verifica el estado del modelo predictivo"""
    try:
        from app.models.predictor import PredictorModel
        
        with app.app_context():
            model = PredictorModel()
            is_loaded = model.is_loaded()
            
            if is_loaded:
                return {
                    'loaded': True,
                    'type': model.get_model_type(),
                    'version': model.get_model_version(),
                    'features': len(model.get_feature_names())
                }
            else:
                return {
                    'loaded': False,
                    'message': 'Modelo no cargado, usando fallback',
                    'fallback_available': model.is_fallback_available()
                }
    except Exception as e:
        logger.warning(f"Error verificando estado del modelo: {e}")
        return {
            'loaded': False,
            'message': str(e)
        }

def check_cache_status(app):
    """Verifica el estado del caché"""
    try:
        from app.extensions import cache
        
        # Escribir valor de prueba
        test_key = 'health_check_test'
        test_value = datetime.now().isoformat()
        cache.set(test_key, test_value, timeout=10)
        
        # Leer valor
        retrieved = cache.get(test_key)
        
        return {
            'connected': retrieved == test_value,
            'type': app.config.get('CACHE_TYPE', 'unknown')
        }
    except Exception as e:
        logger.warning(f"Error verificando estado del caché: {e}")
        return {
            'connected': False,
            'message': str(e)
        }

if __name__ == '__main__':
    # Configuración básica para ejecución directa
    app = create_app({
        'debug': True,
        'testing': False,
        'host': '0.0.0.0',
        'port': 5000
    })
    
    app.run(host='0.0.0.0', port=5000, debug=True)
