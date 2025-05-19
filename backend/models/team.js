/**
 * Modelo para un equipo de fútbol
 * Si se utiliza MongoDB, esto sería un esquema de Mongoose
 * Por ahora lo implementamos como una clase simple
 */
class Team {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.logo = data.logo || '';
    this.country = data.country || '';
    this.founded = data.founded || null;
    this.venue = data.venue || null;
    this.league = data.league || { id: null, name: '' };
    this.statistics = data.statistics || {};
    this.form = data.form || [];
    this.source = data.source || 'api'; // 'api' o 'scraping'
    this.lastUpdated = new Date();
  }
  
  /**
   * Valida que el objeto tenga los datos mínimos necesarios
   */
  isValid() {
    return this.id && this.name;
  }
  
  /**
   * Convierte a objeto JSON para almacenamiento o transmisión
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      logo: this.logo,
      country: this.country,
      founded: this.founded,
      venue: this.venue,
      league: this.league,
      statistics: this.statistics,
      form: this.form,
      source: this.source,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Actualiza las estadísticas del equipo
   */
  updateStatistics(statistics) {
    this.statistics = {
      ...this.statistics,
      ...statistics
    };
    this.lastUpdated = new Date();
    return this;
  }
  
  /**
   * Actualiza la forma reciente del equipo
   * @param {Array} formArray - Array de resultados recientes ['W', 'L', 'D', 'W', 'L']
   */
  updateForm(formArray) {
    this.form = formArray;
    this.lastUpdated = new Date();
    return this;
  }
  
  /**
   * Calcula ratio de victorias
   */
  getWinRate() {
    if (!this.statistics.fixtures) {
      return null;
    }
    
    const { played, wins } = this.statistics.fixtures;
    return played > 0 ? parseFloat((wins / played * 100).toFixed(2)) : 0;
  }
  
  /**
   * Calcula promedio de goles marcados
   */
  getGoalsAverage() {
    if (!this.statistics.goals || !this.statistics.goals.for || !this.statistics.fixtures) {
      return null;
    }
    
    const goalsFor = this.statistics.goals.for.total || 0;
    const played = this.statistics.fixtures.played || 0;
    
    return played > 0 ? parseFloat((goalsFor / played).toFixed(2)) : 0;
  }
  
  /**
   * Calcula promedio de goles recibidos
   */
  getGoalsConcededAverage() {
    if (!this.statistics.goals || !this.statistics.goals.against || !this.statistics.fixtures) {
      return null;
    }
    
    const goalsAgainst = this.statistics.goals.against.total || 0;
    const played = this.statistics.fixtures.played || 0;
    
    return played > 0 ? parseFloat((goalsAgainst / played).toFixed(2)) : 0;
  }
  
  /**
   * Calcula porcentaje de partidos con clean sheet
   */
  getCleanSheetRate() {
    if (!this.statistics.clean_sheets || !this.statistics.fixtures) {
      return null;
    }
    
    const cleanSheets = this.statistics.clean_sheets || 0;
    const played = this.statistics.fixtures.played || 0;
    
    return played > 0 ? parseFloat((cleanSheets / played * 100).toFixed(2)) : 0;
  }
  
  /**
   * Crea una instancia desde un objeto JSON
   */
  static fromJSON(json) {
    return new Team(json);
  }
}

module.exports = Team;
