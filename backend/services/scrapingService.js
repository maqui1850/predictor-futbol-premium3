// backend/services/webScrapingService.js
const axios = require('axios');
const cheerio = require('cheerio');
const cache = require('../utils/cache');

class WebScrapingService {
  constructor() {
    this.sources = {
      sofascore: 'https://www.sofascore.com',
      flashscore: 'https://www.flashscore.com',
      whoscored: 'https://www.whoscored.com',
      soccerway: 'https://www.soccerway.com',
      futbol24: 'https://www.futbol24.com'
    };
    
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
  }

  /**
   * Obtiene estadísticas de un equipo desde múltiples fuentes
   */
  async getTeamStats(teamName, options = {}) {
    const cacheKey = `team_stats:${teamName}:${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Intentar múltiples fuentes
      const stats = await this.scrapeMultipleSources(teamName, options);
      
      // Combinar y normalizar datos
      const combinedStats = this.combineStats(stats);
      
      // Guardar en caché por 1 hora
      cache.set(cacheKey, combinedStats, 3600);
      
      return combinedStats;
    } catch (error) {
      console.error('Error scraping team stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Obtiene estadísticas head-to-head entre dos equipos
   */
  async getH2HStats(team1, team2) {
    const cacheKey = `h2h:${team1}:${team2}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Buscar en SofaScore (ejemplo)
      const h2hData = await this.scrapeSofaScoreH2H(team1, team2);
      
      // Procesar datos
      const processed = {
        totalMatches: h2hData.matches.length,
        team1Wins: h2hData.matches.filter(m => m.winner === team1).length,
        team2Wins: h2hData.matches.filter(m => m.winner === team2).length,
        draws: h2hData.matches.filter(m => m.winner === 'draw').length,
        avgGoals: this.calculateAvgGoals(h2hData.matches),
        lastMatches: h2hData.matches.slice(0, 5),
        form: this.calculateForm(h2hData.matches, team1, team2)
      };
      
      cache.set(cacheKey, processed, 3600);
      return processed;
    } catch (error) {
      console.error('Error scraping H2H:', error);
      return this.getDefaultH2H();
    }
  }

  /**
   * Obtiene estadísticas de forma reciente de un equipo
   */
  async getTeamForm(teamName, matches = 5) {
    const cacheKey = `form:${teamName}:${matches}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Scraping de Flashscore
      const url = `${this.sources.flashscore}/team/${this.normalizeTeamName(teamName)}/`;
      const response = await this.makeRequest(url);
      const $ = cheerio.load(response.data);
      
      const form = [];
      $('.event__match').slice(0, matches).each((i, el) => {
        const home = $(el).find('.event__participant--home').text().trim();
        const away = $(el).find('.event__participant--away').text().trim();
        const scoreHome = parseInt($(el).find('.event__score--home').text()) || 0;
        const scoreAway = parseInt($(el).find('.event__score--away').text()) || 0;
        
        const isHome = home.includes(teamName);
        let result;
        
        if (scoreHome > scoreAway) {
          result = isHome ? 'W' : 'L';
        } else if (scoreHome < scoreAway) {
          result = isHome ? 'L' : 'W';
        } else {
          result = 'D';
        }
        
        form.push({
          opponent: isHome ? away : home,
          result,
          goalsFor: isHome ? scoreHome : scoreAway,
          goalsAgainst: isHome ? scoreAway : scoreHome,
          isHome
        });
      });
      
      const formData = {
        matches: form,
        wins: form.filter(m => m.result === 'W').length,
        draws: form.filter(m => m.result === 'D').length,
        losses: form.filter(m => m.result === 'L').length,
        goalsScored: form.reduce((sum, m) => sum + m.goalsFor, 0),
        goalsConceded: form.reduce((sum, m) => sum + m.goalsAgainst, 0),
        cleanSheets: form.filter(m => m.goalsAgainst === 0).length,
        formString: form.map(m => m.result).join('')
      };
      
      cache.set(cacheKey, formData, 1800); // 30 minutos
      return formData;
    } catch (error) {
      console.error('Error scraping form:', error);
      return this.getDefaultForm();
    }
  }

  /**
   * Obtiene estadísticas avanzadas de un partido específico
   */
  async getMatchStats(matchId, source = 'sofascore') {
    const cacheKey = `match:${source}:${matchId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      let stats;
      
      switch (source) {
        case 'sofascore':
          stats = await this.scrapeSofaScoreMatch(matchId);
          break;
        case 'whoscored':
          stats = await this.scrapeWhoScoredMatch(matchId);
          break;
        default:
          stats = await this.scrapeFlashscoreMatch(matchId);
      }
      
      cache.set(cacheKey, stats, 3600);
      return stats;
    } catch (error) {
      console.error('Error scraping match stats:', error);
      return null;
    }
  }

  /**
   * Scraping específico de SofaScore
   */
  async scrapeSofaScoreMatch(matchId) {
    try {
      // Nota: SofaScore usa API, esto es un ejemplo simplificado
      const apiUrl = `https://api.sofascore.com/api/v1/event/${matchId}/statistics`;
      const response = await this.makeRequest(apiUrl);
      
      return {
        possession: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Ball possession').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Ball possession').away
        },
        shots: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Total shots').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Total shots').away
        },
        shotsOnTarget: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Shots on target').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Shots on target').away
        },
        corners: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Corner kicks').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Corner kicks').away
        },
        fouls: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Fouls').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Fouls').away
        },
        yellowCards: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Yellow cards').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Yellow cards').away
        },
        redCards: {
          home: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Red cards').home,
          away: response.data.statistics[0].groups[0].statisticsItems.find(s => s.name === 'Red cards').away
        },
        xG: {
          home: response.data.statistics[0].groups[1]?.statisticsItems.find(s => s.name === 'Expected goals').home,
          away: response.data.statistics[0].groups[1]?.statisticsItems.find(s => s.name === 'Expected goals').away
        }
      };
    } catch (error) {
      console.error('Error scraping SofaScore:', error);
      return null;
    }
  }

  /**
   * Scraping de múltiples fuentes
   */
  async scrapeMultipleSources(teamName, options) {
    const promises = [];
    
    // Intentar varias fuentes en paralelo
    if (options.includeSofaScore) {
      promises.push(this.scrapeSofaScoreTeam(teamName).catch(() => null));
    }
    if (options.includeFlashscore) {
      promises.push(this.scrapeFlashscoreTeam(teamName).catch(() => null));
    }
    if (options.includeWhoscored) {
      promises.push(this.scrapeWhoScoredTeam(teamName).catch(() => null));
    }
    
    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
  }

  /**
   * Combina estadísticas de múltiples fuentes
   */
  combineStats(statsArray) {
    if (statsArray.length === 0) return this.getDefaultStats();
    
    // Promediar valores numéricos
    const combined = {
      goalsScored: 0,
      goalsConceded: 0,
      shotsPerGame: 0,
      shotsOnTargetPerGame: 0,
      possession: 0,
      passAccuracy: 0,
      cornersPerGame: 0,
      foulsPerGame: 0,
      yellowCardsPerGame: 0,
      sources: statsArray.length
    };
    
    statsArray.forEach(stats => {
      Object.keys(combined).forEach(key => {
        if (typeof stats[key] === 'number') {
          combined[key] += stats[key];
        }
      });
    });
    
    // Calcular promedios
    Object.keys(combined).forEach(key => {
      if (typeof combined[key] === 'number' && key !== 'sources') {
        combined[key] = combined[key] / statsArray.length;
      }
    });
    
    return combined;
  }

  /**
   * Realiza petición HTTP con headers apropiados
   */
  async makeRequest(url, options = {}) {
    const randomUserAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    
    const config = {
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      timeout: 10000,
      ...options
    };
    
    // Delay aleatorio para evitar detección
    await this.delay(Math.random() * 1000 + 500);
    
    return axios.get(url, config);
  }

  /**
   * Normaliza nombre de equipo para URLs
   */
  normalizeTeamName(teamName) {
    return teamName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-');
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valores por defecto cuando falla el scraping
   */
  getDefaultStats() {
    return {
      goalsScored: 1.5,
      goalsConceded: 1.2,
      shotsPerGame: 12,
      shotsOnTargetPerGame: 4.5,
      possession: 50,
      passAccuracy: 78,
      cornersPerGame: 5,
      foulsPerGame: 12,
      yellowCardsPerGame: 2,
      sources: 0
    };
  }

  getDefaultH2H() {
    return {
      totalMatches: 0,
      team1Wins: 0,
      team2Wins: 0,
      draws: 0,
      avgGoals: 2.5,
      lastMatches: [],
      form: { team1: 'DDDDD', team2: 'DDDDD' }
    };
  }

  getDefaultForm() {
    return {
      matches: [],
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      formString: 'DDDDD'
    };
  }

  /**
   * Calcula promedio de goles
   */
  calculateAvgGoals(matches) {
    if (matches.length === 0) return 0;
    const totalGoals = matches.reduce((sum, m) => sum + m.homeGoals + m.awayGoals, 0);
    return (totalGoals / matches.length).toFixed(2);
  }

  /**
   * Calcula forma reciente
   */
  calculateForm(matches, team1, team2) {
    const form1 = [];
    const form2 = [];
    
    matches.slice(0, 5).forEach(match => {
      if (match.homeTeam === team1) {
        form1.push(match.winner === team1 ? 'W' : match.winner === 'draw' ? 'D' : 'L');
        form2.push(match.winner === team2 ? 'W' : match.winner === 'draw' ? 'D' : 'L');
      } else {
        form1.push(match.winner === team1 ? 'W' : match.winner === 'draw' ? 'D' : 'L');
        form2.push(match.winner === team2 ? 'W' : match.winner === 'draw' ? 'D' : 'L');
      }
    });
    
    return {
      team1: form1.join(''),
      team2: form2.join('')
    };
  }
}

module.exports = new WebScrapingService();