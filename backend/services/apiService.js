const axios = require('axios');
const leagues = require('../config/leagues'); // Importar el archivo de ligas

// Configuración de la API (usar variables de entorno en producción)
const API_CONFIG = {
  baseUrl: process.env.API_FOOTBALL_URL || 'https://api-football-v1.p.rapidapi.com/v3',
  apiKey: process.env.API_FOOTBALL_KEY || '',
  headers: {
    'x-rapidapi-key': process.env.API_FOOTBALL_KEY || '',
    'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
  }
};

/**
 * Servicio para comunicarse con APIs externas de fútbol
 */
class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.headers = API_CONFIG.headers;
    this.cache = new Map();
    this.cacheTimeout = 3600000; // 1 hora
    this.leagues = leagues; // Usar las ligas del archivo de configuración
  }

  /**
   * Obtener ligas disponibles
   */
  async getLeagues() {
    try {
      // Convertir el objeto de ligas a array para la respuesta
      const leaguesArray = Object.values(this.leagues).map(league => ({
        id: league.id,
        name: league.name,
        country: league.country,
        flag: league.flag
      }));

      return {
        success: true,
        response: leaguesArray
      };
    } catch (error) {
      console.error('Error obteniendo ligas:', error);
      throw error;
    }
  }

  /**
   * Obtener equipos por liga
   */
  async getTeams(leagueId) {
    try {
      // Buscar la liga por ID
      const league = Object.values(this.leagues).find(l => l.id === parseInt(leagueId));
      
      if (!league) {
        return {
          success: false,
          response: [],
          error: 'Liga no encontrada'
        };
      }

      // Convertir nombres de equipos a formato con IDs simulados
      const teams = league.teams.map((teamName, index) => ({
        id: parseInt(`${leagueId}${index + 1}`), // ID simulado basado en liga e índice
        name: teamName,
        league: league.name,
        country: league.country
      }));

      return {
        success: true,
        response: teams
      };
    } catch (error) {
      console.error('Error obteniendo equipos:', error);
      throw error;
    }
  }

  /**
   * Obtener equipos por nombre de liga
   */
  async getTeamsByLeagueName(leagueName) {
    try {
      const league = this.leagues[leagueName];
      
      if (!league) {
        return {
          success: false,
          response: [],
          error: 'Liga no encontrada'
        };
      }

      // Convertir nombres de equipos a formato con IDs simulados
      const teams = league.teams.map((teamName, index) => ({
        id: parseInt(`${league.id}${index + 1}`),
        name: teamName,
        league: league.name,
        country: league.country
      }));

      return {
        success: true,
        response: teams
      };
    } catch (error) {
      console.error('Error obteniendo equipos:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un equipo
   */
  async getTeamStatistics(teamId, leagueId) {
    try {
      // Generar estadísticas simuladas basadas en el ID del equipo
      const randomSeed = teamId % 10;
      const formOptions = ['WWWWW', 'WWWDL', 'WDWDL', 'LDWDL', 'LLDWL'];
      
      return {
        success: true,
        response: {
          team: { id: teamId },
          league: { id: leagueId },
          form: formOptions[randomSeed % formOptions.length],
          fixtures: {
            played: { home: 10 + randomSeed, away: 10 + randomSeed, total: 20 + (randomSeed * 2) },
            wins: { home: 6 + (randomSeed % 3), away: 4 + (randomSeed % 2), total: 10 + (randomSeed % 5) },
            draws: { home: 2 + (randomSeed % 2), away: 3 - (randomSeed % 2), total: 5 },
            loses: { home: 2 - (randomSeed % 2), away: 3 + (randomSeed % 2), total: 5 + (randomSeed % 3) }
          },
          goals: {
            for: { 
              total: 35 + (randomSeed * 2), 
              average: parseFloat((1.75 + (randomSeed * 0.1)).toFixed(2)),
              home: 20 + randomSeed,
              away: 15 + randomSeed
            },
            against: { 
              total: 20 + randomSeed, 
              average: parseFloat((1.0 + (randomSeed * 0.05)).toFixed(2)),
              home: 8 + (randomSeed % 4),
              away: 12 + (randomSeed % 3)
            }
          },
          clean_sheet: { home: 4 + (randomSeed % 3), away: 3 + (randomSeed % 2), total: 7 + (randomSeed % 4) },
          penalty: {
            scored: { total: 3 + (randomSeed % 3), percentage: '80%' },
            missed: { total: 1, percentage: '20%' }
          }
        }
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener historial head-to-head
   */
  async getH2H(team1Id, team2Id) {
    try {
      // Generar historial simulado
      const matches = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 5; i++) {
        const matchDate = new Date(currentDate);
        matchDate.setMonth(matchDate.getMonth() - (i * 4)); // Partidos cada 4 meses
        
        const homeGoals = Math.floor(Math.random() * 4);
        const awayGoals = Math.floor(Math.random() * 4);
        
        matches.push({
          fixture: {
            id: 1000 + i,
            date: matchDate.toISOString(),
            venue: { name: i % 2 === 0 ? 'Estadio Local' : 'Estadio Visitante' }
          },
          teams: {
            home: { 
              id: i % 2 === 0 ? team1Id : team2Id, 
              winner: homeGoals > awayGoals 
            },
            away: { 
              id: i % 2 === 0 ? team2Id : team1Id, 
              winner: awayGoals > homeGoals 
            }
          },
          goals: { home: homeGoals, away: awayGoals }
        });
      }

      return {
        success: true,
        response: matches
      };
    } catch (error) {
      console.error('Error obteniendo H2H:', error);
      throw error;
    }
  }

  /**
   * Obtener partidos por liga y fecha
   */
  async getFixturesByLeague(leagueId, date) {
    try {
      const league = Object.values(this.leagues).find(l => l.id === parseInt(leagueId));
      
      if (!league) {
        return { success: false, response: [] };
      }

      // Generar partidos simulados
      const fixtures = [];
      const teams = [...league.teams];
      const matchDate = date || new Date().toISOString();
      
      // Crear 5 partidos aleatorios
      for (let i = 0; i < Math.min(5, teams.length / 2); i++) {
        const homeIndex = Math.floor(Math.random() * teams.length);
        const homeTeam = teams.splice(homeIndex, 1)[0];
        
        const awayIndex = Math.floor(Math.random() * teams.length);
        const awayTeam = teams.splice(awayIndex, 1)[0];
        
        fixtures.push({
          fixture: {
            id: 2000 + i,
            date: matchDate,
            status: { long: 'Not Started', short: 'NS' }
          },
          teams: {
            home: { 
              id: parseInt(`${leagueId}${homeIndex + 1}`), 
              name: homeTeam 
            },
            away: { 
              id: parseInt(`${leagueId}${awayIndex + 1}`), 
              name: awayTeam 
            }
          },
          league: { 
            id: league.id, 
            name: league.name,
            country: league.country
          }
        });
      }

      return {
        success: true,
        response: fixtures
      };
    } catch (error) {
      console.error('Error obteniendo partidos:', error);
      throw error;
    }
  }

  /**
   * Obtener partido por ID
   */
  async getFixtureById(fixtureId) {
    try {
      // Usar Premier League como ejemplo
      const league = this.leagues['Premier League'];
      
      return {
        success: true,
        response: {
          fixture: {
            id: fixtureId,
            date: new Date().toISOString(),
            venue: { name: 'Estadio Principal', city: 'Ciudad' }
          },
          teams: {
            home: { 
              id: 391, 
              name: league.teams[0],
              logo: 'https://media.api-sports.io/football/teams/33.png'
            },
            away: { 
              id: 392, 
              name: league.teams[1],
              logo: 'https://media.api-sports.io/football/teams/34.png'
            }
          },
          league: { 
            id: league.id, 
            name: league.name,
            country: league.country,
            logo: 'https://media.api-sports.io/football/leagues/39.png'
          }
        }
      };
    } catch (error) {
      console.error('Error obteniendo partido:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de un partido
   */
  async getStatisticsByFixture(fixtureId) {
    try {
      // Generar estadísticas simuladas
      const generateTeamStats = (teamName) => {
        const base = Math.floor(Math.random() * 10) + 5;
        
        return {
          team: { name: teamName },
          statistics: [
            { type: 'Shots on Goal', value: base },
            { type: 'Shots off Goal', value: Math.floor(base * 0.7) },
            { type: 'Total Shots', value: Math.floor(base * 1.8) },
            { type: 'Blocked Shots', value: Math.floor(base * 0.3) },
            { type: 'Shots insidebox', value: Math.floor(base * 1.2) },
            { type: 'Shots outsidebox', value: Math.floor(base * 0.6) },
            { type: 'Fouls', value: 10 + Math.floor(Math.random() * 8) },
            { type: 'Corner Kicks', value: 3 + Math.floor(Math.random() * 8) },
            { type: 'Offsides', value: Math.floor(Math.random() * 5) },
            { type: 'Ball Possession', value: `${45 + Math.floor(Math.random() * 10)}%` },
            { type: 'Yellow Cards', value: Math.floor(Math.random() * 4) },
            { type: 'Red Cards', value: Math.random() > 0.9 ? 1 : 0 },
            { type: 'Total passes', value: 350 + Math.floor(Math.random() * 200) },
            { type: 'Passes accurate', value: 280 + Math.floor(Math.random() * 150) },
            { type: 'Passes %', value: `${75 + Math.floor(Math.random() * 15)}%` }
          ]
        };
      };

      return {
        success: true,
        response: [
          generateTeamStats('Equipo Local'),
          generateTeamStats('Equipo Visitante')
        ]
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Buscar equipos por nombre
   */
  async searchTeams(query) {
    try {
      const results = [];
      
      // Buscar en todas las ligas
      Object.values(this.leagues).forEach(league => {
        league.teams.forEach((teamName, index) => {
          if (teamName.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id: parseInt(`${league.id}${index + 1}`),
              name: teamName,
              league: league.name,
              country: league.country
            });
          }
        });
      });

      return {
        success: true,
        response: results
      };
    } catch (error) {
      console.error('Error buscando equipos:', error);
      throw error;
    }
  }
}

module.exports = new ApiService();