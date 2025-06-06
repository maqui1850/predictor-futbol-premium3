// backend/controllers/valueAnalysisController.js

/**
 * Controlador para análisis de valor comparando predicciones IA vs cuotas de casas
 */
const valueAnalysisController = {
  
  /**
   * Analiza el valor de las cuotas comparando con predicciones de IA
   */
  async analyzeValueBetting(req, res) {
    try {
      console.log('🎯 Analizando valor de apuestas:', req.body);
      
      const { 
        homeTeam, 
        awayTeam, 
        league, 
        date,
        odds = {} // Cuotas de la casa de apuestas
      } = req.body;
      
      // Validar que tenemos los datos básicos
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren los equipos local y visitante'
        });
      }
      
      // Validar que tenemos al menos algunas cuotas
      if (!odds || Object.keys(odds).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren las cuotas de la casa de apuestas'
        });
      }
      
      // 1. Obtener predicción de IA (primero intentar ML, luego fallback)
      let aiPrediction;
      try {
        aiPrediction = await this.getAIPrediction(homeTeam, awayTeam, league, date);
      } catch (error) {
        console.warn('Error con IA, usando modelo simple:', error.message);
        aiPrediction = await this.getSimplePrediction(homeTeam, awayTeam, league);
      }
      
      // 2. Calcular análisis de valor para cada mercado
      const valueAnalysis = this.calculateValueAnalysis(aiPrediction, odds);
      
      // 3. Generar recomendaciones
      const recommendations = this.generateRecommendations(valueAnalysis);
      
      // 4. Calcular métricas adicionales
      const summary = this.calculateSummaryMetrics(valueAnalysis);
      
      const result = {
        success: true,
        data: {
          match: {
            homeTeam,
            awayTeam,
            league: league || 'Unknown',
            date: date || new Date().toISOString().split('T')[0]
          },
          aiPrediction,
          odds,
          valueAnalysis,
          recommendations,
          summary,
          timestamp: new Date().toISOString(),
          analysisType: 'value_betting'
        }
      };
      
      console.log('✅ Análisis de valor completado');
      return res.json(result);
      
    } catch (error) {
      console.error('❌ Error en análisis de valor:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al analizar el valor de las apuestas',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  },
  
  /**
   * Obtiene predicción de IA (ML avanzado)
   */
  async getAIPrediction(homeTeam, awayTeam, league, date) {
    const pythonClient = require('../services/pythonClient');
    
    const matchData = {
      homeTeam: { name: homeTeam },
      awayTeam: { name: awayTeam },
      league: { name: league },
      date: date
    };
    
    const prediction = await pythonClient.getPrediction(matchData);
    
    // Normalizar formato de respuesta
    return {
      homeWin: prediction.homeWinProbability || 0,
      draw: prediction.drawProbability || 0,
      awayWin: prediction.awayWinProbability || 0,
      bttsYes: prediction.markets?.btts?.yes || 0,
      bttsNo: prediction.markets?.btts?.no || 0,
      over25: prediction.markets?.overUnder?.over2_5 || 0,
      under25: prediction.markets?.overUnder?.under2_5 || 0,
      confidence: prediction.confidence || 5,
      modelType: 'advanced_ml'
    };
  },
  
  /**
   * Obtiene predicción simple (fallback)
   */
  async getSimplePrediction(homeTeam, awayTeam, league) {
    const simplePredictionModel = require('../models/simplePredictionModel');
    const prediction = simplePredictionModel.predict(homeTeam, awayTeam);
    
    return {
      homeWin: prediction.victoria_local || 0,
      draw: prediction.empate || 0,
      awayWin: prediction.victoria_visitante || 0,
      bttsYes: prediction.mercados_adicionales?.ambos_equipos_marcan || 0,
      bttsNo: 1 - (prediction.mercados_adicionales?.ambos_equipos_marcan || 0),
      over25: prediction.mercados_adicionales?.mas_2_5_goles || 0,
      under25: 1 - (prediction.mercados_adicionales?.mas_2_5_goles || 0),
      confidence: 6,
      modelType: 'simple_fallback'
    };
  },
  
  /**
   * Calcula análisis de valor para cada mercado
   */
  calculateValueAnalysis(aiPrediction, odds) {
    const analysis = {};
    
    // Análisis 1X2
    if (odds.home) {
      analysis.homeWin = this.calculateMarketValue(aiPrediction.homeWin, odds.home, 'Victoria Local');
    }
    if (odds.draw) {
      analysis.draw = this.calculateMarketValue(aiPrediction.draw, odds.draw, 'Empate');
    }
    if (odds.away) {
      analysis.awayWin = this.calculateMarketValue(aiPrediction.awayWin, odds.away, 'Victoria Visitante');
    }
    
    // Análisis BTTS
    if (odds.bttsYes) {
      analysis.bttsYes = this.calculateMarketValue(aiPrediction.bttsYes, odds.bttsYes, 'Ambos Marcan SÍ');
    }
    if (odds.bttsNo) {
      analysis.bttsNo = this.calculateMarketValue(aiPrediction.bttsNo, odds.bttsNo, 'Ambos Marcan NO');
    }
    
    // Análisis Over/Under
    if (odds.over25) {
      analysis.over25 = this.calculateMarketValue(aiPrediction.over25, odds.over25, 'Más de 2.5 Goles');
    }
    if (odds.under25) {
      analysis.under25 = this.calculateMarketValue(aiPrediction.under25, odds.under25, 'Menos de 2.5 Goles');
    }
    
    return analysis;
  },
  
  /**
   * Calcula valor para un mercado específico
   */
  calculateMarketValue(aiProbability, odds, marketName) {
    const impliedProbability = 1 / odds;
    const expectedValue = (aiProbability * odds) - 1;
    const edge = aiProbability - impliedProbability;
    const edgePercentage = (edge / impliedProbability) * 100;
    
    // Kelly Criterion para tamaño de apuesta óptimo
    const kellyCriterion = edge / (odds - 1);
    const kellyPercentage = Math.max(0, Math.min(kellyCriterion * 100, 25)); // Max 25%
    
    return {
      marketName,
      aiProbability: parseFloat(aiProbability.toFixed(4)),
      impliedProbability: parseFloat(impliedProbability.toFixed(4)),
      odds: odds,
      expectedValue: parseFloat(expectedValue.toFixed(4)),
      edge: parseFloat(edge.toFixed(4)),
      edgePercentage: parseFloat(edgePercentage.toFixed(2)),
      kellyCriterion: parseFloat(kellyCriterion.toFixed(4)),
      kellyPercentage: parseFloat(kellyPercentage.toFixed(1)),
      hasValue: edge > 0.05, // 5% edge mínimo
      hasSignificantValue: edge > 0.10, // 10% edge significativo
      recommendation: this.getRecommendation(edge, expectedValue),
      confidenceLevel: this.getConfidenceLevel(edge, aiProbability)
    };
  },
  
  /**
   * Genera recomendación basada en el edge
   */
  getRecommendation(edge, expectedValue) {
    if (edge > 0.15) return 'APOSTAR FUERTE';
    if (edge > 0.10) return 'APOSTAR';
    if (edge > 0.05) return 'APOSTAR LIGERO';
    if (edge > 0.02) return 'VALOR LEVE';
    if (expectedValue > -0.05) return 'NEUTRAL';
    return 'PASAR';
  },
  
  /**
   * Calcula nivel de confianza
   */
  getConfidenceLevel(edge, aiProbability) {
    // Más confianza en predicciones extremas con buen edge
    const probabilityFactor = Math.abs(aiProbability - 0.5) * 2; // 0 a 1
    const edgeFactor = Math.min(Math.abs(edge) * 10, 1); // 0 a 1
    
    const confidence = (probabilityFactor * 0.3 + edgeFactor * 0.7) * 10;
    
    if (confidence >= 8) return 'ALTA';
    if (confidence >= 6) return 'MEDIA';
    if (confidence >= 4) return 'BAJA';
    return 'MUY BAJA';
  },
  
  /**
   * Genera recomendaciones generales
   */
  generateRecommendations(valueAnalysis) {
    const markets = Object.values(valueAnalysis);
    const valueBets = markets.filter(m => m.hasValue);
    const significantBets = markets.filter(m => m.hasSignificantValue);
    
    // Ordenar por valor esperado
    const sortedByValue = markets.sort((a, b) => b.expectedValue - a.expectedValue);
    const bestBet = sortedByValue[0];
    
    const recommendations = {
      totalOpportunities: valueBets.length,
      significantOpportunities: significantBets.length,
      bestBet: bestBet ? {
        market: bestBet.marketName,
        expectedValue: bestBet.expectedValue,
        edge: bestBet.edgePercentage,
        recommendation: bestBet.recommendation,
        kellySize: bestBet.kellyPercentage
      } : null,
      strategy: this.generateStrategy(valueBets, significantBets),
      riskLevel: this.calculateRiskLevel(markets),
      portfolioAdvice: this.generatePortfolioAdvice(valueBets)
    };
    
    return recommendations;
  },
  
  /**
   * Genera estrategia general
   */
  generateStrategy(valueBets, significantBets) {
    if (significantBets.length >= 2) {
      return 'AGGRESSIVE';
    } else if (valueBets.length >= 1) {
      return 'MODERATE';
    } else {
      return 'CONSERVATIVE';
    }
  },
  
  /**
   * Calcula nivel de riesgo
   */
  calculateRiskLevel(markets) {
    const avgConfidence = markets.reduce((sum, m) => {
      const confValue = m.confidenceLevel === 'ALTA' ? 8 : 
                       m.confidenceLevel === 'MEDIA' ? 6 : 
                       m.confidenceLevel === 'BAJA' ? 4 : 2;
      return sum + confValue;
    }, 0) / markets.length;
    
    if (avgConfidence >= 7) return 'BAJO';
    if (avgConfidence >= 5) return 'MEDIO';
    return 'ALTO';
  },
  
  /**
   * Genera consejos de portafolio
   */
  generatePortfolioAdvice(valueBets) {
    const advice = [];
    
    if (valueBets.length === 0) {
      advice.push('No se detectaron oportunidades de valor en este partido');
      advice.push('Considera buscar otros partidos o esperar mejores cuotas');
    } else if (valueBets.length === 1) {
      advice.push('Apuesta individual recomendada');
      advice.push('Considera el tamaño sugerido por Kelly Criterion');
    } else {
      advice.push('Múltiples oportunidades detectadas');
      advice.push('Distribuye el riesgo entre varios mercados');
      advice.push('No apuestes más del 5% del bankroll total en este partido');
    }
    
    return advice;
  },
  
  /**
   * Calcula métricas resumen
   */
  calculateSummaryMetrics(valueAnalysis) {
    const markets = Object.values(valueAnalysis);
    
    const summary = {
      totalMarkets: markets.length,
      valueOpportunities: markets.filter(m => m.hasValue).length,
      avgExpectedValue: markets.reduce((sum, m) => sum + m.expectedValue, 0) / markets.length,
      maxExpectedValue: Math.max(...markets.map(m => m.expectedValue)),
      totalKellyPercentage: markets.reduce((sum, m) => sum + m.kellyPercentage, 0),
      overallRating: this.calculateOverallRating(markets)
    };
    
    return {
      ...summary,
      avgExpectedValue: parseFloat(summary.avgExpectedValue.toFixed(4)),
      maxExpectedValue: parseFloat(summary.maxExpectedValue.toFixed(4)),
      totalKellyPercentage: parseFloat(summary.totalKellyPercentage.toFixed(1))
    };
  },
  
  /**
   * Calcula rating general del partido
   */
  calculateOverallRating(markets) {
    const valueMarkets = markets.filter(m => m.hasValue);
    const avgEdge = valueMarkets.reduce((sum, m) => sum + m.edge, 0) / Math.max(valueMarkets.length, 1);
    
    if (avgEdge > 0.15) return 'EXCELENTE';
    if (avgEdge > 0.10) return 'MUY BUENO';
    if (avgEdge > 0.05) return 'BUENO';
    if (avgEdge > 0.02) return 'ACEPTABLE';
    return 'POBRE';
  },
  
  /**
   * Endpoint para obtener historial de análisis de valor
   */
  async getValueHistory(req, res) {
    try {
      // En una implementación real, esto vendría de una base de datos
      const mockHistory = [
        {
          date: '2025-06-05',
          match: 'Real Madrid vs Barcelona',
          opportunities: 2,
          bestValue: 0.15,
          result: 'pending'
        },
        {
          date: '2025-06-04', 
          match: 'Manchester City vs Liverpool',
          opportunities: 1,
          bestValue: 0.08,
          result: 'won'
        }
      ];
      
      res.json({
        success: true,
        data: mockHistory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error obteniendo historial'
      });
    }
  }
};

module.exports = valueAnalysisController;