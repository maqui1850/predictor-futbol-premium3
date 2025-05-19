/**
 * Modelo para un partido de fútbol
 * Si se utiliza MongoDB, esto sería un esquema de Mongoose
 * Por ahora lo implementamos como una clase simple
 */
class Match {
  constructor(data) {
    this.id = data.id;
    this.date = data.date;
    this.league = {
      id: data.league.id,
      name: data.league.name || ''
    };
    this.homeTeam = {
      id: data.homeTeam.id,
      name: data.homeTeam.name,
      logo: data.homeTeam.logo || ''
    };
    this.awayTeam = {
      id: data.awayTeam.id,
      name: data.awayTeam.name,
      logo: data.awayTeam.logo || ''
    };
    this.status = data.status || 'Not Started';
    this.score = data.score || { home: null, away: null };
    this.statistics = data.statistics || null;
    this.source = data.source || 'api'; // 'api' o 'scraping'
    this.lastUpdated = new Date();
  }
  
  /**
   * Valida que el objeto tenga los datos mínimos necesarios
   */
  isValid() {
    return (
      this.id &&
      this.date &&
      this.league && this.league.id &&
      this.homeTeam && this.homeTeam.id && this.homeTeam.name &&
      this.awayTeam && this.awayTeam.id && this.awayTeam.name
    );
  }
  
  /**
   * Convierte a objeto JSON para almacenamiento o transmisión
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      league: this.league,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      status: this.status,
      score: this.score,
      statistics: this.statistics,
      source: this.source,
      lastUpdated: this.lastUpdated
    };
  }
  
  /**
   * Formatea el nombre del partido
   */
  getMatchName() {
    return `${this.homeTeam.name} vs ${this.awayTeam.name}`;
  }
  
  /**
   * Verifica si el partido ya ha comenzado
   */
  hasStarted() {
    return ['In Play', 'Halftime', 'Finished'].includes(this.status);
  }
  
  /**
   * Verifica si el partido ha finalizado
   */
  isFinished() {
    return this.status === 'Finished';
  }
  
  /**
   * Actualiza las estadísticas del partido
   */
  updateStatistics(statistics) {
    this.statistics = statistics;
    this.lastUpdated = new Date();
    return this;
  }
  
  /**
   * Actualiza el resultado del partido
   */
  updateScore(score) {
    this.score = score;
    this.lastUpdated = new Date();
    return this;
  }
  
  /**
   * Crea una instancia desde un objeto JSON
   */
  static fromJSON(json) {
    return new Match(json);
  }
}

module.exports = Match;
