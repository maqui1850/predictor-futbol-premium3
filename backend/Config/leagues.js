// backend/config/leagues.js
const leagues = {
  // EUROPA
  'Premier League': {
    id: 39,
    name: 'Premier League',
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    teams: [
      'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
      'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
      'Liverpool', 'Luton Town', 'Manchester City', 'Manchester United',
      'Newcastle', 'Nottingham Forest', 'Sheffield United', 'Tottenham',
      'West Ham', 'Wolves'
    ]
  },
  'La Liga': {
    id: 140,
    name: 'La Liga',
    country: 'Spain',
    flag: '🇪🇸',
    teams: [
      'Alaves', 'Almeria', 'Athletic Bilbao', 'Atletico Madrid', 'Barcelona',
      'Cadiz', 'Celta Vigo', 'Getafe', 'Girona', 'Granada', 'Las Palmas',
      'Mallorca', 'Osasuna', 'Rayo Vallecano', 'Real Betis', 'Real Madrid',
      'Real Sociedad', 'Sevilla', 'Valencia', 'Villarreal'
    ]
  },
  'Serie A': {
    id: 135,
    name: 'Serie A',
    country: 'Italy',
    flag: '🇮🇹',
    teams: [
      'AC Milan', 'AS Roma', 'Atalanta', 'Bologna', 'Cagliari', 'Empoli',
      'Fiorentina', 'Frosinone', 'Genoa', 'Hellas Verona', 'Inter Milan',
      'Juventus', 'Lazio', 'Lecce', 'Monza', 'Napoli', 'Salernitana',
      'Sassuolo', 'Torino', 'Udinese'
    ]
  },
  'Bundesliga': {
    id: 78,
    name: 'Bundesliga',
    country: 'Germany',
    flag: '🇩🇪',
    teams: [
      'Augsburg', 'Bayer Leverkusen', 'Bayern Munich', 'Borussia Dortmund',
      'Borussia Monchengladbach', 'Darmstadt', 'Eintracht Frankfurt',
      'FC Cologne', 'Freiburg', 'Heidenheim', 'Hoffenheim', 'Mainz',
      'RB Leipzig', 'Stuttgart', 'Union Berlin', 'Werder Bremen', 'Wolfsburg', 'Bochum'
    ]
  },
  'Ligue 1': {
    id: 61,
    name: 'Ligue 1',
    country: 'France',
    flag: '🇫🇷',
    teams: [
      'Brest', 'Clermont', 'Le Havre', 'Lens', 'Lille', 'Lorient', 'Lyon',
      'Marseille', 'Metz', 'Monaco', 'Montpellier', 'Nantes', 'Nice',
      'Paris Saint-Germain', 'Reims', 'Rennes', 'Strasbourg', 'Toulouse'
    ]
  },
  
  // AMÉRICA
  'Liga MX': {
    id: 262,
    name: 'Liga MX',
    country: 'Mexico',
    flag: '🇲🇽',
    teams: [
      'America', 'Atlas', 'Cruz Azul', 'Guadalajara', 'Juarez', 'Leon',
      'Mazatlan', 'Monterrey', 'Necaxa', 'Pachuca', 'Puebla', 'Pumas UNAM',
      'Queretaro', 'Santos Laguna', 'Tigres UANL', 'Tijuana', 'Toluca'
    ]
  },
  'Liga Argentina': {
    id: 128,
    name: 'Liga Argentina',
    country: 'Argentina',
    flag: '🇦🇷',
    teams: [
      'Argentinos Juniors', 'Arsenal Sarandi', 'Atletico Tucuman', 'Banfield',
      'Barracas Central', 'Belgrano', 'Boca Juniors', 'Central Cordoba',
      'Colon', 'Defensa y Justicia', 'Estudiantes', 'Godoy Cruz', 'Huracan',
      'Independiente', 'Instituto', 'Lanus', 'Newell\'s Old Boys', 'Platense',
      'Racing Club', 'River Plate', 'Rosario Central', 'San Lorenzo',
      'Sarmiento', 'Talleres', 'Tigre', 'Union Santa Fe', 'Velez Sarsfield'
    ]
  },
  'Brasileirao': {
    id: 71,
    name: 'Brasileirao',
    country: 'Brazil',
    flag: '🇧🇷',
    teams: [
      'America MG', 'Athletico Paranaense', 'Atletico Mineiro', 'Bahia',
      'Botafogo', 'Corinthians', 'Coritiba', 'Cruzeiro', 'Cuiaba', 'Flamengo',
      'Fluminense', 'Fortaleza', 'Goias', 'Gremio', 'Internacional',
      'Palmeiras', 'Red Bull Bragantino', 'Santos', 'Sao Paulo', 'Vasco da Gama'
    ]
  },
  'MLS': {
    id: 253,
    name: 'MLS',
    country: 'USA',
    flag: '🇺🇸',
    teams: [
      'Atlanta United', 'Austin FC', 'Charlotte FC', 'Chicago Fire',
      'Cincinnati', 'Colorado Rapids', 'Columbus Crew', 'DC United',
      'Houston Dynamo', 'Inter Miami', 'LA Galaxy', 'LAFC', 'Minnesota United',
      'Montreal Impact', 'Nashville SC', 'New England Revolution',
      'New York City FC', 'New York Red Bulls', 'Orlando City', 'Philadelphia Union',
      'Portland Timbers', 'Real Salt Lake', 'San Jose Earthquakes',
      'Seattle Sounders', 'Sporting Kansas City', 'St. Louis City',
      'Toronto FC', 'Vancouver Whitecaps'
    ]
  },
  
  // RESTO DEL MUNDO
  'Eredivisie': {
    id: 88,
    name: 'Eredivisie',
    country: 'Netherlands',
    flag: '🇳🇱',
    teams: [
      'Ajax', 'Almere City', 'AZ Alkmaar', 'Excelsior', 'Feyenoord',
      'Fortuna Sittard', 'Go Ahead Eagles', 'Heerenveen', 'Heracles',
      'NEC Nijmegen', 'PEC Zwolle', 'PSV', 'RKC Waalwijk', 'Sparta Rotterdam',
      'Twente', 'Utrecht', 'Vitesse', 'Volendam'
    ]
  },
  'Liga Portugal': {
    id: 94,
    name: 'Liga Portugal',
    country: 'Portugal',
    flag: '🇵🇹',
    teams: [
      'Arouca', 'Benfica', 'Boavista', 'Braga', 'Casa Pia', 'Chaves',
      'Estoril', 'Estrela Amadora', 'Famalicao', 'Farense', 'Gil Vicente',
      'Moreirense', 'Portimonense', 'Porto', 'Rio Ave', 'Sporting CP',
      'Vitoria Guimaraes', 'Vizela'
    ]
  },
  'Super Lig': {
    id: 203,
    name: 'Super Lig',
    country: 'Turkey',
    flag: '🇹🇷',
    teams: [
      'Adana Demirspor', 'Alanyaspor', 'Ankaragucu', 'Antalyaspor',
      'Besiktas', 'Caykur Rizespor', 'Fatih Karagumruk', 'Fenerbahce',
      'Galatasaray', 'Gaziantep', 'Hatayspor', 'Istanbulspor', 'Kasimpasa',
      'Kayserispor', 'Konyaspor', 'Pendikspor', 'Samsunspor', 'Sivasspor',
      'Trabzonspor'
    ]
  },
  'Russian Premier League': {
    id: 235,
    name: 'Russian Premier League',
    country: 'Russia',
    flag: '🇷🇺',
    teams: [
      'Akhmat Grozny', 'CSKA Moscow', 'Dinamo Moscow', 'Fakel Voronezh',
      'Krasnodar', 'Krylya Sovetov', 'Lokomotiv Moscow', 'Nizhny Novgorod',
      'Orenburg', 'Rostov', 'Rubin Kazan', 'Sochi', 'Spartak Moscow',
      'Ural', 'Zenit'
    ]
  }
};

module.exports = leagues;