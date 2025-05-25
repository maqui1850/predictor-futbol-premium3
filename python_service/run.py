#!/usr/bin/env python3
# python_service/run.py

import os
import sys
import argparse
import logging
import yaml
import json
from pathlib import Path

# Configurar logging básico
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger('predictor')

# Obtener directorio base
BASE_DIR = Path(__file__).resolve().parent

def load_config(env='development'):
    """Carga la configuración basada en el entorno"""
    try:
        config_path = BASE_DIR / 'config' / 'deployment.yaml'
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Obtener configuración para el entorno específico
        env_config = config['environments'][env]
        
        # Combinar con configuración común
        env_config.update({
            'model': config['model'],
            'api': config['api'],
            'logging': config['logging'],
            'monitoring': config['monitoring'],
            'deployment': config['deployment']
        })
        
        # Procesar variables de entorno en la configuración
        process_env_vars(env_config)
        
        return env_config
    except Exception as e:
        logger.error(f"Error cargando configuración: {e}")
        sys.exit(1)

def process_env_vars(config):
    """Procesa las variables de entorno en la configuración"""
    if isinstance(config, dict):
        for key, value in config.items():
            if isinstance(value, (dict, list)):
                process_env_vars(value)
            elif isinstance(value, str) and value.startswith('${') and value.endswith('}'):
                env_var = value[2:-1]
                config[key] = os.environ.get(env_var, f"<MISSING:{env_var}>")
    elif isinstance(config, list):
        for i, item in enumerate(config):
            if isinstance(item, (dict, list)):
                process_env_vars(item)

def setup_logging(config):
    """Configura el sistema de logging basado en la configuración"""
    try:
        logging_config = config.get('logging', {})
        
        # Crear directorio para logs si no existe
        log_file = None
        for handler in logging_config.get('handlers', {}).values():
            if 'filename' in handler:
                log_file = handler['filename']
                log_dir = os.path.dirname(log_file)
                os.makedirs(log_dir, exist_ok=True)
        
        # Configurar logging
        if logging_config:
            import logging.config
            logging.config.dictConfig(logging_config)
            logger.info("Logging configurado correctamente")
    except Exception as e:
        logger.error(f"Error configurando logging: {e}")

def create_app(config):
    """Crea y configura la aplicación Flask"""
    try:
        from app import create_app
        app = create_app(config)
        logger.info("Aplicación Flask creada correctamente")
        return app
    except Exception as e:
        logger.error(f"Error creando aplicación Flask: {e}")
        sys.exit(1)

def init_db(app, config):
    """Inicializa la base de datos"""
    try:
        with app.app_context():
            from app.models import db
            db.create_all()
            logger.info("Base de datos inicializada correctamente")
    except Exception as e:
        logger.error(f"Error inicializando base de datos: {e}")

def load_model(app, config):
    """Carga el modelo predictivo"""
    try:
        from app.models.predictor import PredictorModel
        
        with app.app_context():
            model = PredictorModel()
            model_loaded = model.load()
            
            if model_loaded:
                logger.info("Modelo predictivo cargado correctamente")
            else:
                logger.warning("No se encontró modelo pre-entrenado. Se usará el modo fallback.")
    except Exception as e:
        logger.error(f"Error cargando modelo predictivo: {e}")

def run_development_server(app, config):
    """Ejecuta el servidor de desarrollo Flask"""
    host = config.get('host', '0.0.0.0')
    port = config.get('port', 5000)
    debug = config.get('debug', False)
    
    logger.info(f"Iniciando servidor de desarrollo en http://{host}:{port}")
    app.run(host=host, port=port, debug=debug)

def run_production_server(app, config):
    """Ejecuta el servidor de producción con Gunicorn"""
    host = config.get('host', '0.0.0.0')
    port = config.get('port', 5000)
    workers = config.get('workers', 4)
    
    # Crear directorio para socket UNIX si es necesario
    socket_path = config.get('socket', None)
    if socket_path:
        socket_dir = os.path.dirname(socket_path)
        os.makedirs(socket_dir, exist_ok=True)
    
    # Comando para Gunicorn
    gunicorn_config = config.get('deployment', {}).get('gunicorn', {})
    worker_class = gunicorn_config.get('worker_class', 'sync')
    timeout = gunicorn_config.get('timeout', 120)
    
    # Configurar parámetros de Gunicorn
    from gunicorn.app.base import BaseApplication
    
    class GunicornApp(BaseApplication):
        def __init__(self, app, options=None):
            self.options = options or {}
            self.application = app
            super().__init__()
            
        def load_config(self):
            for key, value in self.options.items():
                if key in self.cfg.settings and value is not None:
                    self.cfg.set(key.lower(), value)
                    
        def load(self):
            return self.application
    
    options = {
        'bind': f"{host}:{port}",
        'workers': workers,
        'worker_class': worker_class,
        'timeout': timeout,
        'loglevel': 'info',
        'accesslog': '-',
        'errorlog': '-',
    }
    
    if socket_path:
        options['bind'] = f"unix:{socket_path}"
    
    logger.info(f"Iniciando servidor de producción con Gunicorn ({workers} workers)")
    GunicornApp(app, options).run()

def generate_openapi_spec(app, config):
    """Genera la especificación OpenAPI para la API"""
    try:
        from app.api import create_openapi_spec
        
        with app.app_context():
            spec = create_openapi_spec(app)
            
            # Guardar especificación
            spec_dir = BASE_DIR / 'docs'
            os.makedirs(spec_dir, exist_ok=True)
            
            spec_path = spec_dir / 'openapi.json'
            with open(spec_path, 'w') as f:
                json.dump(spec, f, indent=2)
                
            logger.info(f"Especificación OpenAPI generada en {spec_path}")
    except Exception as e:
        logger.error(f"Error generando especificación OpenAPI: {e}")

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Iniciar servicio de predicción de fútbol')
    parser.add_argument('--env', '-e', default='development', choices=['development', 'production'],
                      help='Entorno de ejecución (development o production)')
    parser.add_argument('--init-db', action='store_true', help='Inicializar base de datos')
    parser.add_argument('--generate-docs', action='store_true', help='Generar documentación OpenAPI')
    
    args = parser.parse_args()
    
    # Cargar configuración
    logger.info(f"Cargando configuración para entorno: {args.env}")
    config = load_config(args.env)
    
    # Configurar logging
    setup_logging(config)
    
    # Crear aplicación Flask
    app = create_app(config)
    
    # Inicializar base de datos si se solicita
    if args.init_db:
        init_db(app, config)
    
    # Cargar modelo predictivo
    load_model(app, config)
    
    # Generar documentación si se solicita
    if args.generate_docs:
        generate_openapi_spec(app, config)
    
    # Iniciar servidor según el entorno
    if args.env == 'development':
        run_development_server(app, config)
    else:
        run_production_server(app, config)

if __name__ == '__main__':
    main()
