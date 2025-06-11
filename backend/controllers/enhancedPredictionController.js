// backend/controllers/enhancedPredictionController.js
const leagues = require('../config/leagues');
const scrapingService = require('../services/scrapingService');
const oddsComparisonService = require('../services/oddsComparisonService');
const pythonClient = require('../services/pythonClient');
const simplePredictionModel = require('../models/simplePredictionModel');
const cache = require('../utils/cache');

class EnhancedPredictionController {
  /**
   * Obtiene todas las ligas disponibles
   */
  async getLeagues(req, res) {
    try {
      const leaguesList = Object.entries(leagues).map(([name, data]) => ({
        name,
        id: data.id,
        country: data.country,
        flag: data.flag,
        teamsCount: data.teams.length
      }));

      res.json({
        success: true,
        count: leaguesList.length,
        leagues: leaguesList
      });
    } catch (error) {
      console.error('Error getting leagues:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener ligas'
      });
    }
  }

  /**
   * Obtiene equipos de una liga específica
   */
  async getTeamsByLeague(req, res) {
    try {
      const { league } = req.params;
      
      if (!leagues[league]) {
        return res.status(404).json({
          success: false,
          error: 'Liga no encontrada'
        });
      }

      const leagueData = leagues[league];
      
      res.json({
        success: true,
        league: {
          name: league,
          country: leagueData.country,
          flag: leagueData.flag
        },
        teams: leagueData.teams.sort()
      });
    } catch (error) {
      console.error('Error getting teams:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener equipos'
      });
    }
  }

  /**
   * Predicción completa con estadísticas de web scraping
   */
  async predictWithStats(req, res) {
    try {
      const { homeTeam, awayTeam, league, includeWebStats = true } = req.body;
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren equipo local y visitante'
        });
      }

      // Obtener estadísticas desde web scraping si está habilitado
      let webStats = null;
      if (includeWebStats) {
        try {
          const [homeStats, awayStats, h2hStats] = await Promise.all([
            webScrapingService.getTeamStats(homeTeam, { 
              includeSofaScore: true, 
              includeFlashscore: true 
            }),
            webScrapingService.getTeamStats(awayTeam, { 
              includeSofaScore: true, 
              includeFlashscore: true 
            }),
            webScrapingService.getH2HStats(homeTeam, awayTeam)
          ]);

          webStats = {
            homeTeam: homeStats,
            awayTeam: awayStats,
            headToHead: h2hStats
          };
        } catch (error) {
          console.error('Error getting web stats:', error);
          // Continuar sin estadísticas web
        }
      }

      // Intentar predicción con Python ML
      let prediction;
      let modelType = 'simple';
      
      try {
        const pythonData = {
          homeTeam,
          awayTeam,
          league,
          webStats
        };
        
        prediction = await pythonClient.getPrediction(pythonData);
        modelType = 'advanced';
      } catch (error) {
        console.error('Python ML failed, using simple model:', error);
        prediction = simplePredictionModel.predict(homeTeam, awayTeam);
      }

      // Enriquecer predicción con estadísticas web
      if (webStats) {
        prediction.enhancedAnalysis = this.generateEnhancedAnalysis(prediction, webStats);
      }

      res.json({
        success: true,
        modelType,
        data: prediction,
        webStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in prediction with stats:', error);
      res.status(500).json({
        success: false,
        error: 'Error al generar predicción'
      });
    }
  }

  /**
   * Obtiene comparación de cuotas para un partido
   */
  async getOddsComparison(req, res) {
    try {
      const { homeTeam, awayTeam, league } = req.query;
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren equipo local y visitante'
        });
      }

      const oddsData = await oddsComparisonService.getOddsComparison(
        homeTeam, 
        awayTeam, 
        league
      );

      res.json({
        success: true,
        data: oddsData
      });
    } catch (error) {
      console.error('Error getting odds comparison:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener cuotas'
      });
    }
  }

  /**
   * Análisis combinado: Predicción + Cuotas + Valor
   */
  async getCompleteAnalysis(req, res) {
    try {
      const { homeTeam, awayTeam, league } = req.body;
      
      // Obtener todo en paralelo para optimizar tiempo
      const [prediction, oddsData, homeForm, awayForm] = await Promise.all([
        this.getPredictionData(homeTeam, awayTeam, league),
        oddsComparisonService.getOddsComparison(homeTeam, awayTeam, league),
        webScrapingService.getTeamForm(homeTeam),
        webScrapingService.getTeamForm(awayTeam)
      ]);

      // Análisis de valor combinado
      const valueAnalysis = this.analyzeValueVsPrediction(prediction, oddsData);
      
      // Recomendaciones finales
      const recommendations = this.generateRecommendations(
        prediction, 
        oddsData, 
        valueAnalysis,
        { homeForm, awayForm }
      );

      res.json({
        success: true,
        match: {
          homeTeam,
          awayTeam,
          league
        },
        prediction,
        odds: oddsData,
        form: {
          home: homeForm,
          away: awayForm
        },
        valueAnalysis,
        recommendations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in complete analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Error al generar análisis completo'
      });
    }
  }

  /**
   * Obtiene predicción con manejo de errores
   */
  async getPredictionData(homeTeam, awayTeam, league) {
    try {
      const pythonData = { homeTeam, awayTeam, league };
      return await pythonClient.getPrediction(pythonData);
    } catch (error) {
      console.error('ML prediction failed:', error);
      return simplePredictionModel.predict(homeTeam, awayTeam);
    }
  }

  /**
   * Analiza valor comparando predicción vs cuotas
   */
  analyzeValueVsPrediction(prediction, oddsData) {
    if (!oddsData.averageOdds) return null;

    const avgOdds = oddsData.averageOdds;
    
    // Convertir cuotas a probabilidades implícitas
    const impliedProb = {
      home: 1 / parseFloat(avgOdds.home),
      draw: 1 / parseFloat(avgOdds.draw),
      away: 1 / parseFloat(avgOdds.away)
    };

    // Comparar con predicción IA
    const aiProb = {
      home: prediction.victoria_local || prediction.homeWinProbability || 0,
      draw: prediction.empate || prediction.drawProbability || 0,
      away: prediction.victoria_visitante || prediction.awayWinProbability || 0
    };

    // Calcular edge (ventaja)
    const edge = {
      home: aiProb.home - impliedProb.home,
      draw: aiProb.draw - impliedProb.draw,
      away: aiProb.away - impliedProb.away
    };

    // Calcular valor esperado
    const expectedValue = {
      home: (aiProb.home * parseFloat(avgOdds.home)) - 1,
      draw: (aiProb.draw * parseFloat(avgOdds.draw)) - 1,
      away: (aiProb.away * parseFloat(avgOdds.away)) - 1
    };

    // Identificar mejores apuestas de valor
    const valueBets = [];
    
    if (expectedValue.home > 0.05) {
      valueBets.push({
        market: 'Victoria Local',
        ev: expectedValue.home,
        edge: edge.home,
        aiProbability: aiProb.home,
        impliedProbability: impliedProb.home,
        odds: avgOdds.home
      });
    }
    
    if (expectedValue.draw > 0.05) {
      valueBets.push({
        market: 'Empate',
        ev: expectedValue.draw,
        edge: edge.draw,
        aiProbability: aiProb.draw,
        impliedProbability: impliedProb.draw,
        odds: avgOdds.draw
      });
    }
    
    if (expectedValue.away > 0.05) {
      valueBets.push({
        market: 'Victoria Visitante',
        ev: expectedValue.away,
        edge: edge.away,
        aiProbability: aiProb.away,
        impliedProbability: impliedProb.away,
        odds: avgOdds.away
      });
    }

    // Ordenar por valor esperado
    valueBets.sort((a, b) => b.ev - a.ev);

    return {
      edge,
      expectedValue,
      valueBets,
      hasValue: valueBets.length > 0,
      bestValue: valueBets[0] || null
    };
  }

  /**
   * Genera recomendaciones basadas en todos los datos
   */
  generateRecommendations(prediction, oddsData, valueAnalysis, formData) {
    const recommendations = [];
    
    // Recomendación principal basada en predicción
    const mainPrediction = this.getMainPrediction(prediction);
    recommendations.push({
      type: 'prediction',
      market: mainPrediction.market,
      confidence: mainPrediction.confidence,
      reason: 'Basado en modelo de IA',
      priority: 1
    });

    // Recomendaciones de valor
    if (valueAnalysis && valueAnalysis.hasValue) {
      valueAnalysis.valueBets.slice(0, 2).forEach((bet, index) => {
        recommendations.push({
          type: 'value',
          market: bet.market,
          expectedValue: (bet.ev * 100).toFixed(2) + '%',
          edge: (bet.edge * 100).toFixed(2) + '%',
          odds: bet.odds,
          reason: `Valor positivo detectado: IA ${(bet.aiProbability * 100).toFixed(1)}% vs Mercado ${(bet.impliedProbability * 100).toFixed(1)}%`,
          priority: 2 + index
        });
      });
    }

    // Recomendaciones basadas en forma
    if (formData.homeForm && formData.awayForm) {
      const formAnalysis = this.analyzeForm(formData);
      if (formAnalysis.strongTrend) {
        recommendations.push({
          type: 'form',
          market: formAnalysis.recommendation,
          confidence: formAnalysis.confidence,
          reason: formAnalysis.reason,
          priority: 4
        });
      }
    }

    // Recomendación de arbitraje si existe
    if (oddsData.arbitrageOpportunity && oddsData.arbitrageOpportunity.exists) {
      recommendations.push({
        type: 'arbitrage',
        profit: oddsData.arbitrageOpportunity.profit,
        distribution: oddsData.arbitrageOpportunity.distribution,
        reason: 'Oportunidad de arbitraje detectada',
        priority: 0 // Máxima prioridad
      });
    }

    // Ordenar por prioridad
    recommendations.sort((a, b) => a.priority - b.priority);

    return recommendations;
  }

  /**
   * Obtiene la predicción principal
   */
  getMainPrediction(prediction) {
    const probs = {
      home: prediction.victoria_local || prediction.homeWinProbability || 0,
      draw: prediction.empate || prediction.drawProbability || 0,
      away: prediction.victoria_visitante || prediction.awayWinProbability || 0
    };

    let market = 'Victoria Local';
    let prob = probs.home;
    
    if (probs.draw > prob) {
      market = 'Empate';
      prob = probs.draw;
    }
    
    if (probs.away > prob) {
      market = 'Victoria Visitante';
      prob = probs.away;
    }

    return {
      market,
      confidence: (prob * 100).toFixed(1) + '%'
    };
  }

  /**
   * Analiza la forma de los equipos
   */
  analyzeForm(formData) {
    const homeWinRate = formData.homeForm.wins / formData.homeForm.matches.length;
    const awayWinRate = formData.awayForm.wins / formData.awayForm.matches.length;
    
    let strongTrend = false;
    let recommendation = '';
    let confidence = 0;
    let reason = '';

    // Equipo local en gran forma
    if (homeWinRate > 0.7 && formData.homeForm.matches.length >= 5) {
      strongTrend = true;
      recommendation = 'Victoria Local';
      confidence = '75%';
      reason = `${formData.homeForm.formString} - Excelente forma local`;
    }
    // Equipo visitante en gran forma
    else if (awayWinRate > 0.7 && formData.awayForm.matches.length >= 5) {
      strongTrend = true;
      recommendation = 'Victoria Visitante';
      confidence = '70%';
      reason = `${formData.awayForm.formString} - Excelente forma visitante`;
    }
    // Ambos en mala forma - posible empate
    else if (homeWinRate < 0.2 && awayWinRate < 0.2) {
      strongTrend = true;
      recommendation = 'Empate';
      confidence = '65%';
      reason = 'Ambos equipos en mala forma';
    }

    return {
      strongTrend,
      recommendation,
      confidence,
      reason
    };
  }

  /**
   * Genera análisis mejorado con estadísticas web
   */
  generateEnhancedAnalysis(prediction, webStats) {
    const analysis = [];

    // Análisis de posesión esperada
    if (webStats.homeTeam.possession && webStats.awayTeam.possession) {
      const totalPossession = webStats.homeTeam.possession + webStats.awayTeam.possession;
      const homePossessionShare = (webStats.homeTeam.possession / totalPossession * 100).toFixed(1);
      
      analysis.push({
        type: 'possession',
        insight: `${homePossessionShare}% de posesión esperada para el local basado en estadísticas recientes`,
        impact: homePossessionShare > 55 ? 'positive' : homePossessionShare < 45 ? 'negative' : 'neutral'
      });
    }

    // Análisis de goles esperados
    if (webStats.homeTeam.goalsScored && webStats.awayTeam.goalsConceded) {
      const expectedHomeGoals = (webStats.homeTeam.goalsScored + webStats.awayTeam.goalsConceded) / 2;
      const expectedAwayGoals = (webStats.awayTeam.goalsScored + webStats.homeTeam.goalsConceded) / 2;
      
      analysis.push({
        type: 'goals',
        insight: `Goles esperados: ${expectedHomeGoals.toFixed(1)} - ${expectedAwayGoals.toFixed(1)}`,
        impact: 'informative'
      });
    }

    // Análisis head-to-head
    if (webStats.headToHead && webStats.headToHead.totalMatches > 0) {
      const h2h = webStats.headToHead;
      analysis.push({
        type: 'h2h',
        insight: `En ${h2h.totalMatches} enfrentamientos: ${h2h.team1Wins} victorias locales, ${h2h.draws} empates, ${h2h.team2Wins} victorias visitantes`,
        impact: h2h.team1Wins > h2h.team2Wins ? 'positive' : h2h.team2Wins > h2h.team1Wins ? 'negative' : 'neutral'
      });
    }

    return analysis;
  }
}

module.exports = new EnhancedPredictionController();