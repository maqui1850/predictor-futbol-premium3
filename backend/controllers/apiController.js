const apiService = require('../services/apiService');
const cache = require('../utils/cache');

/**
 * Controlador para operaciones relacionadas con la API de fútbol externa
 */
const apiController = {
  /**
   * Obtiene todas las ligas disponibles
   */
  getLeagues: async (req, res, next) => {
    try {
      // Intentar obtener datos de caché primero
      const cacheKey = 'leagues';
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      // Si no hay caché, obtener datos de la API
      const leagues = await apiService.fetchLeagues();
      
      // Guardar en caché
      cache.set(cacheKey, leagues);
      
      return res.json({
        success: true,
        data: leagues,
        source: 'api'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene equipos por liga
   */
  getTeamsByLeague: async (req, res, next) => {
    try {
      const { leagueId } = req.params;
      const cacheKey = `teams_${leagueId}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const teams = await apiService.fetchTeamsByLeague(leagueId);
      cache.set(cacheKey, teams);
      
      return res.json({
        success: true,
        data: teams,
        source: 'api'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene partidos por liga y fecha opcional
   */
  getFixturesByLeague: async (req, res, next) => {
    try {
      const { leagueId, date } = req.params;
      const cacheKey = `fixtures_${leagueId}_${date || 'next'}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const fixtures = await apiService.fetchFixturesByLeague(leagueId, date);
      cache.set(cacheKey, fixtures);
      
      return res.json({
        success: true,
        data: fixtures,
        source: 'api'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene detalles de un partido específico
   */
  getFixtureById: async (req, res, next) => {
    try {
      const { fixtureId } = req.params;
      const cacheKey = `fixture_${fixtureId}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const fixture = await apiService.fetchFixtureById(fixtureId);
      cache.set(cacheKey, fixture);
      
      return res.json({
        success: true,
        data: fixture,
        source: 'api'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene estadísticas de un partido
   */
  getStatisticsByFixture: async (req, res, next) => {
    try {
      const { fixtureId } = req.params;
      const cacheKey = `statistics_${fixtureId}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const statistics = await apiService.fetchStatisticsByFixture(fixtureId);
      cache.set(cacheKey, statistics);
      
      return res.json({
        success: true,
        data: statistics,
        source: 'api'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene historial head-to-head entre dos equipos
   */
  getHeadToHead: async (req, res, next) => {
    try {
      const { team1, team2 } = req.params;
      const cacheKey = `h2h_${team1}_${team2}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const h2h = await apiService.fetchHeadToHead(team1, team2);
      cache.set(cacheKey, h2h);
      
      return res.json({
        success: true,
        data: h2h,
        source: 'api'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = apiController;
