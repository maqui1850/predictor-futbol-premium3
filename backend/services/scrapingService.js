// backend/services/scrapingService.js
const axios = require('axios');
const cheerio = require('cheerio');
const cache = require('../utils/cache');

class ScrapingService {
  /**
   * Realiza scraping con caché
   * @param {string} url - URL a hacer scraping
   * @param {Function} parser - Función que procesa la respuesta
   * @param {number} cacheTime - Tiempo de caché en segundos
   * @returns {Promise<object>} - Datos procesados
   */
  async scrape(url, parser, cacheTime = 3600) {
    const cacheKey = `scraping:${url}`;
    
    // Intenta recuperar del caché
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Usando datos en caché para: ${cacheKey}`);
      return cachedData;
    }
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const result = parser($);
      
      // Almacena en caché
      cache.set(cacheKey, result, cacheTime);
      
      return result;
    } catch (error) {
      console.error(`Error en scraping ${url}:`, error.message);
      throw new Error(`Error en scraping: ${error.message}`);
    }
  }

  /**
   * Obtiene partidos próximos de SofaScore
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Array>} - Lista de partidos
   */
  async getSofaScoreFixtures(date) {
    const url = `https://www.sofascore.com/football/${date}`;
    
    return this.scrape(url, $ => {
      const matches = [];
      
      // Selecciona los elementos que contienen partidos
      $('.sc-fqkvVR').each((i, el) => {
        try {
          const tournament = $(el).find('.sc-dcJsrY').text().trim();
          
          $(el).find('.sc-aXZVg').each((j, match) => {
            const homeTeam = $(match).find('.sc-gFqAkR').eq(0).text().trim();
            const awayTeam = $(match).find('.sc-gFqAkR').eq(1).text().trim();
            const time = $(match).find('.sc-imWYAI').text().trim();
            
            // Extraer posible resultado (si el partido ya comenzó)
            const homeScore = $(match).find('.sc-jXbUNg').eq(0).text().trim();
            const awayScore = $(match).find('.sc-jXbUNg').eq(1).text().trim();
            
            matches.push({
              tournament,
              homeTeam,
              awayTeam,
              time,
              score: homeScore && awayScore ? `${homeScore}-${awayScore}` : null,
              source: 'sofascore'
            });
          });
        } catch (e) {
          console.error('Error parsing SofaScore match:', e);
        }
      });
      
      return matches;
    });
  }

  /**
   * Obtiene estadísticas de un equipo de FBref
   * @param {string} teamName - Nombre del equipo
   * @returns {Promise<object>} - Estadísticas del equipo
   */
  async getFBrefTeamStats(teamName) {
    // Aquí necesitaríamos conocer la URL específica
    // FBref usa nombres de equipos codificados en la URL
    const encodedName = encodeURIComponent(teamName.toLowerCase().replace(/\s+/g, '-'));
    const url = `https://fbref.com/en/squads/${encodedName}/2024-2025/all_comps/`;
    
    return this.scrape(url, $ => {
      const stats = {
        matches: [],
        overallStats: {
          goalsScored: 0,
          goalsConceded: 0,
          cleanSheets: 0,
          cornersPerGame: 0,
          yellowCards: 0,
          redCards: 0
        }
      };
      
      // Extraer estadísticas generales (esto variará según la estructura exacta de FBref)
      try {
        // Goles marcados y recibidos
        stats.overallStats.goalsScored = parseInt($('#stats_squads_standard_for tfoot .right:nth-child(6)').text().trim()) || 0;
        stats.overallStats.goalsConceded = parseInt($('#stats_squads_standard_against tfoot .right:nth-child(6)').text().trim()) || 0;
        
        // Portería a cero
        stats.overallStats.cleanSheets = parseInt($('#stats_squads_keeper_for tfoot .right:nth-child(9)').text().trim()) || 0;
        
        // Tarjetas
        stats.overallStats.yellowCards = parseInt($('#stats_squads_misc_for tfoot .right:nth-child(13)').text().trim()) || 0;
        stats.overallStats.redCards = parseInt($('#stats_squads_misc_for tfoot .right:nth-child(14)').text().trim()) || 0;
      } catch (e) {
        console.error('Error parsing FBref team stats:', e);
      }
      
      // Extraer últimos partidos
      try {
        $('#matchlogs_for tbody tr').each((i, el) => {
          if (i >= 10) return false; // Limitar a los últimos 10 partidos
          
          const date = $(el).find('th').text().trim();
          const opponent = $(el).find('td[data-stat="opponent"]').text().trim();
          const result = $(el).find('td[data-stat="result"]').text().trim();
          const goalsFor = parseInt($(el).find('td[data-stat="goals_for"]').text().trim()) || 0;
          const goalsAgainst = parseInt($(el).find('td[data-stat="goals_against"]').text().trim()) || 0;
          
          stats.matches.push({
            date,
            opponent,
            result,
            goalsFor,
            goalsAgainst
          });
        });
      } catch (e) {
        console.error('Error parsing FBref matches:', e);
      }
      
      return stats;
    });
  }

  /**
   * Obtiene estadísticas avanzadas de Understat
   * @param {string} teamName - Nombre del equipo
   * @returns {Promise<object>} - Estadísticas avanzadas
   */
  async getUnderstatTeamStats(teamName) {
    // Similar a FBref, necesitamos la URL específica
    const encodedName = encodeURIComponent(teamName.toLowerCase().replace(/\s+/g, '_'));
    const url = `https://understat.com/team/${encodedName}`;
    
    return this.scrape(url, $ => {
      const stats = {
        xG: 0,
        xGA: 0,
        matches: []
      };
      
      try {
        // Extraer xG y xGA general (esto es complejo porque Understat usa JavaScript para cargar datos)
        // En una implementación real, necesitaríamos usar Puppeteer para ejecutar JS
        // Para este ejemplo, hacemos un parsing simple
        
        // Intentar extraer últimos partidos
        $('.calendar-game').each((i, el) => {
          if (i >= 10) return false; // Limitar a los últimos 10 partidos
          
          const date = $(el).find('.calendar-date').text().trim();
          const opponent = $(el).find('.team-title:not(.selected)').text().trim();
          const score = $(el).find('.teams-score').text().trim();
          const xG = parseFloat($(el).find('.progress-title:contains("xG")').next().text().trim()) || 0;
          const xGA = parseFloat($(el).find('.progress-title:contains("xGA")').next().text().trim()) || 0;
          
          stats.matches.push({
            date,
            opponent,
            score,
            xG,
            xGA
          });
          
          // Acumular xG y xGA
          stats.xG += xG;
          stats.xGA += xGA;
        });
        
        // Calcular promedio si tenemos partidos
        if (stats.matches.length > 0) {
          stats.xG = stats.xG / stats.matches.length;
          stats.xGA = stats.xGA / stats.matches.length;
        }
      } catch (e) {
        console.error('Error parsing Understat stats:', e);
      }
      
      return stats;
    });
  }
}

module.exports = new ScrapingService();
