// backend/utils/dataProcessor.js

/**
 * Utilidades para procesar y normalizar datos de fútbol
 */
class DataProcessor {
  /**
   * Normaliza datos de equipos desde diferentes fuentes
   * @param {Array} teamsData - Datos crudos de equipos
   * @returns {Array} - Equipos normalizados
   */
  static normalizeTeams(teamsData) {
    if (!Array.isArray(teamsData)) {
      return [];
    }

    return teamsData.map(team => ({
      id: team.id || team.team?.id,
      name: team.name || team.team?.name,
      logo: team.logo || team.team?.logo || '',
      country: team.country || team.team?.country || '',
      founded: team.founded || team.team?.founded || null,
      venue: team.venue || team.team?.venue || null,
      league: {
        id: team.league?.id || null,
        name: team.league?.name || ''
      }
    }));
  }

  /**
   * Normaliza estadísticas de equipos
   * @param {Object} statsData - Datos crudos de estadísticas
   * @returns {Object} - Estadísticas normalizadas
   */
  static normalizeTeamStats(statsData) {
    if (!statsData || !statsData.response) {
      return this.getDefaultTeamStats();
    }

    const stats = statsData.response;
    
    return {
      fixtures: {
        played: stats.fixtures?.played?.total || 0,
        wins: stats.fixtures?.wins?.total || 0,
        draws: stats.fixtures?.draws?.total || 0,
        losses: stats.fixtures?.loses?.total || 0,
        home: {
          played: stats.fixtures?.played?.home || 0,
          wins: stats.fixtures?.wins?.home || 0,
          draws: stats.fixtures?.draws?.home || 0,
          losses: stats.fixtures?.loses?.home || 0
        },
        away: {
          played: stats.fixtures?.played?.away || 0,
          wins: stats.fixtures?.wins?.away || 0,
          draws: stats.fixtures?.draws?.away || 0,
          losses: stats.fixtures?.loses?.away || 0
        }
      },
      goals: {
        for: {
          total: stats.goals?.for?.total || 0,
          average: stats.goals?.for?.average || 0,
          home: stats.goals?.for?.total?.home || 0,
          away: stats.goals?.for?.total?.away || 0
        },
        against: {
          total: stats.goals?.against?.total || 0,
          average: stats.goals?.against?.average || 0,
          home: stats.goals?.against?.total?.home || 0,
          away: stats.goals?.against?.total?.away || 0
        }
      },
      cleanSheets: {
        total: stats.clean_sheet?.total || 0,
        home: stats.clean_sheet?.home || 0,
        away: stats.clean_sheet?.away || 0
      },
      form: stats.form || '',
      penalty: {
        scored: stats.penalty?.scored || {},
        missed: stats.penalty?.missed || {}
      }
    };
  }

  /**
   * Procesa datos de partidos
   * @param {Object} matchData - Datos crudos del partido
   * @returns {Object} - Datos del partido procesados
   */
  static processMatchData(matchData) {
    if (!matchData) {
      return null;
    }

    return {
      id: matchData.fixture?.id || matchData.id,
      date: matchData.fixture?.date || matchData.date,
      status: {
        long: matchData.fixture?.status?.long || 'Not Started',
        short: matchData.fixture?.status?.short || 'NS',
        elapsed: matchData.fixture?.status?.elapsed || null
      },
      venue: {
        name: matchData.fixture?.venue?.name || '',
        city: matchData.fixture?.venue?.city || ''
      },
      teams: {
        home: {
          id: matchData.teams?.home?.id,
          name: matchData.teams?.home?.name,
          logo: matchData.teams?.home?.logo || '',
          winner: matchData.teams?.home?.winner || null
        },
        away: {
          id: matchData.teams?.away?.id,
          name: matchData.teams?.away?.name,
          logo: matchData.teams?.away?.logo || '',
          winner: matchData.teams?.away?.winner || null
        }
      },
      goals: {
        home: matchData.goals?.home || null,
        away: matchData.goals?.away || null
      },
      score: {
        halftime: {
          home: matchData.score?.halftime?.home || null,
          away: matchData.score?.halftime?.away || null
        },
        fulltime: {
          home: matchData.score?.fulltime?.home || null,
          away: matchData.score?.fulltime?.away || null
        },
        extratime: {
          home: matchData.score?.extratime?.home || null,
          away: matchData.score?.extratime?.away || null
        },
        penalty: {
          home: matchData.score?.penalty?.home || null,
          away: matchData.score?.penalty?.away || null
        }
      },
      league: {
        id: matchData.league?.id,
        name: matchData.league?.name,
        country: matchData.league?.country,
        logo: matchData.league?.logo || '',
        flag: matchData.league?.flag || '',
        season: matchData.league?.season || new Date().getFullYear()
      }
    };
  }

  /**
   * Normaliza estadísticas de un partido
   * @param {Array} statsData - Datos de estadísticas
   * @returns {Object} - Estadísticas normalizadas
   */
  static normalizeMatchStats(statsData) {
    if (!Array.isArray(statsData) || statsData.length === 0) {
      return this.getDefaultMatchStats();
    }

    const homeStats = statsData[0]?.statistics || [];
    const awayStats = statsData[1]?.statistics || [];

    const normalizeTeamStats = (stats) => {
      const result = {};
      stats.forEach(stat => {
        const key = this.normalizeStatKey(stat.type);
        result[key] = this.parseStatValue(stat.value);
      });
      return result;
    };

    return {
      home: {
        ...normalizeTeamStats(homeStats),
        teamName: statsData[0]?.team?.name || 'Home Team'
      },
      away: {
        ...normalizeTeamStats(awayStats),
        teamName: statsData[1]?.team?.name || 'Away Team'
      }
    };
  }

  /**
   * Procesa datos de Head-to-Head
   * @param {Array} h2hData - Datos de enfrentamientos directos
   * @returns {Object} - Datos H2H procesados
   */
  static processH2HData(h2hData) {
    if (!Array.isArray(h2hData) || h2hData.length === 0) {
      return this.getDefaultH2H();
    }

    const matches = h2hData.map(match => this.processMatchData(match));
    
    // Calcular estadísticas
    const team1Name = matches[0]?.teams?.home?.name || 'Team 1';
    const team2Name = matches[0]?.teams?.away?.name || 'Team 2';
    
    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;
    let totalGoals = 0;

    matches.forEach(match => {
      totalGoals += (match.goals.home || 0) + (match.goals.away || 0);
      
      if (match.goals.home > match.goals.away) {
        if (match.teams.home.name === team1Name) team1Wins++;
        else team2Wins++;
      } else if (match.goals.away > match.goals.home) {
        if (match.teams.away.name === team1Name) team1Wins++;
        else team2Wins++;
      } else {
        draws++;
      }
    });

    return {
      totalMatches: matches.length,
      team1: {
        name: team1Name,
        wins: team1Wins,
        winPercentage: matches.length > 0 ? (team1Wins / matches.length * 100).toFixed(1) : 0
      },
      team2: {
        name: team2Name,
        wins: team2Wins,
        winPercentage: matches.length > 0 ? (team2Wins / matches.length * 100).toFixed(1) : 0
      },
      draws: draws,
      drawPercentage: matches.length > 0 ? (draws / matches.length * 100).toFixed(1) : 0,
      avgGoalsPerMatch: matches.length > 0 ? (totalGoals / matches.length).toFixed(2) : 0,
      lastMatches: matches.slice(0, 5),
      matches: matches
    };
  }

  /**
   * Normaliza clave de estadística
   * @param {string} statType - Tipo de estadística
   * @returns {string} - Clave normalizada
   */
  static normalizeStatKey(statType) {
    const keyMap = {
      'Shots on Goal': 'shotsOnTarget',
      'Shots off Goal': 'shotsOffTarget',
      'Total Shots': 'totalShots',
      'Blocked Shots': 'blockedShots',
      'Shots insidebox': 'shotsInsideBox',
      'Shots outsidebox': 'shotsOutsideBox',
      'Fouls': 'fouls',
      'Corner Kicks': 'corners',
      'Offsides': 'offsides',
      'Ball Possession': 'possession',
      'Yellow Cards': 'yellowCards',
      'Red Cards': 'redCards',
      'Goalkeeper Saves': 'saves',
      'Total passes': 'totalPasses',
      'Passes accurate': 'passesAccurate',
      'Passes %': 'passAccuracy'
    };

    return keyMap[statType] || statType.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Parsea valor de estadística
   * @param {any} value - Valor a parsear
   * @returns {number|string} - Valor parseado
   */
  static parseStatValue(value) {
    if (typeof value === 'string') {
      // Si es porcentaje, devolver como string
      if (value.includes('%')) {
        return value;
      }
      // Si es número, convertir a número
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  }

  /**
   * Calcula forma de equipo basada en resultados recientes
   * @param {Array} matches - Partidos recientes
   * @param {string} teamName - Nombre del equipo
   * @returns {string} - Forma del equipo (ej: "WWDLW")
   */
  static calculateTeamForm(matches, teamName) {
    if (!Array.isArray(matches) || matches.length === 0) {
      return 'NNNNN';
    }

    return matches.slice(0, 5).map(match => {
      const isHome = match.teams.home.name === teamName;
      const homeGoals = match.goals.home || 0;
      const awayGoals = match.goals.away || 0;

      if (homeGoals > awayGoals) {
        return isHome ? 'W' : 'L';
      } else if (awayGoals > homeGoals) {
        return isHome ? 'L' : 'W';
      } else {
        return 'D';
      }
    }).join('');
  }

  /**
   * Estadísticas por defecto para equipos
   */
  static getDefaultTeamStats() {
    return {
      fixtures: {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        home: { played: 0, wins: 0, draws: 0, losses: 0 },
        away: { played: 0, wins: 0, draws: 0, losses: 0 }
      },
      goals: {
        for: { total: 0, average: 0, home: 0, away: 0 },
        against: { total: 0, average: 0, home: 0, away: 0 }
      },
      cleanSheets: { total: 0, home: 0, away: 0 },
      form: '',
      penalty: { scored: {}, missed: {} }
    };
  }

  /**
   * Estadísticas por defecto para partidos
   */
  static getDefaultMatchStats() {
    return {
      home: {
        shotsOnTarget: 0,
        totalShots: 0,
        possession: '50%',
        corners: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        teamName: 'Home Team'
      },
      away: {
        shotsOnTarget: 0,
        totalShots: 0,
        possession: '50%',
        corners: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        teamName: 'Away Team'
      }
    };
  }

  /**
   * Datos H2H por defecto
   */
  static getDefaultH2H() {
    return {
      totalMatches: 0,
      team1: { name: 'Team 1', wins: 0, winPercentage: 0 },
      team2: { name: 'Team 2', wins: 0, winPercentage: 0 },
      draws: 0,
      drawPercentage: 0,
      avgGoalsPerMatch: 0,
      lastMatches: [],
      matches: []
    };
  }

  /**
   * Valida y limpia datos de entrada
   * @param {any} data - Datos a validar
   * @returns {boolean} - True si los datos son válidos
   */
  static validateData(data) {
    return data !== null && data !== undefined && 
           (typeof data === 'object' || Array.isArray(data));
  }

  /**
   * Combina múltiples fuentes de datos
   * @param {Array} dataSources - Array de fuentes de datos
   * @returns {Object} - Datos combinados
   */
  static combineDataSources(dataSources) {
    if (!Array.isArray(dataSources) || dataSources.length === 0) {
      return {};
    }

    // Comenzar con la primera fuente válida
    let combined = {};
    dataSources.forEach(source => {
      if (this.validateData(source)) {
        combined = { ...combined, ...source };
      }
    });

    return combined;
  }

  /**
   * Calcula métricas avanzadas
   * @param {Object} teamStats - Estadísticas del equipo
   * @returns {Object} - Métricas calculadas
   */
  static calculateAdvancedMetrics(teamStats) {
    const stats = teamStats.fixtures;
    const goals = teamStats.goals;
    
    if (!stats || stats.played === 0) {
      return {};
    }

    return {
      winRate: ((stats.wins / stats.played) * 100).toFixed(1),
      drawRate: ((stats.draws / stats.played) * 100).toFixed(1),
      lossRate: ((stats.losses / stats.played) * 100).toFixed(1),
      goalsPerGame: (goals.for.total / stats.played).toFixed(2),
      goalsConcededPerGame: (goals.against.total / stats.played).toFixed(2),
      goalDifference: goals.for.total - goals.against.total,
      cleanSheetRate: ((teamStats.cleanSheets.total / stats.played) * 100).toFixed(1),
      homeWinRate: stats.home.played > 0 ? ((stats.home.wins / stats.home.played) * 100).toFixed(1) : 0,
      awayWinRate: stats.away.played > 0 ? ((stats.away.wins / stats.away.played) * 100).toFixed(1) : 0
    };
  }
}

module.exports = DataProcessor;