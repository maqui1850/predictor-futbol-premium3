// backend/config/leagues.js
module.exports = {
  // EUROPA
  'Premier League': {
    id: 39,
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    teams: [
      'Manchester City', 'Manchester United', 'Liverpool', 'Chelsea', 'Arsenal',
      'Tottenham', 'Newcastle', 'Brighton', 'West Ham', 'Aston Villa',
      'Crystal Palace', 'Brentford', 'Fulham', 'Wolves', 'Everton',
      'Nottingham Forest', 'Bournemouth', 'Sheffield United', 'Burnley', 'Luton Town'
    ]
  },
  'La Liga': {
    id: 140,
    country: 'Spain',
    flag: '🇪🇸',
    teams: [
      'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Real Sociedad', 'Athletic Bilbao',
      'Real Betis', 'Villarreal', 'Valencia', 'Sevilla', 'Girona',
      'Las Palmas', 'Getafe', 'Celta Vigo', 'Rayo Vallecano', 'Mallorca',
      'Alaves', 'Cadiz', 'Granada', 'Almeria', 'Osasuna'
    ]
  },
  'Serie A': {
    id: 135,
    country: 'Italy',
    flag: '🇮🇹',
    teams: [
      'Inter', 'AC Milan', 'Juventus', 'Napoli', 'Roma',
      'Atalanta', 'Lazio', 'Fiorentina', 'Bologna', 'Torino',
      'Monza', 'Udinese', 'Sassuolo', 'Empoli', 'Salernitana',
      'Lecce', 'Cagliari', 'Genoa', 'Verona', 'Frosinone'
    ]
  },
  'Bundesliga': {
    id: 78,
    country: 'Germany',
    flag: '🇩🇪',
    teams: [
      'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Union Berlin',
      'Eintracht Frankfurt', 'Freiburg', 'Hoffenheim', 'Werder Bremen', 'Augsburg',
      'Stuttgart', 'Wolfsburg', 'Borussia Monchengladbach', 'Mainz', 'Koln',
      'Heidenheim', 'Darmstadt', 'Bochum'
    ]
  },
  'Ligue 1': {
    id: 61,
    country: 'France',
    flag: '🇫🇷',
    teams: [
      'PSG', 'Monaco', 'Marseille', 'Lille', 'Nice',
      'Lyon', 'Lens', 'Rennes', 'Reims', 'Toulouse',
      'Montpellier', 'Strasbourg', 'Brest', 'Nantes', 'Le Havre',
      'Metz', 'Lorient', 'Clermont'
    ]
  },
  'Eredivisie': {
    id: 88,
    country: 'Netherlands',
    flag: '🇳🇱',
    teams: [
      'Ajax', 'PSV', 'Feyenoord', 'AZ Alkmaar', 'Twente',
      'Vitesse', 'Utrecht', 'Go Ahead Eagles', 'Heerenveen', 'Fortuna Sittard',
      'RKC Waalwijk', 'NEC', 'Sparta Rotterdam', 'Excelsior', 'Almere City',
      'PEC Zwolle', 'Volendam', 'Heracles'
    ]
  },
  'Primeira Liga': {
    id: 94,
    country: 'Portugal',
    flag: '🇵🇹',
    teams: [
      'Benfica', 'Porto', 'Sporting CP', 'Braga', 'Vitoria Guimaraes',
      'Famalicao', 'Chaves', 'Casa Pia', 'Rio Ave', 'Boavista',
      'Arouca', 'Vizela', 'Portimonense', 'Gil Vicente', 'Estrela',
      'Moreirense', 'Estoril', 'Farense'
    ]
  },
  
  // AMERICAS
  'Liga MX': {
    id: 262,
    country: 'Mexico',
    flag: '🇲🇽',
    teams: [
      'Club America', 'Chivas', 'Cruz Azul', 'Pumas', 'Tigres',
      'Monterrey', 'Santos Laguna', 'Toluca', 'Leon', 'Pachuca',
      'Necaxa', 'Queretaro', 'Atlas', 'Mazatlan', 'Puebla',
      'San Luis', 'Tijuana', 'FC Juarez'
    ]
  },
  'Liga Argentina': {
    id: 128,
    country: 'Argentina',
    flag: '🇦🇷',
    teams: [
      'River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo',
      'Estudiantes', 'Velez Sarsfield', 'Lanus', 'Belgrano', 'Defensa y Justicia',
      'Talleres', 'Godoy Cruz', 'Argentinos Juniors', 'Instituto', 'Platense',
      'Rosario Central', 'Newell\'s', 'Gimnasia', 'Colon', 'Union',
      'Huracan', 'Barracas Central', 'Banfield', 'Tigre', 'Sarmiento',
      'Central Cordoba', 'Arsenal', 'Atletico Tucuman'
    ]
  },
  'Brasileirao': {
    id: 71,
    country: 'Brazil',
    flag: '🇧🇷',
    teams: [
      'Palmeiras', 'Flamengo', 'Fluminense', 'Atletico Mineiro', 'Gremio',
      'Internacional', 'Sao Paulo', 'Corinthians', 'Botafogo', 'Santos',
      'Fortaleza', 'Cruzeiro', 'Bragantino', 'Athletico-PR', 'Bahia',
      'Vasco', 'Cuiaba', 'Goias', 'Coritiba', 'America-MG'
    ]
  },
  'MLS': {
    id: 253,
    country: 'USA',
    flag: '🇺🇸',
    teams: [
      'Inter Miami', 'LA Galaxy', 'LAFC', 'Atlanta United', 'Seattle Sounders',
      'Portland Timbers', 'New York City FC', 'New York Red Bulls', 'Philadelphia Union', 'Columbus Crew',
      'FC Cincinnati', 'Nashville SC', 'Orlando City', 'Charlotte FC', 'Toronto FC',
      'CF Montreal', 'Vancouver Whitecaps', 'Austin FC', 'Real Salt Lake', 'Minnesota United',
      'Houston Dynamo', 'St. Louis City', 'Sporting KC', 'FC Dallas', 'Colorado Rapids',
      'San Jose Earthquakes', 'Chicago Fire', 'New England Revolution', 'DC United'
    ]
  },
  'Liga Colombiana': {
    id: 239,
    country: 'Colombia',
    flag: '🇨🇴',
    teams: [
      'Atletico Nacional', 'Millonarios', 'America de Cali', 'Deportivo Cali', 'Junior',
      'Santa Fe', 'Once Caldas', 'Deportes Tolima', 'Medellin', 'La Equidad',
      'Bucaramanga', 'Pereira', 'Envigado', 'Aguilas Doradas', 'Patriotas',
      'Boyaca Chico', 'Alianza Petrolera', 'Jaguares', 'Union Magdalena', 'Atletico Huila'
    ]
  },
  
  // ASIA
  'J-League': {
    id: 98,
    country: 'Japan',
    flag: '🇯🇵',
    teams: [
      'Yokohama F-Marinos', 'Kawasaki Frontale', 'Vissel Kobe', 'Nagoya Grampus', 'Cerezo Osaka',
      'FC Tokyo', 'Kashima Antlers', 'Sanfrecce Hiroshima', 'Gamba Osaka', 'Urawa Red Diamonds',
      'Consadole Sapporo', 'Avispa Fukuoka', 'Kashiwa Reysol', 'Shonan Bellmare', 'Albirex Niigata',
      'Kyoto Sanga', 'Sagan Tosu', 'Yokohama FC'
    ]
  },
  'K-League': {
    id: 292,
    country: 'South Korea',
    flag: '🇰🇷',
    teams: [
      'Ulsan Hyundai', 'Jeonbuk Motors', 'Pohang Steelers', 'Incheon United', 'FC Seoul',
      'Suwon Samsung', 'Jeju United', 'Daegu FC', 'Gangwon FC', 'Gwangju FC',
      'Daejeon Hana', 'Suwon FC'
    ]
  },
  'Saudi Pro League': {
    id: 307,
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    teams: [
      'Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Al-Ahli', 'Al-Shabab',
      'Al-Taawoun', 'Al-Fateh', 'Al-Ettifaq', 'Al-Raed', 'Al-Wehda',
      'Damac', 'Al-Khaleej', 'Al-Fayha', 'Al-Tai', 'Abha',
      'Al-Hazem', 'Al-Riyadh', 'Al-Akhdoud'
    ]
  },
  
  // OTROS
  'Championship': {
    id: 40,
    country: 'England',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    teams: [
      'Leicester', 'Leeds United', 'Southampton', 'West Brom', 'Norwich',
      'Coventry', 'Preston', 'Cardiff', 'Swansea', 'Bristol City',
      'Millwall', 'Blackburn', 'Sunderland', 'Watford', 'Middlesbrough',
      'QPR', 'Stoke City', 'Birmingham', 'Plymouth', 'Ipswich',
      'Hull City', 'Huddersfield', 'Sheffield Wednesday', 'Rotherham'
    ]
  },
  'Superliga Turquia': {
    id: 203,
    country: 'Turkey',
    flag: '🇹🇷',
    teams: [
      'Galatasaray', 'Fenerbahce', 'Besiktas', 'Trabzonspor', 'Istanbul Basaksehir',
      'Konyaspor', 'Adana Demirspor', 'Antalyaspor', 'Kasimpasa', 'Sivasspor',
      'Kayserispor', 'Alanyaspor', 'Fatih Karagumruk', 'Gaziantep', 'Hatayspor',
      'Istanbulspor', 'Ankaragucu', 'Rizespor', 'Samsunspor', 'Pendikspor'
    ]
  },
  'Russian Premier League': {
    id: 235,
    country: 'Russia',
    flag: '🇷🇺',
    teams: [
      'Zenit', 'Spartak Moscow', 'CSKA Moscow', 'Dynamo Moscow', 'Lokomotiv Moscow',
      'Krasnodar', 'Rostov', 'Sochi', 'Akhmat Grozny', 'Rubin Kazan',
      'Ural', 'Orenburg', 'Torpedo Moscow', 'Krylia Sovetov', 'Nizhny Novgorod',
      'Fakel Voronezh'
    ]
  },
  'Allsvenskan': {
    id: 113,
    country: 'Sweden',
    flag: '🇸🇪',
    teams: [
      'Malmo FF', 'AIK', 'Djurgarden', 'Hammarby', 'Elfsborg',
      'Hacken', 'Norrkoping', 'Sirius', 'Mjallby', 'Varberg',
      'Kalmar', 'Goteborg', 'Brommapojkarna', 'Halmstad', 'Degerfors',
      'Varnamo'
    ]
  }
};