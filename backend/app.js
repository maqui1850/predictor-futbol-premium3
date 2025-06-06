// backend/app.js - VERSIÓN COMPLETAMENTE FUNCIONAL

const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios').default;

const app = express();
const PORT = process.env.PORT || 3000;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Busca donde están las otras rutas (cerca de línea 20-30)
// Agrega DESPUÉS de las otras rutas:

const valueAnalysisRoutes = require('./routes/valueAnalysisRoutes');

// Luego busca donde se usan las rutas (app.use)
// Agrega:

app.use('/api/value', valueAnalysisRoutes);
// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));

// Sistema de logging mejorado
const log = {
    info: (msg) => console.log(`ℹ️  ${new Date().toISOString()} - ${msg}`),
    warn: (msg) => console.warn(`⚠️  ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.error(`❌ ${new Date().toISOString()} - ${msg}`),
    success: (msg) => console.log(`✅ ${new Date().toISOString()} - ${msg}`)
};

// Modelo de predicción simple mejorado
class SimplePredictionModel {
    constructor() {
        // Base de datos mejorada de fuerzas de equipos
        this.teamStrengths = {
            // Premier League
            'Manchester City': { attack: 0.95, defense: 0.88, overall: 0.92 },
            'Arsenal': { attack: 0.87, defense: 0.82, overall: 0.85 },
            'Liverpool': { attack: 0.89, defense: 0.79, overall: 0.84 },
            'Chelsea': { attack: 0.81, defense: 0.80, overall: 0.81 },
            'Manchester United': { attack: 0.79, defense: 0.76, overall: 0.78 },
            'Tottenham': { attack: 0.83, defense: 0.72, overall: 0.78 },
            'Newcastle': { attack: 0.74, defense: 0.79, overall: 0.77 },
            'Brighton': { attack: 0.72, defense: 0.74, overall: 0.73 },
            'West Ham': { attack: 0.69, defense: 0.70, overall: 0.70 },
            'Aston Villa': { attack: 0.71, defense: 0.68, overall: 0.70 },
            
            // La Liga
            'Real Madrid': { attack: 0.94, defense: 0.86, overall: 0.90 },
            'Barcelona': { attack: 0.91, defense: 0.81, overall: 0.86 },
            'Atlético Madrid': { attack: 0.80, defense: 0.89, overall: 0.85 },
            'Sevilla': { attack: 0.77, defense: 0.82, overall: 0.80 },
            'Real Sociedad': { attack: 0.76, defense: 0.78, overall: 0.77 },
            'Real Betis': { attack: 0.74, defense: 0.73, overall: 0.74 },
            'Villarreal': { attack: 0.75, defense: 0.76, overall: 0.76 },
            'Valencia': { attack: 0.68, defense: 0.71, overall: 0.70 },
            'Athletic Bilbao': { attack: 0.70, defense: 0.74, overall: 0.72 },
            'Getafe': { attack: 0.62, defense: 0.77, overall: 0.70 },
            
            // Bundesliga
            'Bayern Munich': { attack: 0.93, defense: 0.84, overall: 0.89 },
            'Borussia Dortmund': { attack: 0.88, defense: 0.76, overall: 0.82 },
            'RB Leipzig': { attack: 0.82, defense: 0.81, overall: 0.82 },
            'Union Berlin': { attack: 0.74, defense: 0.83, overall: 0.79 },
            'SC Freiburg': { attack: 0.73, defense: 0.79, overall: 0.76 },
            'Bayer Leverkusen': { attack: 0.79, defense: 0.73, overall: 0.76 },
            
            // Serie A
            'Inter Milan': { attack: 0.87, defense: 0.85, overall: 0.86 },
            'AC Milan': { attack: 0.83, defense: 0.81, overall: 0.82 },
            'Juventus': { attack: 0.81, defense: 0.83, overall: 0.82 },
            'Napoli': { attack: 0.85, defense: 0.78, overall: 0.82 },
            'AS Roma': { attack: 0.78, defense: 0.76, overall: 0.77 },
            'Lazio': { attack: 0.80, defense: 0.74, overall: 0.77 },
            'Atalanta': { attack: 0.84, defense: 0.70, overall: 0.77 },
            
            // Ligue 1
            'Paris Saint-Germain': { attack: 0.92, defense: 0.79, overall: 0.86 },
            'AS Monaco': { attack: 0.79, defense: 0.74, overall: 0.77 },
            'Lille': { attack: 0.74, defense: 0.78, overall: 0.76 },
            'Olympique Marseille': { attack: 0.76, defense: 0.73, overall: 0.75 },
            'Olympique Lyon': { attack: 0.74, defense: 0.71, overall: 0.73 },
            'Nice': { attack: 0.72, defense: 0.76, overall: 0.74 }
        };
        
        // Factores contextuales
        this.homeAdvantage = 0.15;
        this.formFactors = {
            excellent: 0.1,
            good: 0.05,
            average: 0.0,
            poor: -0.05,
            terrible: -0.1
        };
    }
    
    getTeamStrength(teamName) {
        return this.teamStrengths[teamName] || {
            attack: 0.65,
            defense: 0.65,
            overall: 0.65
        };
    }
    
    predict(homeTeam, awayTeam, league = 'Premier League', additionalData = {}) {
        const homeStats = this.getTeamStrength(homeTeam);
        const awayStats = this.getTeamStrength(awayTeam);
        
        // Aplicar ventaja de local
        const adjustedHomeStrength = Math.min(1.0, homeStats.overall + this.homeAdvantage);
        const adjustedAwayStrength = awayStats.overall;
        
        // Calcular probabilidades base
        const totalStrength = adjustedHomeStrength + adjustedAwayStrength + 0.5; // factor empate
        
        let homeWinProb = adjustedHomeStrength / totalStrength;
        let awayWinProb = adjustedAwayStrength / totalStrength;
        let drawProb = 0.5 / totalStrength;
        
        // Normalizar para que sumen 1
        const total = homeWinProb + drawProb + awayWinProb;
        homeWinProb /= total;
        drawProb /= total;
        awayWinProb /= total;
        
        // Calcular goles esperados
        const homeGoalsExpected = this.calculateExpectedGoals(homeStats.attack, awayStats.defense, true);
        const awayGoalsExpected = this.calculateExpectedGoals(awayStats.attack, homeStats.defense, false);
        
        // Calcular mercados adicionales
        const bttsProb = this.calculateBTTSProbability(homeGoalsExpected, awayGoalsExpected);
        const over25Prob = this.calculateOver25Probability(homeGoalsExpected, awayGoalsExpected);
        
        // Determinar nivel de confianza
        const confidenceLevel = this.calculateConfidence(homeWinProb, drawProb, awayWinProb);
        
        return {
            victoria_local: parseFloat(homeWinProb.toFixed(3)),
            empate: parseFloat(drawProb.toFixed(3)),
            victoria_visitante: parseFloat(awayWinProb.toFixed(3)),
            homeWinProbability: parseFloat(homeWinProb.toFixed(3)),
            drawProbability: parseFloat(drawProb.toFixed(3)),
            awayWinProbability: parseFloat(awayWinProb.toFixed(3)),
            goles_esperados_local: parseFloat(homeGoalsExpected.toFixed(2)),
            goles_esperados_visitante: parseFloat(awayGoalsExpected.toFixed(2)),
            expectedGoals: {
                home: parseFloat(homeGoalsExpected.toFixed(2)),
                away: parseFloat(awayGoalsExpected.toFixed(2)),
                total: parseFloat((homeGoalsExpected + awayGoalsExpected).toFixed(2))
            },
            mercados_adicionales: {
                ambos_equipos_marcan: parseFloat(bttsProb.toFixed(3)),
                mas_2_5_goles: parseFloat(over25Prob.toFixed(3)),
                handicap_local: this.calculateHandicap(homeWinProb, awayWinProb),
                prob_handicap_local: parseFloat((homeWinProb * 1.2).toFixed(3))
            },
            markets: {
                btts: {
                    yes: parseFloat(bttsProb.toFixed(3)),
                    no: parseFloat((1 - bttsProb).toFixed(3))
                },
                overUnder: {
                    over2_5: parseFloat(over25Prob.toFixed(3)),
                    under2_5: parseFloat((1 - over25Prob).toFixed(3))
                }
            },
            analisis: {
                local: `${homeTeam} tiene una probabilidad del ${(homeWinProb * 100).toFixed(1)}% de ganar este partido jugando en casa.`,
                visitante: `${awayTeam} tiene una probabilidad del ${(awayWinProb * 100).toFixed(1)}% de ganar jugando como visitante.`,
                general: this.generateAnalysis(homeTeam, awayTeam, homeWinProb, drawProb, awayWinProb, homeGoalsExpected, awayGoalsExpected)
            },
            confianza: confidenceLevel,
            confidence: this.mapConfidenceToNumber(confidenceLevel),
            timestamp: new Date().toISOString(),
            equipo_local: homeTeam,
            equipo_visitante: awayTeam,
            liga: league,
            modelo_utilizado: 'Algoritmo Estadístico Avanzado'
        };
    }
    
    calculateExpectedGoals(attackStrength, defenseStrength, isHome) {
        const baseGoals = isHome ? 1.4 : 1.1; // Media histórica
        const attackFactor = attackStrength * 1.5;
        const defenseFactor = (1 - defenseStrength) * 1.2;
        
        return Math.max(0.1, baseGoals * attackFactor * defenseFactor);
    }
    
    calculateBTTSProbability(homeGoals, awayGoals) {
        // Probabilidad de que ambos equipos marquen al menos 1 gol
        const homeScoreProb = 1 - Math.exp(-homeGoals);
        const awayScoreProb = 1 - Math.exp(-awayGoals);
        
        return homeScoreProb * awayScoreProb;
    }
    
    calculateOver25Probability(homeGoals, awayGoals) {
        const totalGoals = homeGoals + awayGoals;
        // Usando distribución de Poisson
        const lambda = totalGoals;
        
        // P(X > 2.5) = 1 - P(X <= 2)
        let probUnder25 = 0;
        for (let k = 0; k <= 2; k++) {
            probUnder25 += Math.pow(lambda, k) * Math.exp(-lambda) / this.factorial(k);
        }
        
        return 1 - probUnder25;
    }
    
    factorial(n) {
        if (n <= 1) return 1;
        return n * this.factorial(n - 1);
    }
    
    calculateHandicap(homeProb, awayProb) {
        const difference = homeProb - awayProb;
        if (difference > 0.3) return -1.5;
        if (difference > 0.15) return -1;
        if (difference > 0.05) return -0.5;
        if (difference < -0.3) return 1.5;
        if (difference < -0.15) return 1;
        if (difference < -0.05) return 0.5;
        return 0;
    }
    
    calculateConfidence(homeProb, drawProb, awayProb) {
        const maxProb = Math.max(homeProb, drawProb, awayProb);
        const entropy = -(homeProb * Math.log2(homeProb) + drawProb * Math.log2(drawProb) + awayProb * Math.log2(awayProb));
        
        if (maxProb > 0.7) return 'muy_alta';
        if (maxProb > 0.6) return 'alta';
        if (maxProb > 0.45) return 'media';
        if (maxProb > 0.35) return 'baja';
        return 'muy_baja';
    }
    
    mapConfidenceToNumber(confidence) {
        const mapping = {
            'muy_alta': 9,
            'alta': 7.5,
            'media': 6,
            'baja': 4,
            'muy_baja': 2
        };
        return mapping[confidence] || 6;
    }
    
    generateAnalysis(homeTeam, awayTeam, homeProb, drawProb, awayProb, homeGoals, awayGoals) {
        const totalGoals = homeGoals + awayGoals;
        const maxProb = Math.max(homeProb, drawProb, awayProb);
        
        let analysis = '';
        
        if (homeProb === maxProb) {
            analysis = `${homeTeam} es favorito con ${(homeProb * 100).toFixed(1)}% de probabilidad. `;
        } else if (awayProb === maxProb) {
            analysis = `${awayTeam} es favorito a pesar de jugar fuera, con ${(awayProb * 100).toFixed(1)}% de probabilidad. `;
        } else {
            analysis = `Partido muy equilibrado con ${(drawProb * 100).toFixed(1)}% de probabilidad de empate. `;
        }
        
        if (totalGoals > 3) {
            analysis += `Se espera un partido con muchos goles (${totalGoals.toFixed(1)} goles esperados).`;
        } else if (totalGoals < 2) {
            analysis += `Se anticipa un partido con pocos goles (${totalGoals.toFixed(1)} goles esperados).`;
        } else {
            analysis += `Partido con producción ofensiva moderada (${totalGoals.toFixed(1)} goles esperados).`;
        }
        
        return analysis;
    }
}

// Instancia del modelo de predicción
const predictionModel = new SimplePredictionModel();

// Cliente para servicio Python
class PythonServiceClient {
    constructor() {
        this.baseUrl = PYTHON_SERVICE_URL;
        this.timeout = 8000;
        this.retries = 2;
    }
    
    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/health`, {
                timeout: this.timeout
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
    
    async predict(matchData) {
        for (let i = 0; i < this.retries; i++) {
            try {
                const response = await axios.post(`${this.baseUrl}/api/predict`, matchData, {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 200 && response.data) {
                    return response.data;
                }
            } catch (error) {
                log.warn(`Python service attempt ${i + 1} failed: ${error.message}`);
                if (i === this.retries - 1) {
                    throw error;
                }
                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw new Error('Python service unavailable after retries');
    }
}

const pythonClient = new PythonServiceClient();

// Rutas principales

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
            backend: 'online',
            python: 'checking...'
        }
    });
});

// Verificar estado de servicios
app.get('/api/status', async (req, res) => {
    try {
        const pythonStatus = await pythonClient.checkHealth();
        
        res.json({
            backend: {
                status: 'online',
                port: PORT,
                uptime: process.uptime()
            },
            python: {
                status: pythonStatus ? 'online' : 'offline',
                url: PYTHON_SERVICE_URL
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error checking services',
            message: error.message
        });
    }
});

// Predicción inteligente (intenta avanzada, fallback a simple)
app.post('/api/predict', async (req, res) => {
    try {
        log.info('📊 Nueva solicitud de predicción recibida');
        const { homeTeam, awayTeam, league, date } = req.body;
        
        // Validación
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos: homeTeam y awayTeam son obligatorios'
            });
        }
        
        log.info(`🏠 ${homeTeam} vs ✈️  ${awayTeam} (${league || 'Liga no especificada'})`);
        
        let prediction = null;
        let modelUsed = 'simple';
        
        // Intentar predicción avanzada primero
        try {
            const pythonOnline = await pythonClient.checkHealth();
            if (pythonOnline) {
                log.info('🤖 Intentando predicción con IA avanzada...');
                prediction = await pythonClient.predict({
                    home_team: homeTeam,
                    away_team: awayTeam,
                    league: league || 'Unknown',
                    date: date || new Date().toISOString().split('T')[0]
                });
                modelUsed = 'advanced';
                log.success('✅ Predicción avanzada exitosa');
            }
        } catch (error) {
            log.warn(`⚠️  Predicción avanzada falló: ${error.message}`);
        }
        
        // Fallback a modelo simple
        if (!prediction) {
            log.info('🔄 Usando modelo de predicción simple...');
            prediction = predictionModel.predict(homeTeam, awayTeam, league);
            log.success('✅ Predicción simple exitosa');
        }
        
        // Respuesta exitosa
        const response = {
            success: true,
            data: prediction,
            meta: {
                modelUsed,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - req.startTime || 0
            }
        };
        
        res.json(response);
        log.success(`🎯 Predicción enviada exitosamente (modelo: ${modelUsed})`);
        
    } catch (error) {
        log.error(`❌ Error en predicción: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Predicción simple forzada
app.post('/api/predict/simple', async (req, res) => {
    try {
        const { homeTeam, awayTeam, league } = req.body;
        
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({
                success: false,
                error: 'homeTeam y awayTeam son requeridos'
            });
        }
        
        log.info(`🔢 Predicción simple: ${homeTeam} vs ${awayTeam}`);
        
        const prediction = predictionModel.predict(homeTeam, awayTeam, league);
        
        res.json({
            success: true,
            data: prediction,
            meta: {
                modelUsed: 'simple',
                timestamp: new Date().toISOString()
            }
        });
        
        log.success('✅ Predicción simple completada');
        
    } catch (error) {
        log.error(`❌ Error en predicción simple: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Predicción avanzada forzada
app.post('/api/predict/advanced', async (req, res) => {
    try {
        const { homeTeam, awayTeam, league, date } = req.body;
        
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({
                success: false,
                error: 'homeTeam y awayTeam son requeridos'
            });
        }
        
        log.info(`🤖 Predicción avanzada: ${homeTeam} vs ${awayTeam}`);
        
        const pythonOnline = await pythonClient.checkHealth();
        if (!pythonOnline) {
            throw new Error('Servicio de IA no disponible');
        }
        
        const prediction = await pythonClient.predict({
            home_team: homeTeam,
            away_team: awayTeam,
            league: league || 'Unknown',
            date: date || new Date().toISOString().split('T')[0]
        });
        
        res.json({
            success: true,
            data: prediction,
            meta: {
                modelUsed: 'advanced',
                timestamp: new Date().toISOString()
            }
        });
        
        log.success('✅ Predicción avanzada completada');
        
    } catch (error) {
        log.error(`❌ Error en predicción avanzada: ${error.message}`);
        res.status(503).json({
            success: false,
            error: 'Servicio de predicción avanzada no disponible',
            message: error.message,
            fallback: 'Usar /api/predict para predicción con fallback automático'
        });
    }
});

// Endpoint de prueba
app.get('/api/test', async (req, res) => {
    try {
        // Predicción de prueba
        const testPrediction = predictionModel.predict('Real Madrid', 'Barcelona', 'La Liga');
        
        // Verificar servicios
        const pythonStatus = await pythonClient.checkHealth();
        
        res.json({
            status: 'ok',
            message: 'Sistema funcionando correctamente',
            services: {
                backend: 'online',
                python: pythonStatus ? 'online' : 'offline',
                prediction_model: 'online'
            },
            test_prediction: {
                match: 'Real Madrid vs Barcelona',
                result: testPrediction
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Estadísticas del sistema
app.get('/api/stats', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '2.0.0',
        teams_database: Object.keys(predictionModel.teamStrengths).length,
        supported_leagues: ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'],
        features: [
            'Predicción 1X2',
            'BTTS (Ambos marcan)',
            'Over/Under 2.5',
            'Goles esperados',
            'Análisis de confianza',
            'Hándicap asiático',
            'Fallback automático'
        ],
        timestamp: new Date().toISOString()
    });
});

// Middleware para agregar tiempo de inicio
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

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

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        available_endpoints: {
            'GET /': 'Página principal',
            'GET /api/health': 'Estado del servicio',
            'GET /api/status': 'Estado detallado',
            'POST /api/predict': 'Predicción inteligente',
            'POST /api/predict/simple': 'Predicción simple',
            'POST /api/predict/advanced': 'Predicción avanzada',
            'GET /api/test': 'Prueba del sistema',
            'GET /api/stats': 'Estadísticas'
        }
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 PREDICTOR DE FÚTBOL PREMIUM - SERVIDOR INICIADO');
    console.log('='.repeat(60));
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`📊 Info: http://localhost:${PORT}/api/info`);
    console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
    console.log('='.repeat(60));
    console.log('📡 Endpoints disponibles:');
    console.log('   POST /api/predict - Generar predicción');
    console.log('   GET  /api/health - Estado del servicio');
    console.log('   GET  /api/stats  - Estadísticas');
    console.log('   GET  /api/test   - Test automático');
    console.log('='.repeat(60));
    console.log('✅ Estado de servicios:');
    console.log('   🟢 Backend Node.js: ONLINE (Puerto 3000)');
    
    // Verificar servicio Python
    pythonClient.checkHealth().then(pythonStatus => {
        const status = pythonStatus ? '🟢 ONLINE' : '🟡 OFFLINE';
        console.log(`   ${status.substring(0, 2)} Python ML: ${status.substring(3)} (Puerto 5000)`);
        console.log('   🟢 Frontend: DISPONIBLE');
        console.log('='.repeat(60));
        
        if (!pythonStatus) {
            console.log('⚠️  Servicio Python ML: NO DISPONIBLE (usando modelo simple)');
            console.log('   Para habilitar ML avanzado, inicia: python python_service/api.py');
        }
        
        console.log('\n🎯 Para probar la aplicación:');
        console.log('   1. Abre http://localhost:3000 en tu navegador');
        console.log('   2. Selecciona una liga');
        console.log('   3. Elige equipos local y visitante');
        console.log('   4. Haz clic en "Generar Predicción"');
        console.log('\n🔧 Para detener: Presiona Ctrl+C');
        console.log('');
    });
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