// backend/routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios'); // Usamos axios para hacer peticiones HTTP

// Función para generar predicciones
async function generatePrediction(params) {
  try {
    console.log('Generando predicción con parámetros:', params);
    
    // Transformar parámetros para que coincidan con lo esperado por el backend
    const transformedParams = {
      local_team: params.equipoLocal || params.homeTeam,
      away_team: params.equipoVisitante || params.awayTeam,
      competition: params.liga || params.league,
      // Añadir fecha si existe
      ...(params.fecha && { match_date: params.fecha })
    };
    
    console.log('Parámetros transformados:', transformedParams);
    
    // Supongamos que hay un servicio Python en esta URL
    // Ajusta la URL según corresponda a tu configuración
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000/predict';
    
    const response = await axios.post(pythonServiceUrl, transformedParams);
    const data = response.data;
    
    console.log('Respuesta del servidor Python:', data);
    
    // Manejar diferentes formatos de respuesta
    if (data.prediction) {
      return data.prediction;
    } else if (data.datos) {
      return data.datos;
    } else {
      console.warn('Formato de predicción no reconocido, devolviendo datos completos');
      return data;
    }
  } catch (error) {
    console.error("Error generando predicción:", error);
    // Devolver un objeto con información del error
    throw {
      error: true,
      message: error.message || "Error al generar la predicción",
      details: "Verifica que el servidor Python esté funcionando correctamente"
    };
  }
}

// Ruta para manejar solicitudes de predicción
router.post('/predict', async (req, res) => {
  try {
    const params = req.body;
    const prediction = await generatePrediction(params);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || "Error desconocido",
      details: error.details || "No hay detalles adicionales" 
    });
  }
});

// Función de ayuda para verificar la salud del servicio
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servicio de predicción funcionando correctamente' });
});

module.exports = router;