const axios = require('axios');

// URL base para la API de Python
const PYTHON_API_URL = 'http://localhost:5000';

/**
 * Servicio para comunicarse con la API de Python
 */
class PredictionService {
  /**
   * Verificar si el servicio de Python está activo
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/api/health`);
      return response.data;
    } catch (error) {
      console.error('Error al verificar estado del servicio de predicción:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Obtener predicción para un partido
   * @param {Object} matchData - Datos del partido
   */
  async getPrediction(matchData) {
    try {
      const response = await axios.post(`${PYTHON_API_URL}/api/predict`, matchData);
      return response.data;
    } catch (error) {
      console.error('Error al obtener predicción:', error);
      throw new Error(`Error al obtener predicción: ${error.message}`);
    }
  }
}

module.exports = new PredictionService();