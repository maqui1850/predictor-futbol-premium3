// backend/controllers/advancedPredictionController.js
const pythonClient = require('../services/pythonClient');
const apiService = require('../services/apiService');
const scrapingService = require('../services/scrapingService');
const dataProcessor = require('../utils/dataProcessor');

/**
 * Controlador para predicciones avanzadas utilizando el modelo de Python
 */
const advancedPredictionController = {
  /**
   * Obtiene una predicción avanzada para un partido
   */
  async predictMatch(req, res, next) {
    try {
      console.log('Solicitando predicción avanzada:', req.body);
      const { homeTeam, awayTeam, league, date, includeStats, fixtureId } = req.body;
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren los equipos local y visitante'
        });
      }
      
      // Objeto base para la predicción
      let matchData = {
        homeTeam: { name: homeTeam },
        awayTeam: { name: awayTeam },
        league: { name: league || 'Unknown' },
        date: date || new Date().toISOString().split('T')[0],
        fixtureId: fixtureId || null
      };
      
      // Si se solicitan estadísticas adicionales, las obtenemos
      if (includeStats) {
        try {
          await this.enrichMatchData(matchData);
        } catch (statsError) {
          console.warn('No se pudieron obtener estadísticas completas:', statsError.message);
        }
      }
      
      // Verificar la salud del servicio Python antes de realizar la petición
      const healthCheck = await pythonClient.checkHealth();
      
      if (healthCheck.status === 'online') {
        // Servicio Python disponible, obtener predicción avanzada
        const prediction = await pythonClient.getPrediction(matchData);
        
        // Preparar respuesta
        const result = {
          success: true,
          data: {
            ...prediction,
            fecha: matchData.date,
            liga: matchData.league.name,
            equipoLocal: homeTeam,
            equipoVisitante: awayTeam,
            analisis: {
              local: `${homeTeam} tiene una probabilidad del ${(prediction.homeWinProbability * 100).toFixed(1)}% de ganar este partido.`,
              visitante: `${awayTeam} tiene una probabilidad del ${(prediction.awayWinProbability * 100).toFixed(1)}% de ganar este partido.`,
              general: this.generateAnalysisSummary(prediction, homeTeam, awayTeam)
            },
            nivelesConfianza: {
              general: this.getConfidenceLabel(prediction.confidence),
              explicacion: this.getConfidenceExplanation(prediction.confidence)
            }
          },
          modelType: 'advanced',
          serviceStatus: healthCheck.status,
          serviceResponseTime: healthCheck.responseTime
        };
        
        return res.json(result);
      } else {
        // Servicio Python no disponible, usar modelo simple como respaldo
        console.warn('Servicio de predicción avanzada no disponible. Usando modelo simple.');
        
        // Usar controlador de predicción simple
        const simplePredictionModel = require('../models/simplePredictionModel');
        const prediction = simplePredictionModel.predict(homeTeam, awayTeam);
        
        return res.json({
          success: true,
          data: {
            ...prediction,
            fecha: matchData.date,
            liga: matchData.league.name,
            analisis: {
              local: `${homeTeam} tiene una probabilidad del ${(prediction.victoria_local * 100).toFixed(1)}% de ganar este partido.`,
              visitante: `${awayTeam} tiene una probabilidad del ${(prediction.victoria_visitante * 100).toFixed(1)}% de ganar este partido.`,
              general: `Este es un partido bastante ${prediction.victoria_local > 0.6 ? 'desigual a favor del local' : 
                                (prediction.victoria_visitante > 0.6 ? 'desigual a favor del visitante' : 
                                'equilibrado')}.`
            }
          },
          modelType: 'simple',
          serviceStatus: 'offline',
          fallbackReason: healthCheck.error || 'Servicio no disponible'
        });
      }
    } catch (error) {
      console.error('Error en predicción avanzada:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar la predicción avanzada',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  },
  
  /**
   * Obtiene métricas avanzadas de un equipo
   */
  async getTeamMetrics(req, res, next) {
    try {
      const { teamId, teamName } = req.params;
      
      if (!teamId && !teamName) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el ID o nombre del equipo'
        });
      }
      
      // Verificar la salud del servicio Python
      const healthCheck = await pythonClient.checkHealth();
      
      if (healthCheck.status === 'online') {
        let metrics;
        
        if (teamId) {
          metrics = await pythonClient.getTeamMetrics(teamId);
        } else {
          // Si solo tenemos el nombre, intentamos buscar primero el ID
          // usando la API de fútbol
          try {
            const teamsResponse = await apiService.getTeams(null);
            const teams = dataProcessor.normalizeTeams(teamsResponse.response);
            
            const team = teams.find(t => 
              t.name.toLowerCase() === teamName.toLowerCase()
            );
            
            if (team) {
              metrics = await pythonClient.getTeamMetrics(team.id);
            } else {
              throw new Error(`Equipo '${teamName}' no encontrado`);
            }
          } catch (apiError) {
            console.error('Error buscando equipo:', apiError);
            throw new Error(`No se pudo encontrar el equipo: ${apiError.message}`);
          }
        }
        
        return res.json({
          success: true,
          data: metrics,
          serviceStatus: healthCheck.status
        });
      } else {
        // Servicio no disponible
        return res.status(503).json({
          success: false,
          message: 'Servicio de métricas avanzadas no disponible',
          serviceStatus: 'offline',
          error: healthCheck.error
        });
      }
    } catch (error) {
      console.error('Error obteniendo métricas del equipo:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener métricas del equipo',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  },
  
  /**
   * Obtiene métricas de Head-to-Head entre dos equipos
   */
  async getH2HMetrics(req, res, next) {
    try {
      const { team1Id, team2Id } = req.params;
      
      if (!team1Id || !team2Id) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren los IDs de ambos equipos'
        });
      }
      
      // Verificar la salud del servicio Python
      const healthCheck = await pythonClient.checkHealth();
      
      if (healthCheck.status === 'online') {
        const metrics = await pythonClient.getHeadToHeadMetrics(team1Id, team2Id);
        
        return res.json({
          success: true,
          data: metrics,
          serviceStatus: healthCheck.status
        });
      } else {
        // Servicio no disponible
        return res.status(503).json({
          success: false,
          message: 'Servicio de métricas H2H no disponible',
          serviceStatus: 'offline',
          error: healthCheck.error
        });
      }
    } catch (error) {
      console.error('Error obteniendo métricas H2H:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener métricas H2H',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  },
  
  /**
   * Obtiene el estado del servicio Python
   */
  async getServiceStatus(req, res, next) {
    try {
      const healthCheck = await pythonClient.checkHealth();
      const metrics = pythonClient.getMetrics();
      
      return res.json({
        success: true,
        status: healthCheck.status,
        responseTime: healthCheck.responseTime,
        details: healthCheck.response,
        metrics
      });
    } catch (error) {
      console.error('Error verificando estado del servicio:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar estado del servicio',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  },
  
  /**
   * Enriquece los datos del partido con estadísticas adicionales
   * @param {object} matchData - Datos del partido a enriquecer
   */
  async enrichMatchData(matchData) {
    // Obtener IDs de equipos si no los tenemos
    if (!matchData.homeTeam.id || !matchData.awayTeam.id) {
      try {
        const teamsResponse = await apiService.getTeams(matchData.league.id);
        const teams = dataProcessor.normalizeTeams(teamsResponse.response);
        
        if (!matchData.homeTeam.id) {
          const homeTeam = teams.find(t => 
            t.name.toLowerCase() === matchData.homeTeam.name.toLowerCase()
          );
          if (homeTeam) {
            matchData.homeTeam.id = homeTeam.id;
          }
        }
        
        if (!matchData.awayTeam.id) {
          const awayTeam = teams.find(t => 
            t.name.toLowerCase() === matchData.awayTeam.name.toLowerCase()
          );
          if (awayTeam) {
            matchData.awayTeam.id = awayTeam.id;
          }
        }
      } catch (error) {
        console.warn('No se pudieron obtener IDs de equipos:', error.message);
      }
    }
    
    // Obtener estadísticas de equipos
    const promises = [];
    
    if (matchData.homeTeam.id) {
      promises.push(
        apiService.getTeamStatistics(matchData.homeTeam.id, matchData.league.id)
          .then(stats => {
            matchData.homeTeamStats = dataProcessor.normalizeTeamStats(stats);
          })
          .catch(error => {
            console.warn(`No se pudieron obtener estadísticas para ${matchData.homeTeam.name}:`, error.message);
          })
      );
    }
    
    if (matchData.awayTeam.id) {
      promises.push(
        apiService.getTeamStatistics(matchData.awayTeam.id, matchData.league.id)
          .then(stats => {
            matchData.awayTeamStats = dataProcessor.normalizeTeamStats(stats);
          })
          .catch(error => {
            console.warn(`No se pudieron obtener estadísticas para ${matchData.awayTeam.name}:`, error.message);
          })
      );
    }
    
    // Obtener historial H2H si tenemos ambos IDs
    if (matchData.homeTeam.id && matchData.awayTeam.id) {
      promises.push(
        apiService.getH2H(matchData.homeTeam.id, matchData.awayTeam.id)
          .then(h2hData => {
            if (h2hData && h2hData.response) {
              matchData.h2h = h2hData.response;
            }
          })
          .catch(error => {
            console.warn('No se pudo obtener historial H2H:', error.message);
          })
      );
    }
    
    // Esperar a que todas las promesas se resuelvan
    await Promise.allSettled(promises);
    
    return matchData;
  },
  
  /**
   * Genera un resumen de análisis basado en la predicción
   * @param {object} prediction - Predicción generada
   * @param {string} homeTeam - Nombre del equipo local
   * @param {string} awayTeam - Nombre del equipo visitante
   * @returns {string} - Resumen de análisis
   */
  generateAnalysisSummary(prediction, homeTeam, awayTeam) {
    const homeProb = prediction.homeWinProbability;
    const drawProb = prediction.drawProbability;
    const awayProb = prediction.awayWinProbability;
    const bttsProb = prediction.markets?.btts?.yes || 0;
    const over25Prob = prediction.markets?.overUnder?.over2_5 || 0;
    const expectedGoalsTotal = prediction.expectedGoals.home + prediction.expectedGoals.away;
    
    // Determinar el favorito
    let favoriteText = '';
    if (homeProb > awayProb + 0.2) {
      favoriteText = `${homeTeam} parte como claro favorito con un ${(homeProb * 100).toFixed(1)}% de probabilidades de victoria.`;
    } else if (awayProb > homeProb + 0.2) {
      favoriteText = `${awayTeam} parte como favorito a pesar de jugar fuera de casa, con un ${(awayProb * 100).toFixed(1)}% de probabilidades de victoria.`;
    } else {
      favoriteText = `El partido se presenta muy equilibrado, con un ${(drawProb * 100).toFixed(1)}% de probabilidades de empate.`;
    }
    
    // Análisis de goles
    let goalsText = '';
    if (expectedGoalsTotal > 3) {
      goalsText = `Se espera un partido con muchos goles (${expectedGoalsTotal.toFixed(1)} goles esperados en total).`;
    } else if (expectedGoalsTotal < 2) {
      goalsText = `Se anticipa un partido con pocos goles (${expectedGoalsTotal.toFixed(1)} goles esperados en total).`;
    } else {
      goalsText = `La predicción indica un promedio de ${expectedGoalsTotal.toFixed(1)} goles en este encuentro.`;
    }
    
    // Análisis de mercados
    let marketsText = '';
    if (bttsProb > 0.65) {
      marketsText = `Hay una alta probabilidad (${(bttsProb * 100).toFixed(1)}%) de que ambos equipos marquen.`;
    } else if (bttsProb < 0.4) {
      marketsText = `Es probable que al menos uno de los equipos mantenga su portería a cero.`;
    }
    
    if (over25Prob > 0.6) {
      marketsText += ` El mercado Over 2.5 goles presenta buenas opciones con un ${(over25Prob * 100).toFixed(1)}% de probabilidad.`;
    } else if (over25Prob < 0.4) {
      marketsText += ` El Under 2.5 goles parece una opción sólida para este encuentro.`;
    }
    
    // Juntar todos los análisis
    return `${favoriteText} ${goalsText} ${marketsText}`.trim();
  },
  
  /**
   * Obtiene la etiqueta de confianza basada en el valor numérico
   * @param {number} confidence - Valor de confianza (0-10)
   * @returns {string} - Etiqueta de confianza
   */
  getConfidenceLabel(confidence) {
    if (confidence >= 8) return "Muy Alta";
    if (confidence >= 6) return "Alta";
    if (confidence >= 4) return "Media";
    if (confidence >= 2) return "Baja";
    return "Muy Baja";
  },
  
  /**
   * Genera una explicación para el nivel de confianza
   * @param {number} confidence - Valor de confianza (0-10)
   * @returns {string} - Explicación
   */
  getConfidenceExplanation(confidence) {
    if (confidence >= 8) {
      return "Predicción basada en un patrón estadístico muy consistente y datos de alta calidad.";
    } else if (confidence >= 6) {
      return "Predicción respaldada por tendencias claras y suficientes datos históricos.";
    } else if (confidence >= 4) {
      return "Predicción basada en datos suficientes, pero con algunas variables inciertas.";
    } else if (confidence >= 2) {
      return "Predicción con limitaciones por falta de datos o inconsistencias en los patrones.";
    } else {
      return "Predicción de baja fiabilidad debido a escasez de datos o alta volatilidad.";
    }
  }