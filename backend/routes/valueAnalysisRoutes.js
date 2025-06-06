// backend/routes/valueAnalysisRoutes.js

const express = require('express');
const router = express.Router();
const valueAnalysisController = require('../controllers/valueAnalysisController');

/**
 * Rutas para análisis de valor de apuestas
 */

// POST /api/value/analyze - Analizar valor de un partido con cuotas
router.post('/analyze', valueAnalysisController.analyzeValueBetting);

// GET /api/value/history - Obtener historial de análisis
router.get('/history', valueAnalysisController.getValueHistory);

// POST /api/value/compare - Comparar múltiples casas de apuestas
router.post('/compare', async (req, res) => {
  try {
    const { homeTeam, awayTeam, league, date, bookmakers = [] } = req.body;
    
    if (bookmakers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren las cuotas de al menos una casa de apuestas'
      });
    }
    
    // Analizar cada casa de apuestas
    const comparisons = [];
    
    for (const bookmaker of bookmakers) {
      try {
        const analysis = await valueAnalysisController.analyzeValueBetting({
          body: {
            homeTeam,
            awayTeam, 
            league,
            date,
            odds: bookmaker.odds
          }
        }, {
          json: (data) => data // Mock response object
        });
        
        comparisons.push({
          bookmaker: bookmaker.name,
          logo: bookmaker.logo,
          analysis: analysis,
          rating: calculateBookmakerRating(analysis)
        });
      } catch (error) {
        console.error(`Error analizando ${bookmaker.name}:`, error);
      }
    }
    
    // Encontrar la mejor casa para cada mercado
    const bestBookmakers = findBestBookmakers(comparisons);
    
    res.json({
      success: true,
      data: {
        match: { homeTeam, awayTeam, league, date },
        comparisons,
        bestBookmakers,
        summary: generateComparisonSummary(comparisons)
      }
    });
    
  } catch (error) {
    console.error('Error en comparación de casas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al comparar casas de apuestas'
    });
  }
});

// GET /api/value/opportunities - Obtener oportunidades del día
router.get('/opportunities', async (req, res) => {
  try {
    // En una implementación real, esto consultaría múltiples partidos
    const mockOpportunities = [
      {
        match: 'Real Madrid vs Barcelona',
        league: 'La Liga',
        date: '2025-06-06',
        bestValue: 0.18,
        market: 'Victoria Local',
        odds: 2.40,
        aiProbability: 0.65,
        confidence: 'ALTA'
      },
      {
        match: 'Manchester City vs Arsenal', 
        league: 'Premier League',
        date: '2025-06-06',
        bestValue: 0.12,
        market: 'Más de 2.5 Goles',
        odds: 1.85,
        aiProbability: 0.71,
        confidence: 'MEDIA'
      }
    ];
    
    res.json({
      success: true,
      data: {
        opportunities: mockOpportunities,
        totalOpportunities: mockOpportunities.length,
        avgValue: mockOpportunities.reduce((sum, opp) => sum + opp.bestValue, 0) / mockOpportunities.length,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo oportunidades'
    });
  }
});

// POST /api/value/kelly - Calcular tamaño óptimo de apuesta (Kelly Criterion)
router.post('/kelly', (req, res) => {
  try {
    const { bankroll, aiProbability, odds, riskLevel = 'conservative' } = req.body;
    
    if (!bankroll || !aiProbability || !odds) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren bankroll, probabilidad de IA y cuotas'
      });
    }
    
    const impliedProbability = 1 / odds;
    const edge = aiProbability - impliedProbability;
    
    // Kelly Criterion básico
    let kellyCriterion = edge / (odds - 1);
    
    // Ajustar por nivel de riesgo
    const riskMultipliers = {
      conservative: 0.25,
      moderate: 0.5,
      aggressive: 1.0
    };
    
    const riskMultiplier = riskMultipliers[riskLevel] || 0.25;
    kellyCriterion *= riskMultiplier;
    
    // Límites de seguridad
    const maxPercentage = 10; // Máximo 10% del bankroll
    const kellyPercentage = Math.max(0, Math.min(kellyCriterion * 100, maxPercentage));
    const suggestedAmount = (bankroll * kellyPercentage) / 100;
    
    res.json({
      success: true,
      data: {
        kellyCriterion: parseFloat(kellyCriterion.toFixed(4)),
        kellyPercentage: parseFloat(kellyPercentage.toFixed(2)),
        suggestedAmount: parseFloat(suggestedAmount.toFixed(2)),
        edge: parseFloat(edge.toFixed(4)),
        riskLevel,
        warnings: generateKellyWarnings(kellyPercentage, edge)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculando Kelly Criterion'
    });
  }
});

// Funciones auxiliares
function calculateBookmakerRating(analysis) {
  const markets = Object.values(analysis.data.valueAnalysis);
  const opportunities = markets.filter(m => m.hasValue).length;
  const avgValue = markets.reduce((sum, m) => sum + m.expectedValue, 0) / markets.length;
  
  let rating = 5; // Base rating
  rating += opportunities * 0.5; // +0.5 por cada oportunidad
  rating += avgValue * 10; // +10 por cada 100% de valor esperado
  
  return Math.min(10, Math.max(1, rating));
}

function findBestBookmakers(comparisons) {
  const markets = ['homeWin', 'draw', 'awayWin', 'bttsYes', 'over25'];
  const bestBookmakers = {};
  
  markets.forEach(market => {
    let bestBookmaker = null;
    let bestValue = -Infinity;
    
    comparisons.forEach(comp => {
      const marketAnalysis = comp.analysis.data.valueAnalysis[market];
      if (marketAnalysis && marketAnalysis.expectedValue > bestValue) {
        bestValue = marketAnalysis.expectedValue;
        bestBookmaker = {
          name: comp.bookmaker,
          logo: comp.logo,
          value: bestValue,
          odds: marketAnalysis.odds
        };
      }
    });
    
    if (bestBookmaker) {
      bestBookmakers[market] = bestBookmaker;
    }
  });
  
  return bestBookmakers;
}

function generateComparisonSummary(comparisons) {
  const totalOpportunities = comparisons.reduce((sum, comp) => 
    sum + comp.analysis.data.recommendations.totalOpportunities, 0
  );
  
  const avgRating = comparisons.reduce((sum, comp) => sum + comp.rating, 0) / comparisons.length;
  
  const bestOverall = comparisons.reduce((best, current) => 
    current.rating > best.rating ? current : best
  );
  
  return {
    totalComparisons: comparisons.length,
    totalOpportunities,
    avgRating: parseFloat(avgRating.toFixed(1)),
    bestOverall: bestOverall.bookmaker,
    recommendation: generateOverallRecommendation(totalOpportunities, avgRating)
  };
}

function generateOverallRecommendation(totalOpportunities, avgRating) {
  if (totalOpportunities >= 3 && avgRating >= 7) {
    return 'Excelente partido para apostar con múltiples oportunidades';
  } else if (totalOpportunities >= 1 && avgRating >= 6) {
    return 'Buenas oportunidades detectadas, proceder con precaución';
  } else {
    return 'Pocas oportunidades de valor, considerar pasar este partido';
  }
}

function generateKellyWarnings(kellyPercentage, edge) {
  const warnings = [];
  
  if (kellyPercentage > 5) {
    warnings.push('Apuesta de alto riesgo - considera reducir el tamaño');
  }
  
  if (edge < 0.03) {
    warnings.push('Edge muy pequeño - la varianza puede ser alta');
  }
  
  if (kellyPercentage === 0) {
    warnings.push('No hay valor detectado - no se recomienda apostar');
  }
  
  return warnings;
}

module.exports = router;