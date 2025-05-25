// backend/middleware/pythonIntegration.js

const pythonClient = require('../services/pythonClient');

/**
 * Middleware para integrar el servicio Python con la aplicación Node.js
 */
const pythonIntegration = {
  /**
   * Intercepta las solicitudes para enviarlas al modelo Python
   * cuando sea apropiado
   */
  routeToAdvancedModel: (req, res, next) => {
    // Si el cliente explícitamente solicita el modelo simple
    if (req.query.model === 'simple' || req.headers['x-model'] === 'simple') {
      return next();
    }

    // Comprobar estado del servicio Python
    pythonClient.checkHealth()
      .then(healthCheck => {
        if (healthCheck.status === 'online') {
          // El servicio Python está disponible, procesar con modelo avanzado
          req.useAdvancedModel = true;
        } else {
          // El servicio Python no está disponible, seguir con el modelo simple
          req.useAdvancedModel = false;
          console.warn(`Servicio Python no disponible: ${healthCheck.error || 'Error desconocido'}`);
        }
        next();
      })
      .catch(error => {
        // Error verificando estado, seguir con el modelo simple
        req.useAdvancedModel = false;
        console.error('Error verificando estado del servicio Python:', error);
        next();
      });
  },

  /**
   * Middleware para enriquecer respuestas con datos del modelo avanzado
   * cuando estén disponibles
   */
  enrichWithAdvancedData: async (req, res, next) => {
    // Solo procesar si tenemos datos básicos
    if (!req.predictionData || !req.useAdvancedModel) {
      return next();
    }

    try {
      // Obtener datos originales de la predicción
      const { homeTeam, awayTeam, league, date } = req.predictionData;
      
      // Preparar datos para el servicio Python
      const pythonData = {
        homeTeam: { name: homeTeam },
        awayTeam: { name: awayTeam },
        league: { name: league },
        date: date
      };
      
      // Solicitar métricas avanzadas
      const advancedData = await pythonClient.getPrediction(pythonData);
      
      // Añadir datos avanzados a la respuesta
      req.advancedData = advancedData;
      
      // Continuar con el siguiente middleware
      next();
    } catch (error) {
      console.error('Error obteniendo datos avanzados:', error);
      
      // No bloquear el flujo, continuar sin datos avanzados
      next();
    }
  },

  /**
   * Middleware para combinar resultados de ambos modelos
   * cuando estén disponibles
   */
  combineResults: (req, res, next) => {
    // Si no tenemos datos avanzados, seguir sin cambios
    if (!req.advancedData) {
      return next();
    }
    
    // Si originalmente tenemos una respuesta en formato JSON
    const originalSend = res.json;
    
    res.json = function(data) {
      // Solo modificar si son datos de predicción
      if (data && data.success && data.data) {
        // Combinar datos básicos con avanzados
        const combinedData = {
          ...data,
          advancedData: req.advancedData,
          modelType: 'hybrid'
        };
        
        // Enviar respuesta combinada
        return originalSend.call(this, combinedData);
      }
      
      // Para otras respuestas, comportamiento normal
      return originalSend.call(this, data);
    };
    
    next();
  },

  /**
   * Middleware para verificar autorización de acceso al servicio Python
   */
  verifyPythonAccess: (req, res, next) => {
    // Verificar si el usuario tiene permisos para usar el modelo avanzado
    // Esto puede basarse en autenticación, suscripciones, etc.
    
    // Por ahora, simplemente permitir el acceso
    req.canAccessAdvancedModel = true;
    
    next();
  },

  /**
   * Middleware para guardar métricas de uso
   */
  trackUsage: (req, res, next) => {
    // Capturar datos originales
    const originalSend = res.send;
    
    // Tiempo de inicio
    req.requestStartTime = Date.now();
    
    res.send = function(body) {
      // Calcular tiempo de respuesta
      const responseTime = Date.now() - req.requestStartTime;
      
      // Registrar uso (solo para modelos avanzados)
      if (req.useAdvancedModel) {
        // Aquí se podría implementar un sistema de métricas
        console.log(`[Métricas] Solicitud procesada con modelo avanzado en ${responseTime}ms`);
        
        // También se podría guardar en base de datos o enviar a un servicio de telemetría
      }
      
      // Comportamiento normal
      return originalSend.call(this, body);
    };
    
    next();
  }
};

module.exports = pythonIntegration;