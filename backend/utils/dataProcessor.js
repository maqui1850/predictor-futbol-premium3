// backend/utils/dataProcessor.js

/**
 * Utilidades para procesar y normalizar datos de diferentes fuentes
 */
const dataProcessor = {
  /**
   * Normaliza datos de partidos desde API-Football
   * @param {Array} apiFixtures - Datos de partidos desde API
   * @returns {Array} - Partidos normalizados
   */
  normalizeFixtures(apiFixtures) {
    if (!apiFixtures || !Array.isArray(apiFixtures)) {
      return [];
    }
    
    return apiFixtures.map(fixture => {
      return {
        id: fixture.fixture.id,
        date: fixture.fixture.date,
        timestamp: fixture.fixture.timestamp,
        venue: fixture.fixture.venue?.name || 'Desconocido',
        status: this.normalizeMatchStatus(fixture.fixture.status?.short),
        league: {
          id: fixture.league.id,
          name: fixture.league.name,
          country: fixture.league.country,
          logo: fixture.league.logo
        },
        teams: {
          home: {
            id: fixture.teams.home.id,
            name: fixture.teams.home.name,
            logo: fixture.teams.home.logo,
            winner: fixture.teams.home.winner
          },
          away: {
            id: fixture.teams.away.id,
            name: fixture.teams.away.name,
            logo: fixture.teams.away.logo,
            winner: fixture.teams.away.winner
          }
        },
        goals: fixture.goals || { home: null, away: null },
        score: fixture.score || {}
      };
    });
  },
  
  /**
   * Normaliza datos de equipos desde API-Football
   * @param {Array} apiTeams - Datos de equipos desde API
   * @returns {Array} - Equipos normalizados
   */
  normalizeTeams(apiTeams) {
    if (!apiTeams || !Array.isArray(apiTeams)) {
      return [];
    }
    
    return apiTeams.map(team => {
      return {
        id: team.team.id,
        name: team.team.name,
        code: team.team.code,
        country: team.team.country,
        founded: team.team.founded,
        logo: team.team.logo,
        venue: team.venue ? {
          id: team.venue.id,
          name: team.venue.name,
          address: team.venue.address,
          city: team.venue.city,
          capacity: team.venue.capacity,
          surface: team.venue.surface,
          image: team.venue.image
        } : null
      };
    });
  },
  
  /**
   * Normaliza estadísticas de equipos para su uso en predicciones
   * @param {object} apiTeamStats - Estadísticas del equipo desde API
   * @returns {object} - Estadísticas normalizadas
   */
  normalizeTeamStats(apiTeamStats) {
    if (!apiTeamStats || !apiTeamStats.response) {
      return {};
    }
    
    const stats = apiTeamStats.response;
    
    // Calcular métricas derivadas para el equipo
    const fixtures = stats.fixtures || {};
    const goals = stats.goals || {};
    
    // Estadísticas de partidos
    const total = fixtures.played?.total || 0;
    const wins = fixtures.wins?.total || 0;
    const draws = fixtures.draws?.total || 0;
    const losses = fixtures.losses?.total || 0;
    
    // Estadísticas de goles
    const goalsFor = {
      total: goals.for?.total?.total || 0,
      average: goals.for?.average?.total || 0,
      minute: goals.for?.minute || {}
    };
    
    const goalsAgainst = {
      total: goals.against?.total?.total || 0,
      average: goals.against?.average?.total || 0,
      minute: goals.against?.minute || {}
    };
    
    // Estadísticas específicas de local/visitante
    const homeStats = {
      played: fixtures.played?.home || 0,
      wins: fixtures.wins?.home || 0,
      draws: fixtures.draws?.home || 0,
      losses: fixtures.losses?.home || 0,
      goalsFor: goals.for?.total?.home || 0,
      goalsAgainst: goals.against?.total?.home || 0
    };
    
    const awayStats = {
      played: fixtures.played?.away || 0,
      wins: fixtures.wins?.away || 0,
      draws: fixtures.draws?.away || 0,
      losses: fixtures.losses?.away || 0,
      goalsFor: goals.for?.total?.away || 0,
      goalsAgainst: goals.against?.total?.away || 0
    };
    
    // Calcular fortaleza en casa y fuera (0-1)
    const homeStrength = homeStats.played > 0 ? 
      (homeStats.wins * 3 + homeStats.draws) / (homeStats.played * 3) : 0.5;
    
    const awayStrength = awayStats.played > 0 ? 
      (awayStats.wins * 3 + awayStats.draws) / (awayStats.played * 3) : 0.5;
    
    // Calcular índice de forma (0-1) basado en últimos partidos
    const form = this.calculateFormIndex(stats.form);
    
    // Portería a cero (clean sheets)
    const cleanSheets = stats.clean_sheet?.total || 0;
    
    // Extraer datos de córners si existen
    const corners = stats.corners ? {
      for: this.extractCornerStats(stats.corners.for),
      against: this.extractCornerStats(stats.corners.against)
    } : null;
    
    // Extraer datos de tarjetas si existen
    const cards = stats.cards ? {
      yellow: this.calculateTotalCards(stats.cards.yellow),
      red: this.calculateTotalCards(stats.cards.red)
    } : null;
    
    return {
      team: {
        id: stats.team.id,
        name: stats.team.name,
        logo: stats.team.logo
      },
      league: {
        id: stats.league.id,
        name: stats.league.name,
        country: stats.league.country,
        season: stats.league.season
      },
      matches: total,
      wins,
      draws,
      losses,
      points: wins * 3 + draws,
      pointsPerMatch: total > 0 ? (wins * 3 + draws) / total : 0,
      goalsFor: goalsFor.total,
      goalsAgainst: goalsAgainst.total,
      goalDifference: goalsFor.total - goalsAgainst.total,
      avgGoalsScored: goalsFor.average,
      avgGoalsConceded: goalsAgainst.average,
      home: homeStats,
      away: awayStats,
      homeStrength,
      awayStrength,
      cleanSheets,
      form,
      corners,
      cards
    };
  },
  
  /**
   * Normaliza datos de partidos desde web scraping
   * @param {Array} scrapedMatches - Datos de partidos obtenidos por scraping
   * @returns {Array} - Partidos normalizados
   */
  normalizeScrapedMatches(scrapedMatches) {
    if (!scrapedMatches || !Array.isArray(scrapedMatches)) {
      return [];
    }
    
    return scrapedMatches.map(match => {
      // Extraer información de la hora (convertir a timestamp)
      const timeInfo = match.time;
      let timestamp = null;
      let status = 'Not Started';
      
      if (timeInfo === 'FT') {
        status = 'Match Finished';
      } else if (timeInfo === 'HT') {
        status = 'Halftime';
      } else if (timeInfo.includes("'")) {
        status = 'In Play';
      } else {
        // Intentar convertir la hora a timestamp
        const [hours, minutes] = timeInfo.split(':').map(t => parseInt(t));
        if (!isNaN(hours) && !isNaN(minutes)) {
          const dateObj = new Date();
          dateObj.setHours(hours, minutes, 0, 0);
          timestamp = Math.floor(dateObj.getTime() / 1000);
        }
      }
      
      // Extraer resultado si existe
      let homeGoals = null;
      let awayGoals = null;
      
      if (match.score) {
        const scores = match.score.split('-');
        homeGoals = parseInt(scores[0]);
        awayGoals = parseInt(scores[1]);
      }
      
      return {
        id: `scraped_${match.homeTeam}_${match.awayTeam}`.replace(/\s+/g, '_'),
        date: new Date().toISOString().split('T')[0],
        timestamp,
        status,
        tournament: match.tournament,
        teams: {
          home: {
            id: null,
            name: match.homeTeam,
            logo: null
          },
          away: {
            id: null,
            name: match.awayTeam,
            logo: null
          }
        },
        goals: {
          home: homeGoals,
          away: awayGoals
        },
        source: match.source
      };
    });
  },
  
  /**
   * Combina datos de varias fuentes priorizando la información más completa
   * @param {Array} apiData - Datos normalizados de API
   * @param {Array} scrapedData - Datos normalizados de scraping
   * @returns {Array} - Datos combinados
   */
  combineDataSources(apiData, scrapedData) {
    if (!apiData || !Array.isArray(apiData)) {
      return scrapedData || [];
    }
    
    if (!scrapedData || !Array.isArray(scrapedData)) {
      return apiData;
    }
    
    // Primero incluimos todos los datos de la API
    const combined = [...apiData];
    
    // Mapa para verificar qué partidos ya están incluidos (por equipos)
    const existingMatches = new Map();
    apiData.forEach(match => {
      const key = `${match.teams.home.name}_${match.teams.away.name}`.toLowerCase();
      existingMatches.set(key, true);
    });
    
    // Añadir partidos de scraping que no estén ya incluidos
    scrapedData.forEach(match => {
      const key = `${match.teams.home.name}_${match.teams.away.name}`.toLowerCase();
      if (!existingMatches.has(key)) {
        combined.push(match);
      }
    });
    
    return combined;
  },
  
  /**
   * Normaliza el estado del partido a un formato consistente
   * @param {string} apiStatus - Estado del partido según API
   * @returns {string} - Estado normalizado
   */
  normalizeMatchStatus(apiStatus) {
    const statusMap = {
      'NS': 'Not Started',
      'TBD': 'To Be Determined',
      '1H': 'First Half',
      'HT': 'Halftime',
      '2H': 'Second Half',
      'ET': 'Extra Time',
      'P': 'Penalty Shootout',
      'FT': 'Match Finished',
      'AET': 'Match Finished After Extra Time',
      'PEN': 'Match Finished After Penalties',
      'BT': 'Break Time',
      'SUSP': 'Match Suspended',
      'INT': 'Match Interrupted',
      'PST': 'Match Postponed',
      'CANC': 'Match Cancelled',
      'ABD': 'Match Abandoned',
      'AWD': 'Technical Loss',
      'WO': 'Walk Over'
    };
    
    return statusMap[apiStatus] || apiStatus || 'Unknown';
  },
  
  /**
   * Calcula índice de forma basado en los últimos resultados
   * @param {string} formString - String de forma (W, D, L)
   * @returns {number} - Índice de forma (0-1)
   */
  calculateFormIndex(formString) {
    if (!formString) return 0.5;
    
    // Invertimos para que los partidos más recientes tengan más peso
    const formArray = formString.split('').reverse();
    let totalWeight = 0;
    let weightedPoints = 0;
    
    formArray.forEach((result, index) => {
      // Peso decreciente (más peso a los más recientes)
      const weight = Math.pow(0.85, index);
      totalWeight += weight;
      
      if (result === 'W') {
        weightedPoints += 3 * weight;
      } else if (result === 'D') {
        weightedPoints += 1 * weight;
      }
    });
    
    // Normalizar a un valor entre 0 y 1
    return totalWeight > 0 ? 
      weightedPoints / (totalWeight * 3) : 0.5;
  },
  
  /**
   * Extrae estadísticas de córners normalizadas
   * @param {object} cornersData - Datos de córners de la API
   * @returns {object} - Estadísticas normalizadas
   */
  extractCornerStats(cornersData) {
    if (!cornersData) return { total: 0, average: 0 };
    
    const total = cornersData.total?.total || 0;
    const average = cornersData.average?.total || 0;
    
    return { total, average };
  },
  
  /**
   * Calcula total de tarjetas
   * @param {object} cardsData - Datos de tarjetas de la API
   * @returns {number} - Total de tarjetas
   */
  calculateTotalCards(cardsData) {
    if (!cardsData) return 0;
    
    // Sumar todas las tarjetas por minuto/período
    let total = 0;
    
    // 0-15, 16-30, 31-45, 46-60, 61-75, 76-90, 91-105, 106-120
    const periods = ['0-15', '16-30', '31-45', '46-60', '61-75', '76-90', '91-105', '106-120'];
    
    periods.forEach(period => {
      if (cardsData[period]) {
        total += cardsData[period].total || 0;
      }
    });
    
    return total;
  }
};

module.exports = dataProcessor;
