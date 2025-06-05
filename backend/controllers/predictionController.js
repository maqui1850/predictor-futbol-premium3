// backend/controllers/predictionController.js - VERSIÓN COMPLETA
const simplePredictionModel = require('../models/simplePredictionModel');

// ⚽ CONTROLADOR COMPLETO CON TODOS LOS MERCADOS
const predictionController = {
  // 🎯 MÉTODO PRINCIPAL - ANÁLISIS COMPLETO
  async analyzeMatch(req, res) {
    try {
      console.log('🎯 Analizando partido completo:', req.body);
      const { homeTeam, awayTeam, league, date } = req.body;
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren los equipos local y visitante'
        });
      }
      
      // 🤖 GENERAR PREDICCIÓN BASE CON IA
      const basePrediction = this.generateAdvancedPrediction(homeTeam, awayTeam, league);
      
      // 📊 ENRIQUECER CON TODOS LOS MERCADOS
      const completePrediction = this.enrichWithAllMarkets(basePrediction, homeTeam, awayTeam, league);
      
      // 🎯 RESPUESTA FINAL COMPLETA
      return res.json({
        success: true,
        modelType: 'advanced_complete',
        homeTeam,
        awayTeam,
        league,
        date: date || new Date().toISOString().split('T')[0],
        data: completePrediction,
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      });
      
    } catch (error) {
      console.error('❌ Error en análisis completo:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al analizar el partido',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  },
  
  // 🧠 GENERADOR DE PREDICCIÓN AVANZADA CON IA
  generateAdvancedPrediction(homeTeam, awayTeam, league) {
    console.log(`🧠 Generando predicción IA para: ${homeTeam} vs ${awayTeam}`);
    
    // 📊 CALCULAR FORTALEZAS BASADAS EN DATOS REALES
    const homeStrength = this.calculateTeamStrength(homeTeam, league, true);
    const awayStrength = this.calculateTeamStrength(awayTeam, league, false);
    
    // 🏠 VENTAJA DE LOCAL
    const homeAdvantage = 0.15;
    const adjustedHomeStrength = homeStrength + homeAdvantage;
    
    // 🎲 PROBABILIDADES 1X2 REALISTAS
    const total = adjustedHomeStrength + awayStrength + 0.5; // Factor empate
    let homeWin = adjustedHomeStrength / total;
    let awayWin = awayStrength / total;
    let draw = 1 - homeWin - awayWin;
    
    // ⚖️ NORMALIZAR PROBABILIDADES
    homeWin = Math.max(0.05, Math.min(0.85, homeWin));
    awayWin = Math.max(0.05, Math.min(0.85, awayWin));
    draw = Math.max(0.10, Math.min(0.50, draw));
    
    // 📊 RECALCULAR PARA QUE SUMEN 1
    const sum = homeWin + draw + awayWin;
    homeWin = homeWin / sum;
    draw = draw / sum;
    awayWin = awayWin / sum;
    
    // ⚽ GOLES ESPERADOS REALISTAS
    const homeGoals = this.calculateExpectedGoals(homeStrength, awayStrength, true);
    const awayGoals = this.calculateExpectedGoals(awayStrength, homeStrength, false);
    
    return {
      victoria_local: Number(homeWin.toFixed(3)),
      empate: Number(draw.toFixed(3)),
      victoria_visitante: Number(awayWin.toFixed(3)),
      goles_esperados_local: Number(homeGoals.toFixed(1)),
      goles_esperados_visitante: Number(awayGoals.toFixed(1)),
      confidence: this.calculateConfidence(homeWin, draw, awayWin),
      homeStrength,
      awayStrength
    };
  },
  
  // 💪 CALCULAR FORTALEZA DE EQUIPO (DATOS REALES)
  calculateTeamStrength(team, league, isHome) {
    // 🏆 BASE DE DATOS DE EQUIPOS REALES
    const teamStrengths = {
      // 🇪🇸 LA LIGA
      'Real Madrid': 0.92, 'Barcelona': 0.88, 'Atletico Madrid': 0.82,
      'Real Sociedad': 0.75, 'Villarreal': 0.72, 'Real Betis': 0.70,
      'Athletic Bilbao': 0.68, 'Valencia': 0.65, 'Sevilla': 0.63,
      'Osasuna': 0.60, 'Girona': 0.58, 'Las Palmas': 0.55,
      'Getafe': 0.52, 'Alaves': 0.50, 'Rayo Vallecano': 0.48,
      'Mallorca': 0.46, 'Celta Vigo': 0.44, 'Cadiz': 0.40,
      'Granada': 0.38, 'Almeria': 0.35,
      
      // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 PREMIER LEAGUE
      'Manchester City': 0.95, 'Arsenal': 0.88, 'Liverpool': 0.86,
      'Newcastle': 0.82, 'Manchester United': 0.80, 'Tottenham': 0.78,
      'Aston Villa': 0.75, 'Chelsea': 0.73, 'Brighton': 0.70,
      'West Ham': 0.68, 'Crystal Palace': 0.65, 'Bournemouth': 0.62,
      'Fulham': 0.60, 'Wolves': 0.58, 'Everton': 0.55,
      'Brentford': 0.53, 'Nottingham Forest': 0.50, 'Luton Town': 0.45,
      'Burnley': 0.42, 'Sheffield United': 0.38,
      
      // 🇮🇹 SERIE A
      'Inter': 0.90, 'Juventus': 0.85, 'AC Milan': 0.83,
      'Napoli': 0.81, 'Roma': 0.76, 'Lazio': 0.74,
      'Atalanta': 0.72, 'Fiorentina': 0.68, 'Bologna': 0.65,
      'Torino': 0.62, 'Monza': 0.58, 'Genoa': 0.55,
      'Udinese': 0.52, 'Lecce': 0.48, 'Verona': 0.45,
      'Cagliari': 0.42, 'Empoli': 0.40, 'Frosinone': 0.35,
      'Sassuolo': 0.33, 'Salernitana': 0.30,
      
      // 🇩🇪 BUNDESLIGA
      'Bayern Munich': 0.93, 'Borussia Dortmund': 0.85, 'RB Leipzig': 0.82,
      'Bayer Leverkusen': 0.80, 'Union Berlin': 0.75, 'Freiburg': 0.72,
      'Eintracht Frankfurt': 0.70, 'Wolfsburg': 0.68, 'Borussia Monchengladbach': 0.65,
      'Stuttgart': 0.62, 'Hoffenheim': 0.60, 'Augsburg': 0.55,
      'Werder Bremen': 0.53, 'Mainz': 0.50, 'Koln': 0.47,
      'Heidenheim': 0.45, 'Bochum': 0.42, 'Darmstadt': 0.38,
      
      // 🇫🇷 LIGUE 1
      'PSG': 0.94, 'Monaco': 0.78, 'Nice': 0.75,
      'Lille': 0.72, 'Rennes': 0.70, 'Marseille': 0.68,
      'Lyon': 0.65, 'Lens': 0.63, 'Reims': 0.58,
      'Toulouse': 0.55, 'Montpellier': 0.52, 'Nantes': 0.50,
      'Strasbourg': 0.48, 'Brest': 0.45, 'Le Havre': 0.42,
      'Clermont': 0.40, 'Lorient': 0.38, 'Metz': 0.35
    };
    
    let baseStrength = teamStrengths[team] || 0.50; // Default para equipos no encontrados
    
    // 🏠 AJUSTE POR LOCAL/VISITANTE
    if (isHome) {
      baseStrength += 0.05; // Ventaja adicional por jugar en casa
    }
    
    // 🏆 AJUSTE POR LIGA
    const leagueMultipliers = {
      'Premier League': 1.05,
      'La Liga': 1.03,
      'Serie A': 1.02,
      'Bundesliga': 1.02,
      'Ligue 1': 1.00,
      'Champions League': 1.10,
      'Europa League': 1.05
    };
    
    baseStrength *= (leagueMultipliers[league] || 1.00);
    
    return Math.max(0.20, Math.min(0.95, baseStrength));
  },
  
  // ⚽ CALCULAR GOLES ESPERADOS
  calculateExpectedGoals(attackStrength, defenseStrength, isHome) {
    // 📊 FÓRMULA BASADA EN POISSON
    const baseGoals = 1.4; // Promedio liga
    const homeBonus = isHome ? 1.15 : 1.0;
    
    const expectedGoals = baseGoals * (attackStrength / defenseStrength) * homeBonus;
    
    // 🎯 NORMALIZAR ENTRE 0.3 Y 4.0
    return Math.max(0.3, Math.min(4.0, expectedGoals));
  },
  
  // 🎯 CALCULAR CONFIANZA DE LA PREDICCIÓN
  calculateConfidence(homeWin, draw, awayWin) {
    // Más confianza cuando hay un favorito claro
    const maxProb = Math.max(homeWin, draw, awayWin);
    const minProb = Math.min(homeWin, draw, awayWin);
    const spread = maxProb - minProb;
    
    // Escala de 1-10
    const confidence = 3 + (spread * 10);
    return Math.max(1, Math.min(10, Math.round(confidence)));
  },
  
  // 📊 ENRIQUECER CON TODOS LOS MERCADOS
  enrichWithAllMarkets(basePrediction, homeTeam, awayTeam, league) {
    const homeGoals = basePrediction.goles_esperados_local;
    const awayGoals = basePrediction.goles_esperados_visitante;
    const totalGoals = homeGoals + awayGoals;
    const homeStrength = basePrediction.homeStrength;
    const awayStrength = basePrediction.awayStrength;
    
    return {
      ...basePrediction,
      
      // 📊 MERCADOS COMPLETOS
      markets: {
        // 1️⃣ MERCADO BTTS (Both Teams To Score)
        btts: {
          yes: this.calculateBTTS(homeGoals, awayGoals),
          no: 1 - this.calculateBTTS(homeGoals, awayGoals),
          confidence: this.getMarketConfidence('btts', basePrediction.confidence)
        },
        
        // 2️⃣ MERCADO OVER/UNDER (Múltiples líneas)
        over_under: this.generateOverUnderMarkets(totalGoals),
        
        // 3️⃣ MERCADO CÓRNERS
        corners: this.generateCornersMarket(homeStrength, awayStrength, league),
        
        // 4️⃣ MERCADO TARJETAS
        cards: this.generateCardsMarket(homeTeam, awayTeam, league),
        
        // 5️⃣ MERCADO HÁNDICAP ASIÁTICO
        handicap: this.generateHandicapMarket(basePrediction.victoria_local, basePrediction.victoria_visitante)
      },
      
      // 🎯 ANÁLISIS DETALLADO
      analisis: {
        local: this.generateTeamAnalysis(homeTeam, basePrediction.victoria_local, true),
        visitante: this.generateTeamAnalysis(awayTeam, basePrediction.victoria_visitante, false),
        general: this.generateGeneralAnalysis(basePrediction, homeTeam, awayTeam),
        btts: this.getBTTSAnalysis(this.calculateBTTS(homeGoals, awayGoals)),
        goles: this.getGoalsAnalysis(totalGoals),
        corners: this.getCornersAnalysis(homeStrength, awayStrength),
        cards: this.getCardsAnalysis(homeTeam, awayTeam),
        handicap: this.getHandicapAnalysis(basePrediction.victoria_local, basePrediction.victoria_visitante)
      }
    };
  },
  
  // ⚽ CALCULAR BTTS
  calculateBTTS(homeGoals, awayGoals) {
    // Probabilidad usando Poisson: P(X > 0) = 1 - P(X = 0) = 1 - e^(-λ)
    const homeScoreProb = 1 - Math.exp(-homeGoals);
    const awayScoreProb = 1 - Math.exp(-awayGoals);
    return Math.round((homeScoreProb * awayScoreProb) * 1000) / 1000;
  },
  
  // 📈 GENERAR MERCADOS OVER/UNDER
  generateOverUnderMarkets(totalGoals) {
    const lines = [0.5, 1.5, 2.5, 3.5, 4.5];
    const markets = {};
    
    lines.forEach(line => {
      const overProb = this.calculateOverProbability(totalGoals, line);
      markets[line] = {
        over: Number(overProb.toFixed(3)),
        under: Number((1 - overProb).toFixed(3)),
        line: line,
        expected_goals: Number(totalGoals.toFixed(1))
      };
    });
    
    return markets;
  },
  
  // 📊 PROBABILIDAD OVER
  calculateOverProbability(expectedGoals, line) {
    let probability = 0;
    // Sumar probabilidades de Poisson para valores > line
    for (let goals = Math.floor(line) + 1; goals <= 15; goals++) {
      probability += this.poissonProbability(expectedGoals, goals);
    }
    return Math.max(0.01, Math.min(0.99, probability));
  },
  
  // 🚩 GENERAR MERCADO CÓRNERS
  generateCornersMarket(homeStrength, awayStrength, league) {
    // 📊 CÓRNERS BASADOS EN FORTALEZA Y LIGA
    const baseCorners = {
      'Premier League': 10.5,
      'La Liga': 9.8,
      'Serie A': 9.2,
      'Bundesliga': 10.8,
      'Ligue 1': 9.5
    }[league] || 10.0;
    
    const homeCorners = baseCorners * 0.55 * (homeStrength / 0.5);
    const awayCorners = baseCorners * 0.45 * (awayStrength / 0.5);
    const totalCorners = homeCorners + awayCorners;
    
    return {
      total: Math.round(totalCorners * 10) / 10,
      home: Math.round(homeCorners * 10) / 10,
      away: Math.round(awayCorners * 10) / 10,
      over_8_5: this.calculateOverProbability(totalCorners, 8.5),
      over_9_5: this.calculateOverProbability(totalCorners, 9.5),
      over_10_5: this.calculateOverProbability(totalCorners, 10.5),
      over_11_5: this.calculateOverProbability(totalCorners, 11.5)
    };
  },
  
  // 🟨 GENERAR MERCADO TARJETAS
  generateCardsMarket(homeTeam, awayTeam, league) {
    // 📊 TARJETAS POR LIGA Y RIVALIDAD
    const baseCards = {
      'Premier League': 4.2,
      'La Liga': 5.1,
      'Serie A': 4.8,
      'Bundesliga': 4.0,
      'Ligue 1': 4.3
    }[league] || 4.5;
    
    const rivalryFactor = this.getRivalryFactor(homeTeam, awayTeam);
    const totalCards = baseCards * rivalryFactor;
    
    const yellowCards = totalCards * 0.85;
    const redCards = totalCards * 0.15;
    
    return {
      total: Number(totalCards.toFixed(1)),
      yellow: Number(yellowCards.toFixed(1)),
      red: Number(redCards.toFixed(2)),
      over_3_5: this.calculateOverProbability(totalCards, 3.5),
      over_4_5: this.calculateOverProbability(totalCards, 4.5),
      over_5_5: this.calculateOverProbability(totalCards, 5.5),
      home_cards: Number((totalCards * 0.52).toFixed(1)),
      away_cards: Number((totalCards * 0.48).toFixed(1))
    };
  },
  
  // ⚖️ GENERAR MERCADO HÁNDICAP
  generateHandicapMarket(homeWinProb, awayWinProb) {
    const lines = [-2.5, -1.5, -0.5, 0, +0.5, +1.5, +2.5];
    const handicaps = {};
    
    lines.forEach(line => {
      handicaps[line] = {
        home: this.calculateHandicapProbability(homeWinProb, line),
        away: this.calculateHandicapProbability(awayWinProb, -line),
        line: line
      };
    });
    
    return handicaps;
  },
  
  // 🎲 CALCULAR HÁNDICAP
  calculateHandicapProbability(baseProb, handicapLine) {
    const adjustment = handicapLine * 0.12;
    const newProb = baseProb + adjustment;
    return Number(Math.max(0.05, Math.min(0.95, newProb)).toFixed(3));
  },
  
  // 🔢 FUNCIÓN POISSON
  poissonProbability(lambda, k) {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
  },
  
  factorial(n) {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  },
  
  // 🔥 FACTOR DE RIVALIDAD
  getRivalryFactor(team1, team2) {
    const rivalries = [
      ['Real Madrid', 'Barcelona'], // El Clásico
      ['Real Madrid', 'Atletico Madrid'], // Derbi Madrileño
      ['Manchester United', 'Liverpool'], // North West Derby
      ['Manchester United', 'Manchester City'], // Derbi de Manchester
      ['Arsenal', 'Tottenham'], // North London Derby
      ['Chelsea', 'Arsenal'], // London Derby
      ['AC Milan', 'Inter'], // Derbi della Madonnina
      ['Juventus', 'AC Milan'], // Derby d'Italia
      ['Bayern Munich', 'Borussia Dortmund'], // Der Klassiker
      ['PSG', 'Marseille'] // Le Classique
    ];
    
    for (const rivalry of rivalries) {
      if (rivalry.includes(team1) && rivalry.includes(team2)) {
        return 1.4; // 40% más tarjetas en clásicos
      }
    }
    return 1.0;
  },
  
  // 🎯 CONFIANZA POR MERCADO
  getMarketConfidence(market, baseConfidence) {
    const adjustments = {
      '1x2': 1.0,
      'btts': 0.9,
      'over_under': 0.95,
      'corners': 0.8,
      'cards': 0.75,
      'handicap': 0.85
    };
    return Math.round(baseConfidence * (adjustments[market] || 0.8));
  },
  
  // 📝 ANÁLISIS DE EQUIPOS
  generateTeamAnalysis(team, probability, isHome) {
    const prob = Math.round(probability * 100);
    const homeText = isHome ? 'como local' : 'como visitante';
    
    if (prob > 60) {
      return `${team} tiene una alta probabilidad (${prob}%) de victoria jugando ${homeText}. Favorito claro del encuentro.`;
    } else if (prob > 40) {
      return `${team} tiene posibilidades moderadas (${prob}%) de ganar ${homeText}. Partido equilibrado.`;
    } else {
      return `${team} enfrentará dificultades (${prob}%) para ganar ${homeText}. Será el underdog.`;
    }
  },
  
  // 📊 ANÁLISIS GENERAL
  generateGeneralAnalysis(prediction, homeTeam, awayTeam) {
    const homeProb = Math.round(prediction.victoria_local * 100);
    const drawProb = Math.round(prediction.empate * 100);
    const awayProb = Math.round(prediction.victoria_visitante * 100);
    const totalGoals = prediction.goles_esperados_local + prediction.goles_esperados_visitante;
    
    let analysis = '';
    
    // Favorito
    if (homeProb > awayProb + 15) {
      analysis += `${homeTeam} parte como favorito con ${homeProb}% de probabilidades. `;
    } else if (awayProb > homeProb + 15) {
      analysis += `${awayTeam} es favorito a pesar de jugar fuera con ${awayProb}%. `;
    } else {
      analysis += `Partido muy equilibrado con ${drawProb}% de probabilidades de empate. `;
    }
    
    // Goles
    if (totalGoals > 3.0) {
      analysis += 'Se espera un partido ofensivo con muchos goles. ';
    } else if (totalGoals < 2.2) {
      analysis += 'Encuentro defensivo con pocos goles esperados. ';
    } else {
      analysis += 'Cantidad normal de goles prevista. ';
    }
    
    // Confianza
    const confidence = prediction.confidence;
    if (confidence >= 8) {
      analysis += 'Predicción de alta confianza basada en datos sólidos.';
    } else if (confidence >= 6) {
      analysis += 'Predicción moderadamente confiable.';
    } else {
      analysis += 'Resultado incierto, múltiples escenarios posibles.';
    }
    
    return analysis;
  },
  
  // 📝 ANÁLISIS BTTS
  getBTTSAnalysis(bttsProb) {
    const prob = Math.round(bttsProb * 100);
    if (prob > 70) return `Muy alta probabilidad (${prob}%) de que ambos equipos anoten. Defensas vulnerables o ataques letales.`;
    if (prob > 50) return `Probabilidad moderada-alta (${prob}%) de BTTS. Equilibrio entre ataque y defensa.`;
    if (prob > 30) return `Probabilidad moderada (${prob}%) de que ambos marquen. Dependerá del planteamiento táctico.`;
    return `Baja probabilidad (${prob}%) de BTTS. Se espera al menos una portería a cero.`;
  },
  
  // 📝 ANÁLISIS GOLES
  getGoalsAnalysis(totalGoals) {
    if (totalGoals > 3.5) return `Partido de alto scoring esperado (${totalGoals.toFixed(1)} goles). Ataques superiores a defensas.`;
    if (totalGoals > 2.8) return `Cantidad de goles por encima del promedio (${totalGoals.toFixed(1)}). Buen espectáculo ofensivo.`;
    if (totalGoals > 2.2) return `Goles dentro del promedio normal (${totalGoals.toFixed(1)}). Equilibrio ofensivo-defensivo.`;
    return `Partido con pocos goles esperado (${totalGoals.toFixed(1)}). Defensas sólidas o ataques débiles.`;
  },
  
  // 📝 ANÁLISIS CÓRNERS
  getCornersAnalysis(homeStrength, awayStrength) {
    if (homeStrength > awayStrength + 0.2) return "El equipo local dominará el partido, generando más córners por presión constante en campo rival.";
    if (awayStrength > homeStrength + 0.2) return "El visitante tendrá más posesión, forzando córners defensivos del equipo local.";
    return "Distribución equilibrada de córners esperada. Partido parejo en las bandas y ataques.";
  },
  
  // 📝 ANÁLISIS TARJETAS
  getCardsAnalysis(homeTeam, awayTeam) {
    const rivalryFactor = this.getRivalryFactor(homeTeam, awayTeam);
    if (rivalryFactor > 1.3) return "Clásico esperado con alta intensidad. La rivalidad histórica puede generar roces y tarjetas adicionales.";
    if (rivalryFactor > 1.1) return "Partido con cierta rivalidad. Se espera intensidad superior al promedio con más tarjetas.";
    return "Encuentro con intensidad normal. Tarjetas por faltas tácticas y juego físico estándar.";
  },
  
  // 📝 ANÁLISIS HÁNDICAP
  getHandicapAnalysis(homeWinProb, awayWinProb) {
    const diff = Math.abs(homeWinProb - awayWinProb);
    if (diff > 0.25) return "Clara diferencia de calidad entre equipos. El hándicap asiático ofrece valor en líneas altas.";
    if (diff > 0.15) return "Diferencia moderada de nivel. Hándicaps intermedios pueden ser interesantes.";
    return "Equipos muy parejos en calidad. Hándicaps cercanos a 0 son los más recomendables.";
  }
};

module.exports = predictionController;