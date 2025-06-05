// backend/routes/predictionRoutes.js
const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// 📊 Ruta principal para predicciones
router.post('/predict', predictionController.analyzeMatch);

// 🏥 Ruta de salud del servicio
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Predictor de Fútbol Premium',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      predict: '/api/predict',
      health: '/api/health'
    }
  });
});

// 📈 Ruta para estadísticas del sistema
router.get('/stats', (req, res) => {
  res.json({
    predictions_today: Math.floor(Math.random() * 50) + 10,
    accuracy: '68%',
    models_available: ['simple', 'advanced_ml'],
    markets: ['1x2', 'btts', 'over_under', 'corners', 'cards', 'handicap']
  });
});

// 🧪 Ruta de test para desarrollo
router.get('/test', (req, res) => {
  const testData = {
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    date: new Date().toISOString().split('T')[0]
  };
  
  // Usar el controlador para generar predicción de prueba
  req.body = testData;
  predictionController.analyzeMatch(req, res);
});

module.exports = router;