// backend/routes/enhancedRoutes.js
const express = require('express');
const router = express.Router();
const enhancedController = require('../controllers/enhancedPredictionController');

// Rutas para ligas y equipos
router.get('/leagues', enhancedController.getLeagues.bind(enhancedController));
router.get('/leagues/:league/teams', enhancedController.getTeamsByLeague.bind(enhancedController));

// Rutas de predicciones mejoradas
router.post('/predict/enhanced', enhancedController.predictWithStats.bind(enhancedController));
router.post('/predict/complete', enhancedController.getCompleteAnalysis.bind(enhancedController));

// Rutas de cuotas deportivas
router.get('/odds/comparison', enhancedController.getOddsComparison.bind(enhancedController));

// Ruta de búsqueda de equipos
router.get('/search/teams', (req, res) => {
  const { q } = req.query;
  const leagues = require('../config/leagues');
  
  if (!q || q.length < 2) {
    return res.json({ success: true, teams: [] });
  }
  
  const searchTerm = q.toLowerCase();
  const results = [];
  
  Object.entries(leagues).forEach(([leagueName, leagueData]) => {
    leagueData.teams.forEach(team => {
      if (team.toLowerCase().includes(searchTerm)) {
        results.push({
          team,
          league: leagueName,
          country: leagueData.country,
          flag: leagueData.flag
        });
      }
    });
  });
  
  res.json({
    success: true,
    query: q,
    count: results.length,
    teams: results.slice(0, 20) // Limitar a 20 resultados
  });
});

// Ruta para obtener estadísticas web de un equipo
router.get('/stats/team/:teamName', async (req, res) => {
  try {
    const { teamName } = req.params;
    const webScrapingService = require('../services/webScrapingService');
    
    const [stats, form] = await Promise.all([
      webScrapingService.getTeamStats(teamName),
      webScrapingService.getTeamForm(teamName)
    ]);
    
    res.json({
      success: true,
      team: teamName,
      stats,
      form
    });
  } catch (error) {
    console.error('Error getting team stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del equipo'
    });
  }
});

// Ruta para obtener head-to-head
router.get('/stats/h2h/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    const webScrapingService = require('../services/webScrapingService');
    
    const h2h = await webScrapingService.getH2HStats(team1, team2);
    
    res.json({
      success: true,
      team1,
      team2,
      data: h2h
    });
  } catch (error) {
    console.error('Error getting H2H stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas H2H'
    });
  }
});

// Ruta para obtener mejores cuotas por mercado
router.get('/odds/best', async (req, res) => {
  try {
    const { homeTeam, awayTeam, market = '1x2' } = req.query;
    
    if (!homeTeam || !awayTeam) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren equipo local y visitante'
      });
    }
    
    const oddsComparisonService = require('../services/oddsComparisonService');
    const comparison = await oddsComparisonService.getOddsComparison(homeTeam, awayTeam);
    
    let bestOdds;
    switch (market.toLowerCase()) {
      case '1x2':
        bestOdds = comparison.bestOdds;
        break;
      case 'btts':
        bestOdds = comparison.bestOdds.btts;
        break;
      case 'overunder':
        bestOdds = comparison.bestOdds.overUnder;
        break;
      default:
        bestOdds = comparison.bestOdds;
    }
    
    res.json({
      success: true,
      market,
      match: `${homeTeam} vs ${awayTeam}`,
      bestOdds,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting best odds:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mejores cuotas'
    });
  }
});

// Ruta para verificar oportunidades de arbitraje
router.get('/odds/arbitrage', async (req, res) => {
  try {
    const oddsComparisonService = require('../services/oddsComparisonService');
    const cache = require('../utils/cache');
    
    // Buscar en caché oportunidades recientes
    const cacheKey = 'arbitrage:opportunities';
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        source: 'cache',
        opportunities: cached
      });
    }
    
    // En producción real, esto buscaría en múltiples partidos
    // Por ahora, devolvemos un ejemplo
    const opportunities = [
      {
        match: 'Real Madrid vs Barcelona',
        league: 'La Liga',
        profit: '2.3%',
        distribution: {
          home: { stake: '45.2%', bookmaker: 'Bet365', odds: '2.25' },
          draw: { stake: '29.8%', bookmaker: 'Betfair', odds: '3.40' },
          away: { stake: '25.0%', bookmaker: 'Pinnacle', odds: '4.10' }
        },
        expires: new Date(Date.now() + 300000).toISOString() // 5 minutos
      }
    ];
    
    cache.set(cacheKey, opportunities, 60); // Cache por 1 minuto
    
    res.json({
      success: true,
      source: 'live',
      opportunities,
      disclaimer: 'Las oportunidades de arbitraje son raras y desaparecen rápidamente'
    });
  } catch (error) {
    console.error('Error checking arbitrage:', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar oportunidades de arbitraje'
    });
  }
});

module.exports = router;