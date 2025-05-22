// Modelo de predicción simplificado para Node.js
class SimplePredictionModel {
  constructor() {
    this.teamStats = {
      // Datos simplificados para los equipos de La Liga
      "Real Madrid": { strength: 0.85, form: 0.82, homeAdvantage: 0.12 },
      "Barcelona": { strength: 0.83, form: 0.78, homeAdvantage: 0.11 },
      "Atlético Madrid": { strength: 0.78, form: 0.75, homeAdvantage: 0.10 },
      "Sevilla": { strength: 0.72, form: 0.68, homeAdvantage: 0.09 },
      "Valencia": { strength: 0.68, form: 0.65, homeAdvantage: 0.09 },
      // Añadir más equipos si es necesario
    };
  }
  
  predict(homeTeam, awayTeam) {
    // Obtener estadísticas de los equipos o usar valores predeterminados
    const homeStats = this.teamStats[homeTeam] || { strength: 0.7, form: 0.7, homeAdvantage: 0.1 };
    const awayStats = this.teamStats[awayTeam] || { strength: 0.7, form: 0.7, homeAdvantage: 0 };
    
    // Calcular probabilidades basadas en las estadísticas
    const homeStrength = homeStats.strength + homeStats.homeAdvantage;
    const awayStrength = awayStats.strength;
    const totalStrength = homeStrength + awayStrength;
    
    // Ajustar con la forma actual de los equipos
    const formFactor = 0.2;
    const homeFormAdjust = homeStats.form * formFactor;
    const awayFormAdjust = awayStats.form * formFactor;
    
    // Calcular probabilidades finales
    let homeWinProb = (homeStrength / totalStrength) * (1 + homeFormAdjust - awayFormAdjust);
    let awayWinProb = (awayStrength / totalStrength) * (1 - homeFormAdjust + awayFormAdjust);
    
    // Normalizar para que sumen menos de 1 (dejar espacio para el empate)
    const scaleFactor = 0.8;
    homeWinProb *= scaleFactor;
    awayWinProb *= scaleFactor;
    
    // Calcular probabilidad de empate
    const drawProb = 1 - homeWinProb - awayWinProb;
    
    // Generar predicciones adicionales
    const goalsHomeAvg = 1.5 * homeStats.strength;
    const goalsAwayAvg = 1.3 * awayStats.strength;
    
    // Devolver el resultado
    return {
      victoria_local: parseFloat(homeWinProb.toFixed(2)),
      empate: parseFloat(drawProb.toFixed(2)),
      victoria_visitante: parseFloat(awayWinProb.toFixed(2)),
      goles_esperados_local: parseFloat(goalsHomeAvg.toFixed(1)),
      goles_esperados_visitante: parseFloat(goalsAwayAvg.toFixed(1)),
      mercados_adicionales: {
        ambos_equipos_marcan: parseFloat((0.5 + (goalsHomeAvg * goalsAwayAvg * 0.2)).toFixed(2)),
        mas_2_5_goles: parseFloat((0.5 + ((goalsHomeAvg + goalsAwayAvg - 2.5) * 0.3)).toFixed(2)),
        handicap_local: -1,
        prob_handicap_local: parseFloat((homeWinProb * 1.2).toFixed(2))
      },
      timestamp: new Date().toISOString(),
      equipo_local: homeTeam,
      equipo_visitante: awayTeam,
      confianza: "media"
    };
  }
}

module.exports = new SimplePredictionModel();