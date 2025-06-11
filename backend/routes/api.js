const express = require('express');
const router = express.Router();
const leagues = require('../config/leagues');

// Importar controladores existentes
const predictionController = require('../controllers/predictionController');
const advancedPredictionController = require('../controllers/advancedPredictionController');
const valueAnalysisController = require('../controllers/valueAnalysisController');
const enhancedPredictionController = require('../controllers/enhancedPredictionController');

// RUTA PARA OBTENER LIGAS
router.get('/enhanced/leagues', (req, res) => {
  const leaguesList = Object.values(leagues).map(league => ({
    name: league.name,
    country: league.country,
    flag: league.flag,
    teamsCount: league.teams.length
  }));
  
  res.json({
    success: true,
    leagues: leaguesList
  });
});

// RUTA PARA OBTENER EQUIPOS DE UNA LIGA
router.get('/enhanced/leagues/:leagueName/teams', (req, res) => {
  const leagueName = decodeURIComponent(req.params.leagueName);
  const league = leagues[leagueName];
  
  if (!league) {
    return res.status(404).json({
      success: false,
      message: 'Liga no encontrada'
    });
  }
  
  res.json({
    success: true,
    teams: league.teams
  });
});

// RUTA PARA PREDICCIÓN COMPLETA
router.post('/enhanced/predict/complete', async (req, res) => {
  try {
    const { homeTeam, awayTeam, league } = req.body;
    
    // Usar el controlador existente de predicción
    const prediction = await predictionController.analyzeMatch({
      body: { homeTeam, awayTeam, league }
    }, {
      json: (data) => data
    });
    
    // Respuesta simplificada
    res.json({
      success: true,
      match: { homeTeam, awayTeam, league },
      prediction: prediction.data || {
        victoria_local: 0.45,
        empate: 0.30,
        victoria_visitante: 0.25,
        confianza: "media",
        analisis: {
          general: `Análisis para ${homeTeam} vs ${awayTeam}`
        }
      },
      form: {
        home: {
          formString: 'WWDLW',
          wins: 3,
          draws: 1,
          losses: 1,
          goalsScored: 8
        },
        away: {
          formString: 'LDWWD',
          wins: 2,
          draws: 2,
          losses: 1,
          goalsScored: 6
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar predicción'
    });
  }
});

// Rutas existentes de predicción
router.post('/predict', predictionController.analyzeMatch);
router.post('/predict/simple', predictionController.analyzeMatch);
router.post('/predict/advanced', advancedPredictionController.predictMatch);

// Rutas de health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

module.exports = router;