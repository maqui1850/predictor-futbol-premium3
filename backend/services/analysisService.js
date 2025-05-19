// backend/services/analysisService.js
const cache = require('../utils/cache');

class AnalysisService {
  /**
   * Genera una predicción completa para un partido
   * @param {object} matchData - Datos completos del partido
   * @returns {object} - Predicción generada
   */
  async generatePrediction(matchData) {
    // Verificar si ya existe en caché
    const cacheKey = `prediction:${matchData.fixture.id}`;
    const cachedPrediction = cache.get(cacheKey);
    if (cachedPrediction) {
      console.log(`Usando predicción en caché para partido: ${matchData.fixture.id}`);
      return cachedPrediction;
    }
    
    try {
      // Extraer datos relevantes
      const homeTeam = matchData.homeTeam;
      const awayTeam = matchData.awayTeam;
      const h2h = matchData.h2h || [];
      const homeStats = matchData.homeTeamStats || {};
      const awayStats = matchData.awayTeamStats || {};
      const leagueStats = matchData.leagueStats || {};
      
      // Generar predicciones para diferentes mercados
      const result = this.predictResult(homeTeam, awayTeam, h2h, homeStats, awayStats, leagueStats);
      const btts = this.predictBTTS(homeTeam, awayTeam, h2h, homeStats, awayStats);
      const overUnder = this.predictOverUnder(homeTeam, awayTeam, h2h, homeStats, awayStats);
      const corners = this.predictCorners(homeTeam, awayTeam, h2h, homeStats, awayStats);
      const cards = this.predictCards(homeTeam, awayTeam, h2h, homeStats, awayStats);
      const handicap = this.predictHandicap(homeTeam, awayTeam, h2h, homeStats, awayStats);
      
      // Determinar apuesta recomendada
      const bestBet = this.determineBestBet({
        result, btts, overUnder, corners, cards, handicap
      });
      
      const prediction = {
        fixture: matchData.fixture,
        timestamp: new Date().toISOString(),
        markets: {
          result,
          btts,
          overUnder,
          corners,
          cards,
          handicap
        },
        bestBet
      };
      
      // Guardar en caché (válido por 6 horas)
      cache.set(cacheKey, prediction, 6 * 3600);
      
      return prediction;
    } catch (error) {
      console.error(`Error generando predicción:`, error);
      throw new Error(`Error generando predicción: ${error.message}`);
    }
  }
  
  /**
   * Predice el resultado 1X2
   */
  predictResult(homeTeam, awayTeam, h2h, homeStats, awayStats, leagueStats) {
    // Inicializar probabilidades base
    let homeWinProb = 0.40;  // Probabilidad base para victoria local
    let drawProb = 0.25;     // Probabilidad base para empate
    let awayWinProb = 0.35;  // Probabilidad base para victoria visitante
    
    // Ajustar según fortaleza en casa/fuera
    if (homeStats.homeStrength && awayStats.awayStrength) {
      homeWinProb += (homeStats.homeStrength - 0.5) * 0.2;
      awayWinProb += (awayStats.awayStrength - 0.5) * 0.2;
      drawProb = 1 - (homeWinProb + awayWinProb);
    }
    
    // Ajustar según rendimiento reciente
    if (homeStats.form && awayStats.form) {
      homeWinProb += (homeStats.form - 0.5) * 0.15;
      awayWinProb += (awayStats.form - 0.5) * 0.15;
      drawProb = 1 - (homeWinProb + awayWinProb);
    }
    
    // Ajustar según h2h
    if (h2h && h2h.length > 0) {
      const h2hHistory = this.analyzeH2H(h2h, homeTeam.id, awayTeam.id);
      homeWinProb += (h2hHistory.homeWinRate - 0.5) * 0.1;
      drawProb += (h2hHistory.drawRate - 0.25) * 0.1;
      awayWinProb += (h2hHistory.awayWinRate - 0.5) * 0.1;
    }
    
    // Normalizar probabilidades
    const total = homeWinProb + drawProb + awayWinProb;
    homeWinProb /= total;
    drawProb /= total;
    awayWinProb /= total;
    
    // Calcular cuotas implícitas (sin margen)
    const homeOdds = 1 / homeWinProb;
    const drawOdds = 1 / drawProb;
    const awayOdds = 1 / awayWinProb;
    
    // Calcular niveles de confianza (0-10)
    const homeConfidence = this.calculateConfidence(homeWinProb, 0.4);
    const drawConfidence = this.calculateConfidence(drawProb, 0.25);
    const awayConfidence = this.calculateConfidence(awayWinProb, 0.35);
    
    return {
      predictions: {
        '1': {
          probability: Math.round(homeWinProb * 100) / 100,
          odds: Math.round(homeOdds * 100) / 100,
          confidence: homeConfidence
        },
        'X': {
          probability: Math.round(drawProb * 100) / 100,
          odds: Math.round(drawOdds * 100) / 100,
          confidence: drawConfidence
        },
        '2': {
          probability: Math.round(awayWinProb * 100) / 100,
          odds: Math.round(awayOdds * 100) / 100,
          confidence: awayConfidence
        }
      },
      bestPick: this.getBestPick([
        { key: '1', confidence: homeConfidence, odds: homeOdds },
        { key: 'X', confidence: drawConfidence, odds: drawOdds },
        { key: '2', confidence: awayConfidence, odds: awayOdds }
      ])
    };
  }
  
  /**
   * Predice si ambos equipos marcarán
   */
  predictBTTS(homeTeam, awayTeam, h2h, homeStats, awayStats) {
    // Valor base
    let bttsYesProb = 0.55;
    
    // Analizar capacidad goleadora y defensiva
    if (homeStats.goalsFor && homeStats.goalsAgainst && 
        awayStats.goalsFor && awayStats.goalsAgainst) {
        
      // Si ambos equipos tienden a marcar y recibir, aumenta la probabilidad de BTTS
      const homeScoresRegularly = homeStats.goalsFor / homeStats.matches > 1.0;
      const homeConcedesRegularly = homeStats.goalsAgainst / homeStats.matches > 0.8;
      const awayScoresRegularly = awayStats.goalsFor / awayStats.matches > 0.8;
      const awayConcedesRegularly = awayStats.goalsAgainst / awayStats.matches > 1.0;
      
      if (homeScoresRegularly) bttsYesProb += 0.05;
      if (homeConcedesRegularly) bttsYesProb += 0.05;
      if (awayScoresRegularly) bttsYesProb += 0.05;
      if (awayConcedesRegularly) bttsYesProb += 0.05;
      
      // Portería a cero (clean sheets)
      if (homeStats.cleanSheets / homeStats.matches > 0.4) bttsYesProb -= 0.1;
      if (awayStats.cleanSheets / awayStats.matches > 0.3) bttsYesProb -= 0.1;
    }
    
    // Analizar historial H2H para BTTS
    if (h2h && h2h.length > 0) {
      const bttsCount = h2h.filter(match => {
        const homeGoals = match.goals.home;
        const awayGoals = match.goals.away;
        return homeGoals > 0 && awayGoals > 0;
      }).length;
      
      const bttsRate = bttsCount / h2h.length;
      bttsYesProb = (bttsYesProb + bttsRate) / 2; // Promedio entre predicción inicial y datos H2H
    }
    
    // Limitar entre 0 y 1
    bttsYesProb = Math.max(0.1, Math.min(0.9, bttsYesProb));
    const bttsNoProb = 1 - bttsYesProb;
    
    // Calcular cuotas
    const bttsYesOdds = 1 / bttsYesProb;
    const bttsNoOdds = 1 / bttsNoProb;
    
    // Calcular niveles de confianza
    const bttsYesConfidence = this.calculateConfidence(bttsYesProb, 0.55);
    const bttsNoConfidence = this.calculateConfidence(bttsNoProb, 0.45);
    
    return {
      predictions: {
        'Yes': {
          probability: Math.round(bttsYesProb * 100) / 100,
          odds: Math.round(bttsYesOdds * 100) / 100,
          confidence: bttsYesConfidence
        },
        'No': {
          probability: Math.round(bttsNoProb * 100) / 100,
          odds: Math.round(bttsNoOdds * 100) / 100,
          confidence: bttsNoConfidence
        }
      },
      bestPick: this.getBestPick([
        { key: 'Yes', confidence: bttsYesConfidence, odds: bttsYesOdds },
        { key: 'No', confidence: bttsNoConfidence, odds: bttsNoOdds }
      ])
    };
  }
  
  /**
   * Predice Over/Under goles
   */
  predictOverUnder(homeTeam, awayTeam, h2h, homeStats, awayStats) {
    // Inicializar probabilidades base para diferentes líneas
    const predictions = {
      'O1.5': { probability: 0.75, confidence: 0 },
      'U1.5': { probability: 0.25, confidence: 0 },
      'O2.5': { probability: 0.55, confidence: 0 },
      'U2.5': { probability: 0.45, confidence: 0 },
      'O3.5': { probability: 0.35, confidence: 0 },
      'U3.5': { probability: 0.65, confidence: 0 }
    };
    
    // Ajustar según estadísticas de los equipos
    if (homeStats.goalsFor && homeStats.goalsAgainst && 
        awayStats.goalsFor && awayStats.goalsAgainst) {
      
      // Calcular promedio de goles por partido para ambos equipos
      const homeAvgGoalsScored = homeStats.goalsFor / homeStats.matches;
      const homeAvgGoalsConceded = homeStats.goalsAgainst / homeStats.matches;
      const awayAvgGoalsScored = awayStats.goalsFor / awayStats.matches;
      const awayAvgGoalsConceded = awayStats.goalsAgainst / awayStats.matches;
      
      // Predecir goles totales para este partido
      const predictedTotalGoals = (homeAvgGoalsScored + awayAvgGoalsConceded + awayAvgGoalsScored + homeAvgGoalsConceded) / 2;
      
      // Actualizar probabilidades basadas en predicción de goles
      // Distribución de Poisson simplificada
      predictions['O1.5'].probability = 1 - this.poissonProbability(0, predictedTotalGoals) - this.poissonProbability(1, predictedTotalGoals);
      predictions['U1.5'].probability = 1 - predictions['O1.5'].probability;
      
      predictions['O2.5'].probability = 1 - this.poissonProbability(0, predictedTotalGoals) - this.poissonProbability(1, predictedTotalGoals) - this.poissonProbability(2, predictedTotalGoals);
      predictions['U2.5'].probability = 1 - predictions['O2.5'].probability;
      
      predictions['O3.5'].probability = 1 - this.poissonProbability(0, predictedTotalGoals) - this.poissonProbability(1, predictedTotalGoals) - this.poissonProbability(2, predictedTotalGoals) - this.poissonProbability(3, predictedTotalGoals);
      predictions['U3.5'].probability = 1 - predictions['O3.5'].probability;
    }
    
    // Incorporar datos de H2H
    if (h2h && h2h.length > 0) {
      const h2hAvgGoals = h2h.reduce((sum, match) => sum + match.goals.home + match.goals.away, 0) / h2h.length;
      
      // Contar ocurrencias en H2H
      const over15Count = h2h.filter(match => match.goals.home + match.goals.away > 1.5).length / h2h.length;
      const over25Count = h2h.filter(match => match.goals.home + match.goals.away > 2.5).length / h2h.length;
      const over35Count = h2h.filter(match => match.goals.home + match.goals.away > 3.5).length / h2h.length;
      
      // Combinar predicciones con datos H2H (peso 30%)
      predictions['O1.5'].probability = predictions['O1.5'].probability * 0.7 + over15Count * 0.3;
      predictions['U1.5'].probability = 1 - predictions['O1.5'].probability;
      
      predictions['O2.5'].probability = predictions['O2.5'].probability * 0.7 + over25Count * 0.3;
      predictions['U2.5'].probability = 1 - predictions['O2.5'].probability;
      
      predictions['O3.5'].probability = predictions['O3.5'].probability * 0.7 + over35Count * 0.3;
      predictions['U3.5'].probability = 1 - predictions['O3.5'].probability;
    }
    
    // Calcular odds y confianza para cada predicción
    const result = { predictions: {}, bestPick: null };
    const bestPickCandidates = [];
    
    for (const [key, data] of Object.entries(predictions)) {
      // Calcular odds
      const odds = 1 / data.probability;
      
      // Calcular confianza (más alta para extremos)
      const baseProb = key.startsWith('O') ? 
        (key === 'O1.5' ? 0.75 : key === 'O2.5' ? 0.55 : 0.35) : 
        (key === 'U1.5' ? 0.25 : key === 'U2.5' ? 0.45 : 0.65);
      
      const confidence = this.calculateConfidence(data.probability, baseProb);
      
      result.predictions[key] = {
        probability: Math.round(data.probability * 100) / 100,
        odds: Math.round(odds * 100) / 100,
        confidence
      };
      
      bestPickCandidates.push({
        key,
        confidence,
        odds
      });
    }
    
    // Determinar la mejor apuesta
    result.bestPick = this.getBestPick(bestPickCandidates);
    
    return result;
  }
  
  // Función auxiliar para cálculo de distribución de Poisson
  poissonProbability(k, lambda) {
    return Math.exp(-lambda) * Math.pow(lambda, k) / this.factorial(k);
  }
  
  // Función auxiliar para calcular factorial
  factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }
  
  /**
   * Determina la mejor apuesta de todas las predicciones
   * @param {object} predictions - Todas las predicciones generadas
   * @returns {object} - La mejor apuesta recomendada
   */
  determineBestBet(predictions) {
    // Obtener todas las mejores apuestas de cada mercado
    const bestPicks = [];
    
    for (const [market, prediction] of Object.entries(predictions)) {
      if (prediction.bestPick) {
        bestPicks.push({
          market,
          ...prediction.bestPick,
          confidence: parseFloat(prediction.bestPick.confidence)
        });
      }
    }
    
    // Ordenar por confianza (de mayor a menor)
    bestPicks.sort((a, b) => b.confidence - a.confidence);
    
    // Si no hay predicciones, retornar null
    if (bestPicks.length === 0) return null;
    
    // La mejor apuesta es la primera (mayor confianza)
    const bestBet = bestPicks[0];
    
    return {
      market: bestBet.market,
      pick: bestBet.key,
      odds: bestBet.odds,
      confidence: bestBet.confidence,
      rating: this.getConfidenceRating(bestBet.confidence)
    };
  }
  
  /**
   * Analiza historial H2H para obtener estadísticas
   * @param {Array} h2h - Historial de enfrentamientos directos
   * @param {number} homeId - ID del equipo local
   * @param {number} awayId - ID del equipo visitante
   * @returns {object} - Estadísticas H2H
   */
  analyzeH2H(h2h, homeId, awayId) {
    if (!h2h || h2h.length === 0) {
      return {
        homeWinRate: 0.5,
        drawRate: 0.25,
        awayWinRate: 0.25,
        avgGoals: 2.5,
        bttsRate: 0.5
      };
    }
    
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalGoals = 0;
    let bttsCount = 0;
    
    h2h.forEach(match => {
      const homeGoals = match.goals.home;
      const awayGoals = match.goals.away;
      
      // Sumar goles
      totalGoals += homeGoals + awayGoals;
      
      // Determinar resultado
      if (homeGoals > awayGoals) {
        homeWins++;
      } else if (homeGoals < awayGoals) {
        awayWins++;
      } else {
        draws++;
      }
      
      // Ambos equipos marcan
      if (homeGoals > 0 && awayGoals > 0) {
        bttsCount++;
      }
    });
    
    return {
      homeWinRate: homeWins / h2h.length,
      drawRate: draws / h2h.length,
      awayWinRate: awayWins / h2h.length,
      avgGoals: totalGoals / h2h.length,
      bttsRate: bttsCount / h2h.length
    };
  }
  
  /**
   * Calcula el nivel de confianza (0-10) basado en probabilidad
   * @param {number} probability - Probabilidad calculada
   * @param {number} baseProb - Probabilidad base para comparar
   * @returns {number} - Nivel de confianza (0-10)
   */
  calculateConfidence(probability, baseProb) {
    // Diferencia con probabilidad base
    const diffFromBase = Math.abs(probability - baseProb);
    
    // El nivel de confianza aumenta con la diferencia de la base
    // y también con valores extremos de probabilidad
    const extremeBonus = Math.pow((probability - 0.5) * 2, 2) * 3;
    
    // Fórmula: 5 (base media) + diferencia escalada + bonus por extremos
    let confidence = 5 + (diffFromBase * 10) + extremeBonus;
    
    // Limitar entre 0 y 10
    confidence = Math.max(0, Math.min(10, confidence));
    
    return Math.round(confidence * 10) / 10; // Redondear a 1 decimal
  }
  
  /**
   * Obtiene el rating textual según el nivel de confianza
   * @param {number} confidence - Nivel de confianza (0-10)
   * @returns {string} - Rating textual
   */
  getConfidenceRating(confidence) {
    if (confidence >= 7.5) return 'Muy Alta';
    if (confidence >= 6.0) return 'Alta';
    if (confidence >= 5.0) return 'Media';
    if (confidence >= 3.5) return 'Baja';
    return 'Muy Baja';
  }
  
  /**
   * Determina la mejor selección entre varias opciones
   * @param {Array} options - Lista de opciones con confianza y odds
   * @returns {object} - La mejor selección
   */
  getBestPick(options) {
    if (!options || options.length === 0) return null;
    
    // Ordenar por confianza (de mayor a menor)
    options.sort((a, b) => b.confidence - a.confidence);
    
    // Si hay una opción claramente superior (diferencia >1.5 puntos)
    if (options.length > 1 && options[0].confidence - options[1].confidence > 1.5) {
      return options[0];
    }
    
    // Si hay empate relativo de confianza, valorar también las cuotas
    const topOptions = options.filter(opt => opt.confidence >= options[0].confidence - 1.5);
    
    // Calcular valor esperado (confidence * odds)
    topOptions.forEach(opt => {
      opt.valueScore = opt.confidence * (opt.odds - 1) * 0.1;
    });
    
    // Ordenar por valor esperado
    topOptions.sort((a, b) => b.valueScore - a.valueScore);
    
    return topOptions[0];
  }
}

module.exports = new AnalysisService();
