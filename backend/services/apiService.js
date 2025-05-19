// backend/services/apiService.js
const axios = require('axios');
const cache = require('../utils/cache');

class ApiService {
  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY;
    this.baseUrl = 'https://api-football-v1.p.rapidapi.com/v3';
    this.headers = {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
    };
  }

  /**
   * Realiza una petición a la API con caché
   * @param {string} endpoint - Endpoint de la API
   * @param {object} params - Parámetros de la consulta
   * @returns {Promise<object>} - Datos de la respuesta
   */
  async request(endpoint, params = {}) {
    const cacheKey = `api:${endpoint}:${JSON.stringify(params)}`;
    
    // Intenta recuperar del caché
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Usando datos en caché para: ${cacheKey}`);
      return cachedData;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: this.headers,
        params: params
      });
      
      // Almacena en caché (1 hora)
      cache.set(cacheKey, response.data, 3600);
      
      return response.data;
    } catch (error) {
      console.error(`Error en la petición API ${endpoint}:`, error.message);
      throw new Error(`Error en la petición API: ${error.message}`);
    }
  }

  /**
   * Obtiene la lista de ligas disponibles
   * @param {number} season - Temporada (año)
   * @returns {Promise<object>} - Datos de ligas
   */
  async getLeagues(season = new Date().getFullYear()) {
    return this.request('leagues', { season });
  }

  /**
   * Obtiene los equipos de una liga
   * @param {number} league - ID de la liga
   * @param {number} season - Temporada (año)
   * @returns {Promise<object>} - Datos de equipos
   */
  async getTeams(league, season = new Date().getFullYear()) {
    return this.request('teams', { league, season });
  }

  /**
   * Obtiene los partidos para una fecha específica
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {number} league - ID de la liga (opcional)
   * @returns {Promise<object>} - Datos de partidos
   */
  async getFixtures(date, league = null) {
    const params = { date };
    if (league) params.league = league;
    return this.request('fixtures', params);
  }

  /**
   * Obtiene estadísticas de un partido específico
   * @param {number} fixtureId - ID del partido
   * @returns {Promise<object>} - Estadísticas del partido
   */
  async getFixtureStatistics(fixtureId) {
    return this.request(`fixtures/statistics`, { fixture: fixtureId });
  }

  /**
   * Obtiene estadísticas head-to-head entre dos equipos
   * @param {number} h2h - IDs de equipos separados por guión (ej: '33-34')
   * @param {number} last - Número de partidos a obtener
   * @returns {Promise<object>} - Datos de partidos head-to-head
   */
  async getH2H(team1, team2, last = 10) {
    const h2h = `${team1}-${team2}`;
    return this.request('fixtures/headtohead', { h2h, last });
  }

  /**
   * Obtiene estadísticas de un equipo
   * @param {number} teamId - ID del equipo
   * @param {number} league - ID de la liga
   * @param {number} season - Temporada (año)
   * @returns {Promise<object>} - Estadísticas del equipo
   */
  async getTeamStatistics(teamId, league, season = new Date().getFullYear()) {
    return this.request('teams/statistics', { team: teamId, league, season });
  }

  /**
   * Obtiene las cuotas para un partido
   * @param {number} fixtureId - ID del partido
   * @returns {Promise<object>} - Cuotas del partido
   */
  async getOdds(fixtureId) {
    return this.request('odds', { fixture: fixtureId });
  }
}

module.exports = new ApiService();
