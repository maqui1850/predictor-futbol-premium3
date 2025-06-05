// backend/models/simplePredictionModel.js
// 🤖 Modelo de predicción simple (fallback cuando ML no está disponible)

const teamStrengths = {
  // La Liga
  'Real Madrid': 0.92,
  'Barcelona': 0.90,
  'Atletico Madrid': 0.85,
  'Real Sociedad': 0.78,
  'Villarreal': 0.76,
  'Real Betis': 0.74,
  'Athletic Bilbao': 0.72,
  'Valencia': 0.70,
  'Sevilla': 0.75,
  'Girona': 0.68,
  
  // Premier League
  'Manchester City': 0.95,
  'Arsenal': 0.88,
  'Liverpool': 0.90,
  'Chelsea': 0.82,
  'Manchester United': 0.80,
  'Tottenham': 0.78,
  'Newcastle': 0.76,
  'Brighton': 0.72,
  'Aston Villa': 0.74,
  'West Ham': 0.70,
  
  // Serie A
  'Napoli': 0.85,
  'Inter': 0.88,
  'AC Milan': 0.86,
  'Juventus': 0.84,
  'Lazio': 0.78,
  'Roma': 0.76,
  'Atalanta': 0.80,
  'Fiorentina': 0.72,
  
  // Bundesliga
  'Bayern Munich': 0.92,
  'Borussia Dortmund': 0.85,
  'RB Leipzig': 0.82,
  'Union Berlin': 0.75,
  'Bayer Leverkusen': 0.78,
  'Eintracht Frankfurt': 0.74,
  'Wolfsburg': 0.72,
  
  // Ligue 1
  'PSG': 0.90,
  'Lens': 0.76,
  'Marseille': 0.78,
  'Monaco': 0.80,
  'Lille': 0.74,
  'Rennes': 0.72,
  'Nice': 0.70,
  'Lyon': 0.73
};

// 🏠 Ventaja de local por liga
const homeAdvantage = {
  'La Liga': 0.15,
  'Premier League': 0.12,
  'Serie A': 0.18,
  'Bundesliga': 0.14,
  'Ligue 1': 0.16,
  'Champions League': 0.10,
  'Europa League': 0.10
};

const simplePredictionModel = {
  predict(homeTeam, awayTeam, league = 'La Liga') {
    console.log(`🧮 Modelo Simple: ${homeTeam} vs ${awayTeam} (${league})`);
    
    // Obtener fuerzas de los equipos
    const homeStrength = this.getTeamStrength(homeTeam);
    const awayStrength = this.getTeamStrength(awayTeam);
    const homeAdv = homeAdvantage[league] || 0.15;
    
    // Calcular probabilidades base
    let homeProb = this.calculateWinProbability(homeStrength, awayStrength, homeAdv);
    let awayProb = this.calculateWinProbability(awayStrength, homeStrength, -homeAdv);
    let drawProb = this.calculateDrawProbability(homeStrength, awayStrength);
    
    // Normalizar para que sumen 1
    const total = homeProb + drawProb + awayProb;
    homeProb /= total;
    drawProb /= total;
    awayProb /= total;
    
    // Calcular goles esperados
    const homeGoals = this.calculateExpectedGoals(homeStrength, awayStrength, true);
    const awayGoals = this.calculateExpectedGoals(awayStrength, homeStrength, false);
    
    // Calcular confianza
    const confidence = this.calculateConfidence(homeStrength, awayStrength);
    
    const prediction = {
      victoria_local: homeProb,
      empate: drawProb,
      victoria_visitante: awayProb,
      goles_esperados_local: homeGoals,
      goles_esperados_visitante: awayGoals,
      confidence: confidence,
      analisis: {
        local: this.getTeamAnalysis(homeTeam, homeStrength, true),
        visitante: this.getTeamAnalysis(awayTeam, awayStrength, false),
        general: this.getGeneralAnalysis(homeProb, drawProb, awayProb)
      }
    };
    
    console.log('✅ Predicción simple generada:', {
      home: `${(homeProb * 100).toFixed(1)}%`,
      draw: `${(drawProb * 100).toFixed(1)}%`,
      away: `${(awayProb * 100).toFixed(1)}%`,
      goals: `${homeGoals.toFixed(1)} - ${awayGoals.toFixed(1)}`
    });
    
    return prediction;
  },
  
  getTeamStrength(teamName) {
    // Buscar fuerza exacta
    if (teamStrengths[teamName]) {
      return teamStrengths[teamName];
    }
    
    // Buscar parcial (case insensitive)
    const normalizedName = teamName.toLowerCase();
    for (const [team, strength] of Object.entries(teamStrengths)) {
      if (team.toLowerCase().includes(normalizedName) || 
          normalizedName.includes(team.toLowerCase())) {
        return strength;
      }
    }
    
    // Fuerza por defecto
    console.warn(`⚠️ Equipo no encontrado: ${teamName}, usando fuerza por defecto`);
    return 0.65;
  },
  
  calculateWinProbability(teamStrength, opponentStrength, homeAdvantage) {
    const strengthDiff = teamStrength - opponentStrength + homeAdvantage;
    // Función logística para convertir diferencia en probabilidad
    return 1 / (1 + Math.exp(-4 * strengthDiff));
  },
  
  calculateDrawProbability(homeStrength, awayStrength) {
    // Más empates cuando los equipos están equilibrados
    const difference = Math.abs(homeStrength - awayStrength);
    const baseDrawProb = 0.28;
    return baseDrawProb + (0.15 * Math.exp(-3 * difference));
  },
  
  calculateExpectedGoals(teamStrength, opponentStrength, isHome) {
    const baseGoals = 1.4;
    const strengthFactor = teamStrength / opponentStrength;
    const homeBonus = isHome ? 0.2 : 0;
    
    return Math.max(0.3, baseGoals * strengthFactor + homeBonus);
  },
  
  calculateConfidence(homeStrength, awayStrength) {
    // Mayor confianza cuando conocemos bien los equipos
    const homeKnown = teamStrengths[homeStrength] ? 1 : 0.6;
    const awayKnown = teamStrengths[awayStrength] ? 1 : 0.6;
    const baseConfidence = 6;
    
    return Math.round(baseConfidence * ((homeKnown + awayKnown) / 2));
  },
  
  getTeamAnalysis(teamName, strength, isHome) {
    const strengthLevel = this.getStrengthLevel(strength);
    const position = isHome ? 'local' : 'visitante';
    
    const analyses = {
      high: [
        `${teamName} es un equipo de élite con un rendimiento sobresaliente.`,
        `Equipo de primer nivel con estadísticas superiores en todas las áreas.`,
        `${teamName} cuenta con jugadores de clase mundial y gran experiencia.`
      ],
      medium: [
        `${teamName} es un equipo sólido con buen rendimiento general.`,
        `Equipo competitivo que puede plantear batalla a cualquier rival.`,
        `${teamName} tiene un plantel equilibrado y buena organización.`
      ],
      low: [
        `${teamName} enfrenta dificultades pero puede dar sorpresas.`,
        `Equipo en proceso de mejora que luchará por los tres puntos.`,
        `${teamName} necesitará dar su mejor versión para competir.`
      ]
    };
    
    const levelAnalyses = analyses[strengthLevel];
    return levelAnalyses[Math.floor(Math.random() * levelAnalyses.length)];
  },
  
  getGeneralAnalysis(homeProb, drawProb, awayProb) {
    if (homeProb > 0.6) {
      return "Clara ventaja para el equipo local basada en estadísticas históricas y forma actual.";
    } else if (awayProb > 0.6) {
      return "El equipo visitante parte como favorito a pesar de jugar fuera de casa.";
    } else if (drawProb > 0.35) {
      return "Partido muy equilibrado con altas probabilidades de empate. Cualquier resultado es posible.";
    } else {
      return "Encuentro competitivo con ligera ventaja para el equipo que juega en casa.";
    }
  },
  
  getStrengthLevel(strength) {
    if (strength >= 0.85) return 'high';
    if (strength >= 0.70) return 'medium';
    return 'low';
  }
};

module.exports = simplePredictionModel;