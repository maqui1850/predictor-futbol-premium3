// backend/app.js - Servidor principal del Predictor de Fútbol Premium
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas y servicios
const predictionRoutes = require('./routes/predictionRoutes');
const pythonClient = require('./services/pythonClient');

const app = express();
const PORT = process.env.PORT || 3000;

// 🛠️ Middlewares
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📊 Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  if (req.method === 'POST') {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  
  next();
});

// 🌐 Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 🛣️ Rutas de la API
app.use('/api', predictionRoutes);

// 🏠 Ruta principal - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 🔍 Ruta de información del sistema
app.get('/info', async (req, res) => {
  const pythonStatus = await pythonClient.checkHealth();
  
  res.json({
    service: 'Predictor de Fútbol Premium',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    components: {
      backend: 'online',
      frontend: 'online',
      python_ml: pythonStatus.status,
      models: ['simple', 'advanced_ml']
    },
    endpoints: {
      main: '/',
      predict: '/api/predict',
      health: '/api/health',
      test: '/api/test',
      stats: '/api/stats'
    }
  });
});

// ❌ Manejo de errores 404
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  
  if (req.originalUrl.startsWith('/api/')) {
    // Error de API
    res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.originalUrl
    });
  } else {
    // Redirigir al frontend para rutas no encontradas
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// 🚨 Manejo global de errores
app.use((error, req, res, next) => {
  console.error('🚨 Error del servidor:', error);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// 🚀 Iniciar servidor
async function startServer() {
  try {
    // Verificar conexión con servicio Python
    console.log('🔍 Verificando servicios...');
    const pythonStatus = await pythonClient.checkHealth();
    
    if (pythonStatus.status === 'online') {
      console.log('✅ Servicio Python ML: DISPONIBLE');
    } else {
      console.log('⚠️ Servicio Python ML: NO DISPONIBLE (usando modelo simple)');
    }
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 PREDICTOR DE FÚTBOL PREMIUM - SERVIDOR INICIADO');
      console.log('='.repeat(60));
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔧 API: http://localhost:${PORT}/api`);
      console.log(`📊 Info: http://localhost:${PORT}/info`);
      console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
      console.log('='.repeat(60));
      console.log('📋 Endpoints disponibles:');
      console.log('  POST /api/predict - Generar predicción');
      console.log('  GET  /api/health  - Estado del servicio');
      console.log('  GET  /api/stats   - Estadísticas');
      console.log('  GET  /api/test    - Test automático');
      console.log('='.repeat(60));
      
      // Estado de los servicios
      console.log('🔧 Estado de servicios:');
      console.log(`  ✅ Backend Node.js: ONLINE (Puerto ${PORT})`);
      console.log(`  ${pythonStatus.status === 'online' ? '✅' : '⚠️'} Python ML: ${pythonStatus.status.toUpperCase()}`);
      console.log('  ✅ Frontend: DISPONIBLE');
      console.log('='.repeat(60) + '\n');
    });
    
    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('📴 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('\n📴 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// 🚀 Ejecutar servidor
startServer();

module.exports = app;