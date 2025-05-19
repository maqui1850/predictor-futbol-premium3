// backend/controllers/predictionController.js
const apiService = require('../services/apiService');
const scrapingService = require('../services/scrapingService');
const analysisService = require('../services/analysisService');
const dataProcessor = require('../utils/dataProcessor');
const cache = require('../utils/cache');

/**
 * Controlador para la generación y gestión de predicciones
 */
const predictionController = {
  /**
   * Genera una predicción completa para un partido
   * @param {object} req - Solicitud HTTP
   * @param {object} res - Respuesta HTTP
   */
  async generatePrediction(req, res) {
    try {
      const { fixtureId, homeTeamId, awayTeamId, leagueId, date } = req.body;
      
      if (!fixtureId && (!homeTeamId || !awayTeamId)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere fixtureId o ambos homeTeamId y awayTeamId'
        });
      }
      
      // Verificar caché
      const cacheKey = `prediction:${fixtureId || `${homeTeamId}_${awayTeamId}`}`;
      const cachedPrediction = cache.get(cacheKey);
      
      if (cachedPrediction) {
        return res.json({
          success: true,
          prediction: cachedPrediction,
          source: 'cache'
        });
      }
      
      // Obtener datos del partido
      const matchData = await this.getMatchData(fixtureId, homeTeamId, awayTeamId, leagueId, date);
      
      if (!matchData) {
        return res.status(404).json({
          success: false,
          message: 'No se pudo encontrar información del partido'
        });
      }
      
      // Generar predicción
      const prediction = await analysisService.generatePrediction(matchData);
      
      return res.json({
        success: true,
        prediction,
        source: 'api'
      });
      
    } catch (error) {
      console.error('Error generando predicción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generando predicción',
        error: error.message
      });
    }
  },
  
  /**
   * Obtiene todos los datos necesarios para un partido
   * @param {number} fixtureId - ID del partido
   * @param {number} homeTeamId - ID del equipo local
   * @param {number} awayTeamId - ID del equipo visitante
   * @param {number} leagueId - ID de la liga
   * @param {string} date - Fecha del partido
   * @returns {object} - Datos del partido y equipos
   */
  async getMatchData(fixtureId, homeTeamId, awayTeamId, leagueId, date) {
    try {
      let fixture = null;
      let homeTeam = null;
      let awayTeam = null;
      let h2h = [];
      
      // Si tenemos fixtureId, obtenemos datos del partido
      if (fixtureId) {
        const fixtureResponse = await apiService.fetchFixtureById(fixtureId);
        if (fixtureResponse && fixtureResponse.length > 0) {
          fixture = fixtureResponse[0];
          homeTeamId = fixture.teams.home.id;
          awayTeamId = fixture.teams.away.id;
        }
      } 
      // Si no tenemos datos de partido pero sí IDs de equipos
      else if (homeTeamId && awayTeamId) {
        // Crear un objeto fixture básico
        fixture = {
          fixture: {
            id: `manual_${homeTeamId}_${awayTeamId}`,
            date: date || new Date().toISOString(),
            timestamp: Math.floor(Date.now() / 1000),
            venue: { name: 'Por determinar' },
            status: { short: 'NS', long: 'Not Started' }
          },
          league: { 
            id: leagueId || 0,
            name: 'Liga no especificada',
            country: 'No especificado',
            logo: null
          },
          teams: {
            home: { id: homeTeamId, name: '', logo: null },
            away: { id: awayTeamId, name: '', logo: null }
          },
          goals: { home: null, away: null }
        };
      } else {
        throw new Error('Datos insuficientes para obtener información del partido');
      }
      
      // Obtener detalles de equipos
      const [homeTeamDetails, awayTeamDetails] = await Promise.all([
        apiService.fetchTeamDetails(homeTeamId),
        apiService.fetchTeamDetails(awayTeamId)
      ]);
      
      homeTeam = homeTeamDetails;
      awayTeam = awayTeamDetails;
      
      // Completar información faltante del partido
      if (fixture.teams.home.name === '' && homeTeam) {
        fixture.teams.home.name = homeTeam.team.name;
        fixture.teams.home.logo = homeTeam.team.logo;
      }
      
      if (fixture.teams.away.name === '' && awayTeam) {
        fixture.teams.away.name = awayTeam.team.name;
        fixture.teams.away.logo = awayTeam.team.logo;
      }
      
      // Obtener historial head-to-head
      const h2hResponse = await apiService.fetchHeadToHead(homeTeamId, awayTeamId);
      h2h = h2hResponse || [];
      
      // Obtener estadísticas adicionales mediante scraping si está configurado
      let additionalStats = { home: {}, away: {} };
      
      try {
        // Intentar obtener datos de FBref
        const [homeFBref, awayFBref] = await Promise.all([
          scrapingService.getFBrefTeamStats(fixture.teams.home.name),
          scrapingService.getFBrefTeamStats(fixture.teams.away.name)
        ]);
        
        additionalStats.home.fbref = homeFBref;
        additionalStats.away.fbref = awayFBref;
        
        // Intentar obtener datos de Understat
        const [homeUnderstat, awayUnderstat] = await Promise.all([
          scrapingService.getUnderstatTeamStats(fixture.teams.home.name),
          scrapingService.getUnderstatTeamStats(fixture.teams.away.name)
        ]);
        
        additionalStats.home.understat = homeUnderstat;
        additionalStats.away.understat = awayUnderstat;
      } catch (error) {
        console.warn('Error obteniendo datos adicionales por scraping:', error.message);
      }
      
      // Normalizar y combinar todo
      const homeTeamStats = homeTeam ? 
        dataProcessor.normalizeTeamStats(homeTeam.statistics) : {};
      
      const awayTeamStats = awayTeam ? 
        dataProcessor.normalizeTeamStats(awayTeam.statistics) : {};
      
      // Incorporar datos de scraping a las estadísticas
      if (additionalStats.home.fbref) {
        this.mergeScrapedStats(homeTeamStats, additionalStats.home);
      }
      
      if (additionalStats.away.fbref) {
        this.mergeScrapedStats(awayTeamStats, additionalStats.away);
      }
      
      // Obtener estadísticas generales de la liga si tenemos el ID
      let leagueStats = {};
      if (leagueId) {
        // Aquí podríamos obtener estadísticas de la liga
        // (promedio de goles, tarjetas, etc.)
      }
      
      return {
        fixture,
        homeTeam: fixture.teams.home,
        awayTeam: fixture.teams.away,
        homeTeamStats,
        awayTeamStats,
        h2h,
        leagueStats
      };
      
    } catch (error) {
      console.error('Error obteniendo datos del partido:', error);
      throw error;
    }
  },
  
  /**
   * Combina estadísticas de API con datos de scraping
   * @param {object} apiStats - Estadísticas normalizadas de API
   * @param {object} scrapedStats - Estadísticas de scraping
   */
  mergeScrapedStats(apiStats, scrapedStats) {
    // Solo procesamos si hay datos que combinar
    if (!apiStats || !scrapedStats) return;
    
    // Combinar datos de FBref
    if (scrapedStats.fbref) {
      const fbref = scrapedStats.fbref;
      
      // Usar portería a cero si no tenemos el dato
      if (!apiStats.cleanSheets && fbref.overallStats && fbref.overallStats.cleanSheets) {
        apiStats.cleanSheets = fbref.overallStats.cleanSheets;
      }
      
      // Incorporar datos de córners si no los tenemos
      if (!apiStats.corners && fbref.overallStats && fbref.overallStats.cornersPerGame) {
        apiStats.corners = {
          for: {
            total: fbref.overallStats.cornersPerGame * apiStats.matches,
            average: fbref.overallStats.cornersPerGame
          },
          against: { total: 0, average: 0 } // No suele estar disponible
        };
      }
      
      // Incorporar datos de tarjetas si no los tenemos
      if (!apiStats.cards && fbref.overallStats) {
        apiStats.cards = {
          yellow: fbref.overallStats.yellowCards || 0,
          red: fbref.overallStats.redCards || 0
        };
      }
    }
    
    // Combinar datos de Understat
    if (scrapedStats.understat) {
      const understat = scrapedStats.understat;
      
      // Añadir xG y xGA como nuevas métricas
      apiStats.xG = understat.xG || 0;
      apiStats.xGA = understat.xGA || 0;
      
      // Calcular sobre/sub rendimiento respecto a xG
      if (apiStats.goalsFor && apiStats.xG) {
        apiStats.xGDiff = apiStats.goalsFor - (apiStats.xG * apiStats.matches);
      }
      
      if (apiStats.goalsAgainst && apiStats.xGA) {
        apiStats.xGADiff = apiStats.goalsAgainst - (apiStats.xGA * apiStats.matches);
      }
    }
  },
  
  /**
   * Obtiene predicciones disponibles
   * @param {object} req - Solicitud HTTP
   * @param {object} res - Respuesta HTTP
   */
  getPredictions(req, res) {
    try {
      const { date, leagueId, limit } = req.query;
      
      // Obtener todas las claves del caché que comienzan con "prediction:"
      const allKeys = Array.from(cache.getStats().keys)
        .filter(key => key.startsWith('prediction:'));
      
      // Obtener todas las predicciones en caché
      const predictions = allKeys
        .map(key => cache.get(key))
        .filter(pred => pred !== null);
      
      // Filtrar por fecha si es necesario
      let filteredPredictions = predictions;
      if (date) {
        const targetDate = new Date(date).toISOString().split('T')[0];
        filteredPredictions = filteredPredictions.filter(pred => {
          const predDate = new Date(pred.fixture.date).toISOString().split('T')[0];
          return predDate === targetDate;
        });
      }
      
      // Filtrar por liga si es necesario
      if (leagueId) {
        filteredPredictions = filteredPredictions.filter(pred => 
          pred.fixture.league && pred.fixture.league.id === parseInt(leagueId)
        );
      }
      
      // Ordenar por confianza de la mejor apuesta (de mayor a menor)
      filteredPredictions.sort((a, b) => 
        (b.bestBet?.confidence || 0) - (a.bestBet?.confidence || 0)
      );
      
      // Limitar resultados si es necesario
      if (limit) {
        filteredPredictions = filteredPredictions.slice(0, parseInt(limit));
      }
      
      return res.json({
        success: true,
        count: filteredPredictions.length,
        predictions: filteredPredictions
      });
      
    } catch (error) {
      console.error('Error obteniendo predicciones:', error);
      return res.status(500).json({
        success: false,
        message: 'Error obteniendo predicciones',
        error: error.message
      });
    }
  },
  
  /**
   * Elimina una predicción específica de la caché
   * @param {object} req - Solicitud HTTP
   * @param {object} res - Respuesta HTTP
   */
  deletePrediction(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere ID de predicción'
        });
      }
      
      const cacheKey = `prediction:${id}`;
      const deleted = cache.delete(cacheKey);
      
      return res.json({
        success: true,
        deleted,
        message: deleted ? 'Predicción eliminada' : 'Predicción no encontrada'
      });
      
    } catch (error) {
      console.error('Error eliminando predicción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error eliminando predicción',
        error: error.message
      });
    }
  },
  
  /**
   * Elimina todas las predicciones de la caché
   * @param {object} req - Solicitud HTTP
   * @param {object} res - Respuesta HTTP
   */
  clearAllPredictions(req, res) {
    try {
      // Obtener todas las claves del caché que comienzan con "prediction:"
      const allKeys = Array.from(cache.getStats().keys)
        .filter(key => key.startsWith('prediction:'));
      
      // Eliminar cada predicción
      let count = 0;
      allKeys.forEach(key => {
        if (cache.delete(key)) {
          count++;
        }
      });
      
      return res.json({
        success: true,
        count,
        message: `${count} predicciones eliminadas`
      });
      
    } catch (error) {
      console.error('Error eliminando predicciones:', error);
      return res.status(500).json({
        success: false,
        message: 'Error eliminando predicciones',
        error: error.message
      });
    }
  }
};

module.exports = predictionController;
