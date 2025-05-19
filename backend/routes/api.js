const express = require('express');
const router = express.Router();

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'La API está funcionando correctamente' });
});

// Ruta para obtener ligas
router.get('/leagues', (req, res) => {
  // En un entorno real, esto obtendría datos de una API externa o base de datos
  // Por ahora, devolvemos datos de ejemplo
  const leagues = [
    { id: 1, name: 'Liga Española', country: 'España' },
    { id: 2, name: 'Premier League', country: 'Inglaterra' },
    { id: 3, name: 'Serie A', country: 'Italia' },
    { id: 4, name: 'Bundesliga', country: 'Alemania' },
    { id: 5, name: 'Ligue 1', country: 'Francia' }
  ];
  
  res.json({ success: true, data: leagues });
});

// Ruta para obtener equipos por liga
router.get('/teams/:leagueId', (req, res) => {
  const { leagueId } = req.params;
  
  // Datos de ejemplo
  const teams = {
    '1': [ // Liga Española
      { id: 101, name: 'Real Madrid', logo: 'assets/icons/team-placeholder.png' },
      { id: 102, name: 'Barcelona', logo: 'assets/icons/team-placeholder.png' },
      { id: 103, name: 'Atlético Madrid', logo: 'assets/icons/team-placeholder.png' },
      { id: 104, name: 'Sevilla', logo: 'assets/icons/team-placeholder.png' }
    ],
    '2': [ // Premier League
      { id: 201, name: 'Manchester City', logo: 'assets/icons/team-placeholder.png' },
      { id: 202, name: 'Liverpool', logo: 'assets/icons/team-placeholder.png' },
      { id: 203, name: 'Chelsea', logo: 'assets/icons/team-placeholder.png' },
      { id: 204, name: 'Arsenal', logo: 'assets/icons/team-placeholder.png' }
    ],
    '3': [ // Serie A
      { id: 301, name: 'Inter', logo: 'assets/icons/team-placeholder.png' },
      { id: 302, name: 'Milan', logo: 'assets/icons/team-placeholder.png' },
      { id: 303, name: 'Juventus', logo: 'assets/icons/team-placeholder.png' },
      { id: 304, name: 'Roma', logo: 'assets/icons/team-placeholder.png' }
    ],
    '4': [ // Bundesliga
      { id: 401, name: 'Bayern Munich', logo: 'assets/icons/team-placeholder.png' },
      { id: 402, name: 'Borussia Dortmund', logo: 'assets/icons/team-placeholder.png' },
      { id: 403, name: 'RB Leipzig', logo: 'assets/icons/team-placeholder.png' },
      { id: 404, name: 'Bayer Leverkusen', logo: 'assets/icons/team-placeholder.png' }
    ],
    '5': [ // Ligue 1
      { id: 501, name: 'PSG', logo: 'assets/icons/team-placeholder.png' },
      { id: 502, name: 'Marseille', logo: 'assets/icons/team-placeholder.png' },
      { id: 503, name: 'Lyon', logo: 'assets/icons/team-placeholder.png' },
      { id: 504, name: 'Monaco', logo: 'assets/icons/team-placeholder.png' }
    ]
  };
  
  const leagueTeams = teams[leagueId] || [];
  res.json({ success: true, data: leagueTeams });
});

// Ruta para obtener partidos por liga y fecha
router.get('/fixtures/:leagueId/:date?', (req, res) => {
  const { leagueId, date } = req.params;
  
  // En un entorno real, obtendríamos los partidos según la liga y fecha
  // Por ahora, devolvemos datos de ejemplo
  const fixtures = [
    {
      id: 1001,
      date: new Date().toISOString(),
      homeTeam: { id: 101, name: 'Real Madrid', logo: 'assets/icons/team-placeholder.png' },
      awayTeam: { id: 102, name: 'Barcelona', logo: 'assets/icons/team-placeholder.png' },
      league: { id: 1, name: 'Liga Española' }
    },
    {
      id: 1002,
      date: new Date().toISOString(),
      homeTeam: { id: 103, name: 'Atlético Madrid', logo: 'assets/icons/team-placeholder.png' },
      awayTeam: { id: 104, name: 'Sevilla', logo: 'assets/icons/team-placeholder.png' },
      league: { id: 1, name: 'Liga Española' }
    }
  ];
  
  res.json({ success: true, data: fixtures });
});

// Ruta para generar predicciones
router.get('/predict/:fixtureId', (req, res) => {
  const { fixtureId } = req.params;
  
  // En un entorno real, se aplicarían algoritmos de análisis
  // Por ahora, devolvemos una predicción de ejemplo
  const prediction = {
    fixtureId,
    date: new Date().toISOString(),
    homeTeam: { id: 101, name: 'Real Madrid' },
    awayTeam: { id: 102, name: 'Barcelona' },
    league: { id: 1, name: 'Liga Española' },
    confidence: 7.5,
    markets: {
      '1x2': {
        prediction: '1',
        probabilities: { '1': 0.55, 'X': 0.25, '2': 0.20 },
        odds: { '1': 1.82, 'X': 3.60, '2': 4.50 },
        confidence: 7.2
      },
      'btts': {
        prediction: 'Yes',
        probabilities: { 'Yes': 0.65, 'No': 0.35 },
        odds: { 'Yes': 1.75, 'No': 2.15 },
        confidence: 6.8
      },
      'over_under': {
        '1.5': {
          prediction: 'Over',
          probabilities: { 'Over': 0.80, 'Under': 0.20 },
          odds: { 'Over': 1.25, 'Under': 3.50 },
          confidence: 8.5
        },
        '2.5': {
          prediction: 'Over',
          probabilities: { 'Over': 0.60, 'Under': 0.40 },
          odds: { 'Over': 1.85, 'Under': 1.95 },
          confidence: 6.3
        },
        '3.5': {
          prediction: 'Under',
          probabilities: { 'Over': 0.35, 'Under': 0.65 },
          odds: { 'Over': 3.10, 'Under': 1.45 },
          confidence: 7.0
        }
      },
      'corners': {
        '8.5': {
          prediction: 'Over',
          probabilities: { 'Over': 0.70, 'Under': 0.30 },
          odds: { 'Over': 1.65, 'Under': 2.25 },
          confidence: 7.5
        }
      },
      'cards': {
        '4.5': {
          prediction: 'Over',
          probabilities: { 'Over': 0.60, 'Under': 0.40 },
          odds: { 'Over': 1.80, 'Under': 2.00 },
          confidence: 6.2
        }
      },
      'asian_handicap': {
        '-0.5': {
          prediction: 'Home -0.5',
          probabilities: { 'Home': 0.55, 'Away': 0.45 },
          odds: { 'Home': 1.90, 'Away': 1.95 },
          confidence: 5.8
        }
      }
    },
    recommendation: {
      market: 'Over/Under 1.5',
      selection: 'Over',
      odds: 1.25,
      confidence: 8.5
    }
  };
  
  res.json({ success: true, data: prediction });
});

module.exports = router;
