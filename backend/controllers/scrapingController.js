const scrapingService = require('../services/scrapingService');
const cache = require('../utils/cache');

/**
 * Controlador para operaciones relacionadas con web scraping
 */
const scrapingController = {
  /**
   * Obtiene todas las ligas disponibles mediante scraping
   */
  getLeagues: async (req, res, next) => {
    try {
      // Intentar obtener datos de caché primero
      const cacheKey = 'scrape_leagues';
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      // Si no hay caché, obtener datos mediante scraping
      const leagues = await scrapingService.scrapeLeagues();
      
      // Guardar en caché
      cache.set(cacheKey, leagues);
      
      return res.json({
        success: true,
        data: leagues,
        source: 'scraping'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene equipos por liga mediante scraping
   */
  getTeamsByLeague: async (req, res, next) => {
    try {
      const { leagueId } = req.params;
      const cacheKey = `scrape_teams_${leagueId}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const teams = await scrapingService.scrapeTeamsByLeague(leagueId);
      cache.set(cacheKey, teams);
      
      return res.json({
        success: true,
        data: teams,
        source: 'scraping'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene partidos por liga y fecha opcional mediante scraping
   */
  getFixturesByLeague: async (req, res, next) => {
    try {
      const { leagueId, date } = req.params;
      const cacheKey = `scrape_fixtures_${leagueId}_${date || 'next'}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const fixtures = await scrapingService.scrapeFixturesByLeague(leagueId, date);
      cache.set(cacheKey, fixtures);
      
      return res.json({
        success: true,
        data: fixtures,
        source: 'scraping'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene estadísticas de un partido mediante scraping
   */
  getStatisticsByFixture: async (req, res, next) => {
    try {
      const { fixtureId } = req.params;
      const cacheKey = `scrape_statistics_${fixtureId}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const statistics = await scrapingService.scrapeFixtureStatistics(fixtureId);
      cache.set(cacheKey, statistics);
      
      return res.json({
        success: true,
        data: statistics,
        source: 'scraping'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Obtiene historial head-to-head entre dos equipos mediante scraping
   */
  getHeadToHead: async (req, res, next) => {
    try {
      const { team1, team2 } = req.params;
      const cacheKey = `scrape_h2h_${team1}_${team2}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json({
          success: true,
          data: cachedData,
          source: 'cache'
        });
      }
      
      const h2h = await scrapingService.scrapeHeadToHead(team1, team2);
      cache.set(cacheKey, h2h);
      
      return res.json({
        success: true,
        data: h2h,
        source: 'scraping'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = scrapingController;
