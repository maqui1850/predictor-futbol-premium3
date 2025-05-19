/**
 * Modelo para una predicción de partido
 * Si se utiliza MongoDB, esto sería un esquema de Mongoose
 * Por ahora lo implementamos como una clase simple
 */
class Prediction {
  constructor(data) {
    this.id = data.id || `pred_${Date.now()}`;
    this.fixtureId = data.fixtureId;
    this.date = data.date || new Date().toISOString();
    this.homeTeam = data.homeTeam;
    this.awayTeam = data.awayTeam;
    this.league = data.league || { id: null, name: '' };
    this.source = data.source || 'api'; // 'api' o 'scraping'
    this.confidence = data.confidence || 0;
    this.markets = data.markets || {};
    this.recommendation = data.recommendation || null;
    this.isCustom = data.isCustom || false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.expiresAt = this.calculateExpiryDate(this.createdAt);
  }
  
  /**
   * Calcula fecha de expiración (24 horas después de la creación)
   */
  calculateExpiryDate(createdAt) {
    const expiryDate = new Date(createdAt);
    expiryDate.setHours(expiryDate.getHours() + 24);
    return expiryDate.toISOString();
  }
  
  /**
   * Valida que el objeto tenga los datos mínimos necesarios
   */
  isValid() {
    return (
      this.fixtureId &&
      this.homeTeam && this.homeTeam.id && this.homeTeam.name &&
      this.awayTeam && this.awayTeam.id && this.awayTeam.name &&
      this.markets && Object.keys(this.markets).length > 0
    );
  }
  
  /**
   * Convierte a objeto JSON para almacenamiento o transmisión
   */
  toJSON() {
    return {
      id: this.id,
      fixtureId: this.fixtureId,
      date: this.date,
      homeTeam: this.homeTeam,
      awayTeam: this.awayTeam,
      league: this.league,
      source: this.source,
      confidence: this.confidence,
      markets: this.markets,
      recommendation: this.recommendation,
      isCustom: this.isCustom,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt
    };
  }
  
  /**
   * Verifica si la predicción ha expirado
   */
  isExpired() {
    return new Date() > new Date(this.expiresAt);
  }
  
  /**
   * Obtiene clase CSS según nivel de confianza
   */
  getConfidenceClass() {
    if (this.confidence >= 7.0) {
      return 'high-confidence';
    } else if (this.confidence >= 5.0) {
      return 'medium-confidence';
    } else {
      return 'low-confidence';
    }
  }
  
  /**
   * Encuentra el mercado con mayor confianza
   */
  getBestMarket() {
    if (!this.markets || Object.keys(this.markets).length === 0) {
      return null;
    }
    
    let bestMarket = null;
    let highestConfidence = 0;
    
    // Mercado 1X2
    if (this.markets['1x2'] && this.markets['1x2'].confidence > highestConfidence) {
      bestMarket = {
        type: '1X2',
        prediction: this.markets['1x2'].prediction,
        confidence: this.markets['1x2'].confidence,
        odds: this.markets['1x2'].odds[this.markets['1x2'].prediction]
      };
      highestConfidence = this.markets['1x2'].confidence;
    }
    
    // Mercado BTTS
    if (this.markets['btts'] && this.markets['btts'].confidence > highestConfidence) {
      bestMarket = {
        type: 'BTTS',
        prediction: this.markets['btts'].prediction,
        confidence: this.markets['btts'].confidence,
        odds: this.markets['btts'].odds[this.markets['btts'].prediction]
      };
      highestConfidence = this.markets['btts'].confidence;
    }
    
    // Mercado Over/Under
    if (this.markets['over_under']) {
      for (const [line, data] of Object.entries(this.markets['over_under'])) {
        if (data.confidence > highestConfidence) {
          bestMarket = {
            type: `Over/Under ${line}`,
            prediction: data.prediction,
            confidence: data.confidence,
            odds: data.odds[data.prediction]
          };
          highestConfidence = data.confidence;
        }
      }
    }
    
    // Mercado de Córners
    if (this.markets['corners']) {
      for (const [line, data] of Object.entries(this.markets['corners'])) {
        if (data.confidence > highestConfidence) {
          bestMarket = {
            type: `Corners ${line}`,
            prediction: data.prediction,
            confidence: data.confidence,
            odds: data.odds[data.prediction]
          };
          highestConfidence = data.confidence;
        }
      }
    }
    
    // Mercado de Tarjetas
    if (this.markets['cards']) {
      for (const [line, data] of Object.entries(this.markets['cards'])) {
        if (data.confidence > highestConfidence) {
          bestMarket = {
            type: `Cards ${line}`,
            prediction: data.prediction,
            confidence: data.confidence,
            odds: data.odds[data.prediction]
          };
          highestConfidence = data.confidence;
        }
      }
    }
    
    // Mercado Handicap Asiático
    if (this.markets['asian_handicap']) {
      for (const [line, data] of Object.entries(this.markets['asian_handicap'])) {
        if (data.confidence > highestConfidence) {
          bestMarket = {
            type: `Asian Handicap ${line}`,
            prediction: data.prediction,
            confidence: data.confidence,
            odds: data.odds[data.prediction.startsWith('Home') ? 'Home' : 'Away']
          };
          highestConfidence = data.confidence;
        }
      }
    }
    
    return bestMarket;
  }
  
  /**
   * Crea una instancia desde un objeto JSON
   */
  static fromJSON(json) {
    return new Prediction(json);
  }
}

module.exports = Prediction;
