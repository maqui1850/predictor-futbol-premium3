import os
import logging
import time
import json
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

# Configurar logging
logger = logging.getLogger('predictor_futbol_premium.auth')

# Cargar clave secreta desde variables de entorno o usar una por defecto en desarrollo
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'predictor_futbol_premium_secret_key_for_development')
API_KEYS = os.environ.get('API_KEYS', 'test_key').split(',')

def verify_api_key(f):
    """
    Decorador para verificar API key en solicitudes.
    
    Args:
        f: Función a decorar
        
    Returns:
        Function: Función decorada con verificación de API key
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Obtener API key del header
        api_key = request.headers.get('X-API-Key')
        
        # Si no hay API key en header, verificar en parámetros
        if not api_key:
            api_key = request.args.get('api_key')
        
        # Si no hay API key en parámetros, verificar en cuerpo JSON
        if not api_key and request.is_json:
            api_key = request.json.get('api_key')
        
        # Verificar si API key es válida
        if not api_key or api_key not in API_KEYS:
            logger.warning(f"Intento de acceso con API key inválida: {api_key}")
            return jsonify({
                'status': 'error',
                'message': 'API key inválida o no proporcionada',
                'timestamp': datetime.now().isoformat()
            }), 401
        
        # API key válida, continuar con la función
        return f(*args, **kwargs)
    
    return decorated_function

def create_jwt_token(user_id, username, expiration_hours=24):
    """
    Crea un token JWT para autenticación.
    
    Args:
        user_id (int): ID del usuario
        username (str): Nombre de usuario
        expiration_hours (int): Horas de validez del token
        
    Returns:
        str: Token JWT
    """
    # Crear header
    header = {
        'alg': 'HS256',
        'typ': 'JWT'
    }
    
    # Crear payload con datos del usuario y tiempos de emisión/expiración
    issued_at = datetime.now()
    expiration = issued_at + timedelta(hours=expiration_hours)
    
    payload = {
        'sub': str(user_id),
        'username': username,
        'iat': int(issued_at.timestamp()),
        'exp': int(expiration.timestamp())
    }
    
    # Codificar header y payload
    header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    # Crear signature
    signature_data = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(
        SECRET_KEY.encode(),
        signature_data.encode(),
        hashlib.sha256
    ).digest()
    
    # Codificar signature
    signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    # Construir token completo
    token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    
    return token

def verify_jwt_token(token):
    """
    Verifica un token JWT y devuelve la información del usuario si es válido.
    
    Args:
        token (str): Token JWT a verificar
        
    Returns:
        dict: Información del usuario si el token es válido, None en caso contrario
    """
    try:
        # Dividir token en sus componentes
        header_encoded, payload_encoded, signature_encoded = token.split('.')
        
        # Reconstruir signature
        signature_data = f"{header_encoded}.{payload_encoded}"
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            signature_data.encode(),
            hashlib.sha256
        ).digest()
        
        # Codificar signature esperada
        expected_signature_encoded = base64.urlsafe_b64encode(expected_signature).decode().rstrip('=')
        
        # Verificar signature
        if signature_encoded != expected_signature_encoded:
            logger.warning("Firma de token inválida")
            return None
        
        # Decodificar payload
        # Añadir padding si es necesario
        padding = 4 - (len(payload_encoded) % 4)
        if padding < 4:
            payload_encoded += '=' * padding
        
        payload = json.loads(base64.urlsafe_b64decode(payload_encoded))
        
        # Verificar expiración
        current_time = datetime.now().timestamp()
        if payload['exp'] < current_time:
            logger.warning("Token expirado")
            return None
        
        # Token válido, devolver información del usuario
        return {
            'user_id': payload['sub'],
            'username': payload['username'],
            'exp': payload['exp']
        }
        
    except Exception as e:
        logger.error(f"Error verificando token: {str(e)}")
        return None

def jwt_auth_required(f):
    """
    Decorador para verificar JWT en solicitudes.
    
    Args:
        f: Función a decorar
        
    Returns:
        Function: Función decorada con verificación de JWT
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Obtener token del header de autorización
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning("Intento de acceso sin token JWT")
            return jsonify({
                'status': 'error',
                'message': 'JWT no proporcionado',
                'timestamp': datetime.now().isoformat()
            }), 401
        
        # Extraer token
        token = auth_header.split(' ')[1]
        
        # Verificar token
        user_info = verify_jwt_token(token)
        if not user_info:
            logger.warning("Intento de acceso con token JWT inválido")
            return jsonify({
                'status': 'error',
                'message': 'Token JWT inválido o expirado',
                'timestamp': datetime.now().isoformat()
            }), 401
        
        # Añadir información del usuario al contexto de la solicitud
        request.user = user_info
        
        # Token válido, continuar con la función
        return f(*args, **kwargs)
    
    return decorated_function

def require_permission(permission):
    """
    Decorador para verificar permisos de usuario.
    
    Args:
        permission (str): Permiso requerido
        
    Returns:
        Function: Decorador para verificar permisos
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar que haya información de usuario
            if not hasattr(request, 'user'):
                logger.warning("Intento de acceso sin autenticación")
                return jsonify({
                    'status': 'error',
                    'message': 'Autenticación requerida',
                    'timestamp': datetime.now().isoformat()
                }), 401
            
            # Verificar permisos (se debería implementar lógica de permisos)
            # Por ahora, simplemente pasamos, asumiendo que todos los usuarios tienen todos los permisos
            # En una implementación real, se verificaría el permiso en una base de datos
            
            # Continuar con la función
            return f(*args, **kwargs)
        
        return decorated_function
    
    return decorator

def generate_api_key():
    """
    Genera una nueva API key aleatoria.
    
    Returns:
        str: API key generada
    """
    # Generar bytes aleatorios
    random_bytes = os.urandom(24)
    # Codificar en base64
    api_key = base64.urlsafe_b64encode(random_bytes).decode()
    # Añadir prefijo para identificar fácilmente
    return f"pfp_{api_key}"

# Ejemplo de función para agregar una nueva API key
def add_api_key(new_key=None):
    """
    Añade una nueva API key al conjunto de claves válidas.
    
    Args:
        new_key (str, opcional): Nueva API key. Si no se proporciona, se genera una.
        
    Returns:
        str: API key añadida
    """
    global API_KEYS
    
    # Generar nueva clave si no se proporciona
    if not new_key:
        new_key = generate_api_key()
    
    # Añadir a la lista de claves
    API_KEYS.append(new_key)
    
    # En una implementación real, se guardaría en base de datos o archivo de configuración
    
    logger.info(f"Nueva API key añadida: {new_key}")
    
    return new_key

# Ejemplo de uso
if __name__ == "__main__":
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    
    # Generar una API key de ejemplo
    api_key = generate_api_key()
    print(f"API key generada: {api_key}")
    
    # Generar token JWT de ejemplo
    jwt_token = create_jwt_token(1, "usuario_test")
    print(f"JWT token: {jwt_token}")
    
    # Verificar token
    user_info = verify_jwt_token(jwt_token)
    print(f"Información del usuario: {user_info}")
