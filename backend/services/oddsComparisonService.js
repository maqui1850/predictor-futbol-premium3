// backend/services/oddsComparisonService.js
const axios = require('axios');
const cache = require('../utils/cache');
const webScrapingService = require('./webScrapingService');

class OddsComparisonService {
  constructor() {
    this.bookmakers = {
      bet365: { name: 'Bet365', url: 'https://www.bet365.com', active: true },
      betfair: { name: 'Betfair', url: 'https://www.betfair.com', active: true },
      williamHill: { name: 'William Hill', url: 'https://www.williamhill.com', active: true },
      betway: { name: 'Betway', url: 'https://www.betway.com', active: true },
      unibet: { name: 'Unibet', url: 'https://www.unibet.com', active: true },
      bwin: { name: 'Bwin', url: 'https://www.bwin.com', active: true },
      pinnacle: { name: 'Pinnacle', url: 'https://www.pinnacle.com', active: true },
      marathonbet: { name: 'Marathon', url: 'https://www.marathonbet.com', active: true },
      betsson: { name: 'Betsson', url: 'https://www.betsson.com', active: true },
      '888sport': { name: '888sport', url: 'https://www.888sport.com', active: true }
    };

    // APIs de cuotas (algunas requieren API key)
    this.oddsAPIs = {
      oddsApi: {
        url: 'https://api.the-odds-api.com/v4',
        key: process.env.ODDS_API_KEY || null
      },
      betfairExchange: {
        url: 'https://api.betfair.com/exchange',
        key: process.env.BETFAIR_API_KEY || null
      }
    };
  }

  /**
   * Obtiene cuotas para un partido específico de múltiples casas
   */
  async getOddsComparison(homeTeam, awayTeam, league = null) {
    const cacheKey = `odds:${homeTeam}:${awayTeam}:${league || 'all'}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const odds = await this.fetchOddsFromMultipleSources(homeTeam, awayTeam, league);
      
      const comparison = {
        match: `${homeTeam} vs ${awayTeam}`,
        league,
        timestamp: new Date().toISOString(),
        bookmakers: odds,
        bestOdds: this.findBestOdds(odds),
        averageOdds: this.calculateAverageOdds(odds),
        valueAnalysis: this.analyzeValue(odds),
        arbitrageOpportunity: this.checkArbitrage(odds)
      };
      
      // Cache por 5 minutos (las cuotas cambian rápidamente)
      cache.set(cacheKey, comparison, 300);
      
      return comparison;
    } catch (error) {
      console.error('Error fetching odds comparison:', error);
      return this.getMockOdds(homeTeam, awayTeam);
    }
  }

  /**
   * Obtiene cuotas de múltiples fuentes
   */
  async fetchOddsFromMultipleSources(homeTeam, awayTeam, league) {
    const oddsPromises = [];
    
    // Si tenemos API key para The Odds API
    if (this.oddsAPIs.oddsApi.key) {
      oddsPromises.push(this.fetchFromOddsAPI(homeTeam, awayTeam, league));
    }
    
    // Scraping de sitios web (con cuidado)
    oddsPromises.push(this.scrapeBet365Odds(homeTeam, awayTeam));
    oddsPromises.push(this.scrapeBetfairOdds(homeTeam, awayTeam));
    
    // Usar datos mock/simulados para demo
    oddsPromises.push(this.getSimulatedOdds(homeTeam, awayTeam));
    
    const results = await Promise.allSettled(oddsPromises);
    
    // Combinar resultados exitosos
    return results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value)
      .flat();
  }

  /**
   * Fetch desde The Odds API
   */
  async fetchFromOddsAPI(homeTeam, awayTeam, league) {
    if (!this.oddsAPIs.oddsApi.key) return [];

    try {
      const sportKey = this.getSportKey(league);
      const url = `${this.oddsAPIs.oddsApi.url}/sports/${sportKey}/odds`;
      
      const response = await axios.get(url, {
        params: {
          apiKey: this.oddsAPIs.oddsApi.key,
          regions: 'eu,uk,us',
          markets: 'h2h,spreads,totals'
        }
      });
      
      // Buscar el partido específico
      const match = response.data.find(game => 
        (game.home_team.includes(homeTeam) || homeTeam.includes(game.home_team)) &&
        (game.away_team.includes(awayTeam) || awayTeam.includes(game.away_team))
      );
      
      if (!match) return [];
      
      return match.bookmakers.map(bookmaker => ({
        bookmaker: bookmaker.key,
        name: bookmaker.title,
        odds: {
          home: bookmaker.markets[0].outcomes.find(o => o.name === match.home_team)?.price,
          draw: bookmaker.markets[0].outcomes.find(o => o.name === 'Draw')?.price,
          away: bookmaker.markets[0].outcomes.find(o => o.name === match.away_team)?.price,
        },
        lastUpdate: bookmaker.last_update
      }));
    } catch (error) {
      console.error('Error fetching from Odds API:', error);
      return [];
    }
  }

  /**
   * Genera cuotas simuladas para demostración
   */
  getSimulatedOdds(homeTeam, awayTeam) {
    const bookmakerList = Object.entries(this.bookmakers).filter(([_, bm]) => bm.active);
    
    // Generar probabilidades base
    const homeProb = 0.35 + Math.random() * 0.3; // 35-65%
    const drawProb = 0.2 + Math.random() * 0.15; // 20-35%
    const awayProb = 1 - homeProb - drawProb;
    
    return bookmakerList.map(([key, bookmaker]) => {
      // Agregar margen de la casa (overround)
      const margin = 1.03 + Math.random() * 0.07; // 3-10% margen
      
      // Convertir probabilidades a cuotas decimales
      const homeOdds = (1 / homeProb * margin).toFixed(2);
      const drawOdds = (1 / drawProb * margin).toFixed(2);
      const awayOdds = (1 / awayProb * margin).toFixed(2);
      
      // Pequeña variación entre casas
      const variation = 0.95 + Math.random() * 0.1;
      
      return {
        bookmaker: key,
        name: bookmaker.name,
        odds: {
          home: (homeOdds * variation).toFixed(2),
          draw: (drawOdds * variation).toFixed(2),
          away: (awayOdds * variation).toFixed(2)
        },
        markets: {
          btts: {
            yes: (1.75 + Math.random() * 0.5).toFixed(2),
            no: (1.85 + Math.random() * 0.5).toFixed(2)
          },
          overUnder: {
            over2_5: (1.80 + Math.random() * 0.4).toFixed(2),
            under2_5: (1.90 + Math.random() * 0.4).toFixed(2),
            over1_5: (1.25 + Math.random() * 0.2).toFixed(2),
            under1_5: (3.50 + Math.random() * 0.5).toFixed(2)
          },
          handicap: {
            homeHandicap: -0.5,
            homeOdds: (1.85 + Math.random() * 0.3).toFixed(2),
            awayOdds: (1.95 + Math.random() * 0.3).toFixed(2)
          },
          corners: {
            over9_5: (1.85 + Math.random() * 0.3).toFixed(2),
            under9_5: (1.85 + Math.random() * 0.3).toFixed(2)
          }
        },
        lastUpdate: new Date().toISOString(),
        availability: true,
        bonus: this.generateBonus(key)
      };
    });
  }

  /**
   * Encuentra las mejores cuotas para cada mercado
   */
  findBestOdds(bookmakerOdds) {
    const best = {
      home: { odds: 0, bookmaker: '' },
      draw: { odds: 0, bookmaker: '' },
      away: { odds: 0, bookmaker: '' },
      btts: {
        yes: { odds: 0, bookmaker: '' },
        no: { odds: 0, bookmaker: '' }
      },
      overUnder: {
        over2_5: { odds: 0, bookmaker: '' },
        under2_5: { odds: 0, bookmaker: '' }
      }
    };
    
    bookmakerOdds.forEach(bm => {
      // 1X2
      if (parseFloat(bm.odds.home) > parseFloat(best.home.odds)) {
        best.home = { odds: bm.odds.home, bookmaker: bm.name };
      }
      if (parseFloat(bm.odds.draw) > parseFloat(best.draw.odds)) {
        best.draw = { odds: bm.odds.draw, bookmaker: bm.name };
      }
      if (parseFloat(bm.odds.away) > parseFloat(best.away.odds)) {
        best.away = { odds: bm.odds.away, bookmaker: bm.name };
      }
      
      // BTTS
      if (bm.markets?.btts) {
        if (parseFloat(bm.markets.btts.yes) > parseFloat(best.btts.yes.odds)) {
          best.btts.yes = { odds: bm.markets.btts.yes, bookmaker: bm.name };
        }
        if (parseFloat(bm.markets.btts.no) > parseFloat(best.btts.no.odds)) {
          best.btts.no = { odds: bm.markets.btts.no, bookmaker: bm.name };
        }
      }
      
      // Over/Under
      if (bm.markets?.overUnder) {
        if (parseFloat(bm.markets.overUnder.over2_5) > parseFloat(best.overUnder.over2_5.odds)) {
          best.overUnder.over2_5 = { odds: bm.markets.overUnder.over2_5, bookmaker: bm.name };
        }
        if (parseFloat(bm.markets.overUnder.under2_5) > parseFloat(best.overUnder.under2_5.odds)) {
          best.overUnder.under2_5 = { odds: bm.markets.overUnder.under2_5, bookmaker: bm.name };
        }
      }
    });
    
    return best;
  }

  /**
   * Calcula cuotas promedio
   */
  calculateAverageOdds(bookmakerOdds) {
    const totals = {
      home: 0,
      draw: 0,
      away: 0,
      count: 0
    };
    
    bookmakerOdds.forEach(bm => {
      totals.home += parseFloat(bm.odds.home);
      totals.draw += parseFloat(bm.odds.draw);
      totals.away += parseFloat(bm.odds.away);
      totals.count++;
    });
    
    return {
      home: (totals.home / totals.count).toFixed(2),
      draw: (totals.draw / totals.count).toFixed(2),
      away: (totals.away / totals.count).toFixed(2)
    };
  }

  /**
   * Analiza el valor de las cuotas comparado con probabilidades
   */
  analyzeValue(bookmakerOdds) {
    const avgOdds = this.calculateAverageOdds(bookmakerOdds);
    
    // Convertir cuotas a probabilidades implícitas
    const impliedProb = {
      home: 1 / parseFloat(avgOdds.home),
      draw: 1 / parseFloat(avgOdds.draw),
      away: 1 / parseFloat(avgOdds.away)
    };
    
    // Calcular overround (margen de la casa)
    const overround = (impliedProb.home + impliedProb.draw + impliedProb.away - 1) * 100;
    
    return {
      impliedProbabilities: {
        home: (impliedProb.home * 100).toFixed(1) + '%',
        draw: (impliedProb.draw * 100).toFixed(1) + '%',
        away: (impliedProb.away * 100).toFixed(1) + '%'
      },
      overround: overround.toFixed(2) + '%',
      fairOdds: {
        home: (1 / impliedProb.home * (1 / (1 + overround/100))).toFixed(2),
        draw: (1 / impliedProb.draw * (1 / (1 + overround/100))).toFixed(2),
        away: (1 / impliedProb.away * (1 / (1 + overround/100))).toFixed(2)
      }
    };
  }

  /**
   * Verifica oportunidades de arbitraje
   */
  checkArbitrage(bookmakerOdds) {
    const best = this.findBestOdds(bookmakerOdds);
    
    // Calcular retorno para apuesta de arbitraje
    const arbCalculation = 
      1 / parseFloat(best.home.odds) + 
      1 / parseFloat(best.draw.odds) + 
      1 / parseFloat(best.away.odds);
    
    const hasArbitrage = arbCalculation < 1;
    const profit = hasArbitrage ? ((1 / arbCalculation - 1) * 100).toFixed(2) : 0;
    
    return {
      exists: hasArbitrage,
      profit: profit + '%',
      distribution: hasArbitrage ? {
        home: {
          stake: ((1 / parseFloat(best.home.odds)) / arbCalculation * 100).toFixed(2) + '%',
          bookmaker: best.home.bookmaker
        },
        draw: {
          stake: ((1 / parseFloat(best.draw.odds)) / arbCalculation * 100).toFixed(2) + '%',
          bookmaker: best.draw.bookmaker
        },
        away: {
          stake: ((1 / parseFloat(best.away.odds)) / arbCalculation * 100).toFixed(2) + '%',
          bookmaker: best.away.bookmaker
        }
      } : null
    };
  }

  /**
   * Genera información de bonos
   */
  generateBonus(bookmakerKey) {
    const bonuses = {
      bet365: 'Hasta €100 en créditos de apuesta',
      betfair: '€20 en apuestas gratis',
      williamHill: 'Apuesta €10 y obtén €30',
      betway: '100% hasta €100',
      unibet: '€40 en apuestas gratis',
      bwin: 'Hasta €100 en apuesta gratis',
      pinnacle: 'Las mejores cuotas, sin bonus',
      marathonbet: '€30 en apuestas gratis',
      betsson: '€100 bono bienvenida',
      '888sport': '€30 en apuestas gratis'
    };
    
    return bonuses[bookmakerKey] || 'Consultar promociones';
  }

  /**
   * Obtiene el sport key para The Odds API
   */
  getSportKey(league) {
    const sportKeys = {
      'Premier League': 'soccer_england_league1',
      'La Liga': 'soccer_spain_la_liga',
      'Serie A': 'soccer_italy_serie_a',
      'Bundesliga': 'soccer_germany_bundesliga',
      'Ligue 1': 'soccer_france_ligue_one',
      'Champions League': 'soccer_uefa_champs_league',
      'MLS': 'soccer_usa_mls'
    };
    
    return sportKeys[league] || 'soccer_europe_europa_league';
  }

  /**
   * Mock de cuotas para cuando falla todo
   */
  getMockOdds(homeTeam, awayTeam) {
    return {
      match: `${homeTeam} vs ${awayTeam}`,
      timestamp: new Date().toISOString(),
      bookmakers: this.getSimulatedOdds(homeTeam, awayTeam),
      bestOdds: {
        home: { odds: '2.10', bookmaker: 'Bet365' },
        draw: { odds: '3.40', bookmaker: 'Betfair' },
        away: { odds: '3.50', bookmaker: 'Pinnacle' }
      },
      averageOdds: {
        home: '2.05',
        draw: '3.35',
        away: '3.45'
      },
      error: 'Using simulated odds - API unavailable'
    };
  }

  /**
   * Scraping básico de Bet365 (ejemplo - requiere implementación real)
   */
  async scrapeBet365Odds(homeTeam, awayTeam) {
    // Nota: Bet365 tiene medidas anti-scraping muy fuertes
    // Esta es solo una estructura de ejemplo
    try {
      // En producción real, usar Puppeteer o similar
      console.log('Bet365 scraping would be implemented here');
      return null;
    } catch (error) {
      console.error('Error scraping Bet365:', error);
      return null;
    }
  }

  /**
   * Scraping básico de Betfair (ejemplo)
   */
  async scrapeBetfairOdds(homeTeam, awayTeam) {
    // Betfair tiene API, mejor usar esa
    try {
      console.log('Betfair API/scraping would be implemented here');
      return null;
    } catch (error) {
      console.error('Error with Betfair:', error);
      return null;
    }
  }
}

module.exports = new OddsComparisonService();