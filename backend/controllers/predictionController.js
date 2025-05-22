const simplePredictionModel = require('../models/simplePredictionModel');

// Controlador para predicciones
const predictionController = {
  // Obtener predicción simplificada
  analyzeMatch(req, res) {
    try {
      console.log('Analizando partido:', req.body);
      const { homeTeam, awayTeam, league, date } = req.body;
      
      if (!homeTeam || !awayTeam) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren los equipos local y visitante'
        });
      }
      
      // Obtener predicción del modelo
      const prediction = simplePredictionModel.predict(homeTeam, awayTeam);
      
      // Añadir detalles para mostrar en UI
      const result = {
        success: true,
        data: {
          ...prediction,
          fecha: date || new Date().toISOString().split('T')[0],
          liga: league || 'La Liga',
          analisis: {
            local: `${homeTeam} tiene una probabilidad del ${(prediction.victoria_local * 100).toFixed(1)}% de ganar este partido.`,
            visitante: `${awayTeam} tiene una probabilidad del ${(prediction.victoria_visitante * 100).toFixed(1)}% de ganar este partido.`,
            general: `Este es un partido bastante ${prediction.victoria_local > 0.6 ? 'desigual a favor del local' : 
                                (prediction.victoria_visitante > 0.6 ? 'desigual a favor del visitante' : 
                                'equilibrado')}.`
          }
        }
      };
      
      return res.json(result);
    } catch (error) {
      console.error('Error en análisis de partido:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al analizar el partido',
        error: process.env.NODE_ENV === 'development' ? error.message : {}
      });
    }
  }
};

module.exports = predictionController;