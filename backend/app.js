// backend/app.js - CORREGIDO PARA USAR TU API.JS EXISTENTE

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE BÁSICO
// ========================================

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Sistema de logging
const log = {
    info: (msg) => console.log(`ℹ️  ${new Date().toISOString()} - ${msg}`),
    warn: (msg) => console.warn(`⚠️  ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.error(`❌ ${new Date().toISOString()} - ${msg}`),
    success: (msg) => console.log(`✅ ${new Date().toISOString()} - ${msg}`)
};

// Middleware para tiempo de procesamiento
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// ========================================
// IMPORTAR Y USAR TUS RUTAS EXISTENTES
// ========================================

// ✅ USAR TU ARCHIVO api.js EXISTENTE
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// ✅ USAR TUS RUTAS DE ANÁLISIS DE VALOR (si existen)
try {
    const valueAnalysisRoutes = require('./routes/valueAnalysisRoutes');
    app.use('/api/value', valueAnalysisRoutes);
    log.info('✅ Rutas de análisis de valor cargadas');
} catch (error) {
    log.warn('⚠️  Rutas de análisis de valor no encontradas (opcional)');
}

// ========================================
// RUTA PRINCIPAL (fuera de /api)
// ========================================

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ========================================
// INFORMACIÓN DEL SISTEMA
// ========================================

// Endpoint de información general (fuera de /api para evitar conflictos)
app.get('/info', (req, res) => {
    res.json({
        name: 'Predictor de Fútbol Premium',
        version: '2.0.0',
        status: 'online',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        endpoints: {
            'GET /': 'Página principal',
            'GET /api/health': 'Estado del servicio',
            'POST /api/predict': 'Predicción inteligente',
            'POST /api/predict/simple': 'Predicción simple',
            'POST /api/predict/advanced': 'Predicción avanzada',
            'GET /api/enhanced/leagues': 'Obtener ligas',
            'POST /api/enhanced/predict/complete': 'Predicción completa',
            'POST /api/value/analyze': 'Análisis de valor (si disponible)'
        }
    });
});

// ========================================
// MANEJO DE ERRORES
// ========================================

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    log.error(`❌ Error no manejado: ${error.message}`);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
        timestamp: new Date().toISOString()
    });
});

// Ruta 404 para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        requested: req.originalUrl,
        available_endpoints: {
            'GET /': 'Página principal',
            'GET /info': 'Información del sistema',
            'GET /api/health': 'Estado del servicio',
            'POST /api/predict': 'Predicción inteligente',
            'GET /api/enhanced/leagues': 'Obtener ligas disponibles',
            'POST /api/enhanced/predict/complete': 'Predicción completa con estadísticas'
        },
        tip: 'Visita /info para ver todos los endpoints disponibles'
    });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(65));
    console.log('🚀 PREDICTOR DE FÚTBOL PREMIUM - SERVIDOR INICIADO');
    console.log('='.repeat(65));
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`📊 Info: http://localhost:${PORT}/info`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(65));
    console.log('📡 Endpoints principales:');
    console.log('   POST /api/predict - Predicción básica');
    console.log('   GET  /api/enhanced/leagues - Ligas disponibles');
    console.log('   POST /api/enhanced/predict/complete - Predicción completa');
    console.log('   GET  /api/health - Estado del servicio');
    console.log('='.repeat(65));
    console.log('✅ Configuración:');
    console.log('   🟢 Backend Node.js: ONLINE');
    console.log('   🟢 Rutas modulares: CONFIGURADAS');
    console.log('   🟢 Frontend estático: DISPONIBLE');
    console.log('   🔍 Usando tu archivo routes/api.js existente');
    console.log('='.repeat(65));
    console.log('\n🎯 Para probar:');
    console.log('   1. Abre http://localhost:3000');
    console.log('   2. O visita http://localhost:3000/info para endpoints');
    console.log('\n🔧 Para detener: Presiona Ctrl+C');
    console.log('');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app;