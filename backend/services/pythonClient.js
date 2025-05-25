// backend/services/pythonClient.js
const axios = require('axios');
const cache = require('../utils/cache');

/**
 * Cliente para comunicarse con el servicio Python
 * Proporciona métodos para llamar a los endpoints del modelo predictivo avanzado
 */
class PythonClient {
  constructor() {
    // URL base del servicio Python desde variables de entorno
    this.baseUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
    
    // Tiempo de caché por defecto (30 minutos)
    this.defaultCacheTime = 30 * 60;
    
    // Configuración por defecto para axios
    this.axiosConfig = {
      timeout: 10000, // 10 segundos
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Inicializar métricas
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0
    };
  }
  
  /**
   * Verifica si el servicio Python está activo
   * @returns {Promise<object>} Estado del servicio
   */
  async checkHealth() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/health`, this.axiosConfig);
      const endTime = Date.now();
      
      this.updateMetrics(true, endTime - startTime);
      
      return {
        status: 'online',
        response: response.data,
        responseTime: endTime - startTime
      };
    } catch (error) {
      this.updateMetrics(false);
      
      return {
        status: 'offline',
        error: error.message
      };
    }
  }
  
  /**
   * Obtiene una predicción avanzada para un partido
   * @param {object} matchData - Datos del partido
   * @param {boolean} useCache - Si se debe usar caché (true por defecto)
   * @returns {Promise<object>} Predicción generada
   */
  async getPrediction(matchData, useCache = true) {
    // Generar una clave de caché única basada en los datos del partido
    const cacheKey = `python_prediction:${JSON.stringify(matchData)}`;
    
    // Verificar caché si está habilitado
    if (useCache) {
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        this.metrics.cacheHits++;
        console.log(`[PythonClient] Usando predicción en caché para: ${cacheKey.substring(0, 50)}...`);
        return {
          ...cachedResult,
          source: 'cache'
        };
      } else {
        this.metrics.cacheMisses++;
      }
    }
    
    try {
      const startTime = Date.now();
      
      // Transformar datos según lo esperado por el servicio Python
      const transformedData = this.transformMatchData(matchData);
      
      // Realizar la solicitud al servicio Python
      const response = await axios.post(
        `${this.baseUrl}/api/predict`,
        transformedData,
        this.axiosConfig
      );
      
      const endTime = Date.now();
      this.updateMetrics(true, endTime - startTime);
      
      // Procesar y normalizar la respuesta
      const prediction = this.processResponse(response.data);
      
      // Guardar en caché si está habilitado
      if (useCache) {
        cache.set(cacheKey, prediction, this.defaultCacheTime);
      }
      
      return {
        ...prediction,
        responseTime: endTime - startTime,
        source: 'python_api'
      };
    } catch (error) {
      this.updateMetrics(false);
      console.error('[PythonClient] Error obteniendo predicción:', error.message);
      
      // Si hay un error, intentar usar el modelo de respaldo
      return this.getFallbackPrediction(matchData);
    }
  }
  
  /**
   * Obtiene métricas específicas para un equipo
   * @param {string} teamId - ID del equipo
   * @param {boolean} useCache - Si se debe usar caché (true por defecto)
   * @returns {Promise<object>} Métricas del equipo
   */
  async getTeamMetrics(teamId, useCache = true) {
    const cacheKey = `python_team_metrics:${teamId}`;
    
    if (useCache) {
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        this.metrics.cacheHits++;
        return {
          ...cachedResult,
          source: 'cache'
        };
      } else {
        this.metrics.cacheMisses++;
      }
    }
    
    try {
      const startTime = Date.now();
      
      const response = await axios.get(
        `${this.baseUrl}/api/team/${teamId}/metrics`,
        this.axiosConfig
      );
      
      const endTime = Date.now();
      this.updateMetrics(true, endTime - startTime);
      
      const teamMetrics = response.data;
      
      if (useCache) {
        cache.set(cacheKey, teamMetrics, this.defaultCacheTime);
      }
      
      return {
        ...teamMetrics,
        responseTime: endTime - startTime,
        source: 'python_api'
      };
    } catch (error) {
      this.updateMetrics(false);
      console.error('[PythonClient] Error obteniendo métricas del equipo:', error.message);
      throw error;
    }
  }
  
  /**
   * Obtiene métricas de Head-to-Head entre dos equipos
   * @param {string} team1Id - ID del primer equipo
   * @param {string} team2Id - ID del segundo equipo
   * @param {boolean} useCache - Si se debe usar caché (true por defecto)
   * @returns {Promise<object>} Métricas H2H
   */
  async getHeadToHeadMetrics(team1Id, team2Id, useCache = true) {
    // Ordenar IDs para asegurar consistencia en la clave de caché
    const teams = [team1Id, team2Id].sort().join('_');
    const cacheKey = `python_h2h_metrics:${teams}`;
    
    if (useCache) {
      const cachedResult = cache.get(cacheKey);
      if (cachedResult) {
        this.metrics.cacheHits++;
        return {
          ...cachedResult,
          source: 'cache'
        };
      } else {
        this.metrics.cacheMisses++;
      }
    }
    
    try {
      const startTime = Date.now();
      
      const response = await axios.get(
        `${this.baseUrl}/api/h2h/${team1Id}/${team2Id}/metrics`,
        this.axiosConfig
      );
      
      const endTime = Date.now();
      this.updateMetrics(true, endTime - startTime);
      
      const h2hMetrics = response.data;
      
      if (useCache) {
        cache.set(cacheKey, h2hMetrics, this.defaultCacheTime);
      }
      
      return {
        ...h2hMetrics,
        responseTime: endTime - startTime,
        source: 'python_api'
      };
    } catch (error) {
      this.updateMetrics(false);
      console.error('[PythonClient] Error obteniendo métricas H2H:', error.message);
      throw error;
    }
  }
  
  /**
   * Entrena el modelo con nuevos datos
   * @param {object} trainingData - Datos para entrenamiento
   * @returns {Promise<object>} Resultado del entrenamiento
   */
  async trainModel(trainingData) {
    try {
      const startTime = Date.now();
      
      const response = await axios.post(
        `${this.baseUrl}/api/model/train`,
        trainingData,
        this.axiosConfig
      );
      
      const endTime = Date.now();
      this.updateMetrics(true, endTime - startTime);
      
      return {
        ...response.data,
        responseTime: endTime - startTime
      };
    } catch (error) {
      this.updateMetrics(false);
      console.error('[PythonClient] Error entrenando modelo:', error.message);
      throw error;
    }
  }
  
  /**
   * Actualiza las métricas de uso
   * @param {boolean} success - Si la solicitud fue exitosa
   * @param {number} responseTime - Tiempo de respuesta en ms
   */
  updateMetrics(success, responseTime = 0) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      
      // Actualizar tiempo promedio de respuesta
      const prevAvg = this.metrics.averageResponseTime;
      const prevCount = this.metrics.successfulRequests - 1;
      
      if (prevCount > 0) {
        this.metrics.averageResponseTime = 
          (prevAvg * prevCount + responseTime) / this.metrics.successfulRequests;
      } else {
        this.metrics.averageResponseTime = responseTime;
      }
    } else {
      this.metrics.failedRequests++;
    }
  }
  
  /**
   * Obtiene las métricas de uso
   * @returns {object} Métricas actuales
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
  
  /**
   * Transforma los datos del partido al formato esperado por el servicio Python
   * @param {object} matchData - Datos del partido en formato de Node.js
   * @returns {object} Datos transformados
   */
  transformMatchData(matchData) {
    // Formato esperado por el servicio Python
    return {
      match_id: matchData.fixtureId || matchData.id || null,
      home_team: {
        id: matchData.homeTeam?.id || null,
        name: matchData.homeTeam?.name || matchData.equipoLocal || '',
        stats: matchData.homeTeamStats || null
      },
      away_team: {
        id: matchData.awayTeam?.id || null,
        name: matchData.awayTeam?.name || matchData.equipoVisitante || '',
        stats: matchData.awayTeamStats || null
      },
      league: {
        id: matchData.league?.id || null,
        name: matchData.league?.name || matchData.liga || '',
        country: matchData.league?.country || ''
      },
      match_date: matchData.date || matchData.fecha || new Date().toISOString().split('T')[0],
      venue: matchData.venue || null,
      additional_data: matchData.additionalData || {},
      // Añadir datos de clima si existen
      weather: matchData.weather || null
    };
  }
  
  /**
   * Procesa y normaliza la respuesta del servicio Python
   * @param {object} responseData - Datos de respuesta
   * @returns {object} Datos procesados
   */
  processResponse(responseData) {
    // Comprobar si es el formato esperado
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Formato de respuesta inválido del servicio Python');
    }
    
    // Normalizar respuesta
    const prediction = responseData.prediction || responseData;
    
    // Estructurar respuesta
    return {
      homeWinProbability: prediction.home_win_probability || prediction.victoria_local || 0,
      drawProbability: prediction.draw_probability || prediction.empate || 0,
      awayWinProbability: prediction.away_win_probability || prediction.victoria_visitante || 0,
      
      // Datos de goles esperados
      expectedGoals: {
        home: prediction.expected_goals?.home || prediction.goles_esperados_local || 0,
        away: prediction.expected_goals?.away || prediction.goles_esperados_visitante || 0,
        total: prediction.expected_goals?.total || null
      },
      
      // Mercados adicionales
      markets: {
        btts: prediction.markets?.btts || {
          yes: prediction.mercados_adicionales?.ambos_equipos_marcan || 0,
          no: prediction.mercados_adicionales?.ambos_equipos_marcan 
            ? 1 - prediction.mercados_adicionales.ambos_equipos_marcan 
            : 0
        },
        overUnder: prediction.markets?.over_under || {
          over2_5: prediction.mercados_adicionales?.mas_2_5_goles || 0,
          under2_5: prediction.mercados_adicionales?.mas_2_5_goles 
            ? 1 - prediction.mercados_adicionales.mas_2_5_goles
            : 0
        },
        handicap: prediction.markets?.handicap || {
          line: prediction.mercados_adicionales?.handicap_local || 0,
          probability: prediction.mercados_adicionales?.prob_handicap_local || 0
        }
      },
      
      // Nivel de confianza (1-10)
      confidence: prediction.confidence || 
        (prediction.confianza === "alta" ? 8 : 
         prediction.confianza === "media" ? 5 : 
         prediction.confianza === "baja" ? 3 : 5),
      
      // Recomendación
      recommendation: prediction.recommendation || null,
      
      // Datos adicionales
      additionalData: prediction.additional_data || {}
    };
  }
  
  /**
   * Proporciona una predicción de respaldo en caso de error
   * @param {object} matchData - Datos del partido
   * @returns {object} Predicción de respaldo
   */
  getFallbackPrediction(matchData) {
    console.warn('[PythonClient] Usando modelo de respaldo para predicción');
    
    // Importar modelo de respaldo
    const simplePredictionModel = require('../models/simplePredictionModel');
    
    // Obtener equipos
    const homeTeam = matchData.homeTeam?.name || matchData.equipoLocal || '';
    const awayTeam = matchData.awayTeam?.name || matchData.equipoVisitante || '';
    
    // Usar modelo simple
    const simplePrediction = simplePredictionModel.predict(homeTeam, awayTeam);
    
    // Transformar al formato estándar
    return {
      ...this.processResponse(simplePrediction),
      source: 'fallback_model',
      isFallback: true
    };
  }
}

module.exports = new PythonClient();
