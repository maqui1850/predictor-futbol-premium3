// backend/services/pythonClient.js
// 🐍 Cliente para conectar con el servicio Python de Machine Learning

const axios = require('axios');

// Configuración del servicio Python
const PYTHON_SERVICE_URL = 'http://localhost:5000';
const TIMEOUT = 10000; // 10 segundos

const pythonClient = {
  // 🏥 Verificar si el servicio Python está disponible
  async checkHealth() {
    try {
      console.log('🔍 Verificando estado del servicio Python...');
      
      const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
        timeout: 3000
      });
      
      console.log('✅ Servicio Python disponible:', response.data);
      return {
        status: 'online',
        data: response.data
      };
      
    } catch (error) {
      console.log('❌ Servicio Python no disponible:', error.message);
      return {
        status: 'offline',
        error: error.message
      };
    }
  },
  
  // 🤖 Obtener predicción del modelo de Machine Learning
  async getPrediction(matchData) {
    try {
      console.log('🚀 Solicitando predicción ML para:', matchData);
      
      // Preparar datos para el servicio Python
      const requestData = {
        home_team: matchData.homeTeam,
        away_team: matchData.awayTeam,
        league: matchData.league,
        date: matchData.date || new Date().toISOString().split('T')[0]
      };
      
      const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, requestData, {
        timeout: TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Predicción ML recibida:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error al obtener predicción ML:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Servicio Python no disponible');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('Timeout en servicio Python');
      } else {
        throw new Error(`Error en predicción ML: ${error.message}`);
      }
    }
  },
  
  // 📊 Obtener estadísticas del modelo ML
  async getModelStats() {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/stats`, {
        timeout: 5000
      });
      
      return response.data;
      
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener estadísticas ML:', error.message);
      return {
        model_accuracy: 'N/A',
        predictions_today: 0,
        model_version: 'offline'
      };
    }
  },
  
  // 🧪 Ejecutar test del servicio Python
  async runTest() {
    try {
      console.log('🧪 Ejecutando test del servicio Python...');
      
      const testData = {
        home_team: 'Real Madrid',
        away_team: 'Barcelona',
        league: 'La Liga',
        date: new Date().toISOString().split('T')[0]
      };
      
      const prediction = await this.getPrediction(testData);
      
      console.log('✅ Test ML exitoso:', prediction);
      return {
        success: true,
        prediction
      };
      
    } catch (error) {
      console.error('❌ Test ML falló:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // 🔄 Verificar conexión con retry
  async checkConnectionWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      const health = await this.checkHealth();
      
      if (health.status === 'online') {
        return health;
      }
      
      if (i < maxRetries - 1) {
        console.log(`🔄 Reintentando conexión Python (${i + 1}/${maxRetries})...`);
        await this.sleep(2000); // Esperar 2 segundos
      }
    }
    
    return { status: 'offline', error: 'Max retries reached' };
  },
  
  // 💤 Función helper para esperar
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

module.exports = pythonClient;