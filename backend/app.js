const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Predictor de Fútbol funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        python_service: 'http://localhost:5000'
    });
});

// Modelo de predicción simple interno
function generateSimplePrediction(homeTeam, awayTeam, league) {
    // Simulación de fortaleza de equipos basada en nombres
    const getTeamStrength = (team) => {
        const strongTeams = ['Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Bayern Munich'];
        const mediumTeams = ['Arsenal', 'Chelsea', 'Atletico Madrid', 'Manchester United'];
        
        if (strongTeams.some(t => team.toLowerCase().includes(t.toLowerCase()))) {
            return Math.random() * 0.3 + 0.7; // 0.7-1.0
        } else if (mediumTeams.some(t => team.toLowerCase().includes(t.toLowerCase()))) {
            return Math.random() * 0.3 + 0.5; // 0.5-0.8
        } else {
            return Math.random() * 0.4 + 0.3; // 0.3-0.7
        }
    };

    const homeStrength = getTeamStrength(homeTeam);
    const awayStrength = getTeamStrength(awayTeam);
    const homeAdvantage = 0.1; // Ventaja de local

    // Calcular probabilidades
    const totalStrength = homeStrength + homeAdvantage + awayStrength;
    let homeWin = (homeStrength + homeAdvantage) / totalStrength;
    let awayWin = awayStrength / totalStrength;
    let draw = 1 - homeWin - awayWin;

    // Normalizar para que sumen 1
    const total = homeWin + draw + awayWin;
    homeWin = homeWin / total;
    draw = draw / total;
    awayWin = awayWin / total;

    // Goles esperados
    const homeGoals = homeStrength * 2.5;
    const awayGoals = awayStrength * 2.0;

    return {
        victoria_local: parseFloat(homeWin.toFixed(3)),
        empate: parseFloat(draw.toFixed(3)),
        victoria_visitante: parseFloat(awayWin.toFixed(3)),
        goles_esperados_local: parseFloat(homeGoals.toFixed(1)),
        goles_esperados_visitante: parseFloat(awayGoals.toFixed(1)),
        confianza: "media",
        mercados_adicionales: {
            ambos_equipos_marcan: parseFloat((0.4 + Math.random() * 0.4).toFixed(2)),
            mas_2_5_goles: parseFloat((0.3 + Math.random() * 0.5).toFixed(2))
        },
        timestamp: new Date().toISOString()
    };
}

// API de predicción simple (siempre disponible)
app.post('/api/predict/simple', (req, res) => {
    try {
        const { homeTeam, awayTeam, league, date } = req.body;
        
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren equipos local y visitante'
            });
        }

        console.log(`Predicción simple: ${homeTeam} vs ${awayTeam} (${league || 'Liga no especificada'})`);

        const prediction = generateSimplePrediction(homeTeam, awayTeam, league);
        
        const response = {
            success: true,
            data: {
                ...prediction,
                fecha: date || new Date().toISOString().split('T')[0],
                liga: league || 'Liga no especificada',
                equipoLocal: homeTeam,
                equipoVisitante: awayTeam,
                analisis: {
                    local: `${homeTeam} tiene una probabilidad del ${(prediction.victoria_local * 100).toFixed(1)}% de ganar este partido.`,
                    visitante: `${awayTeam} tiene una probabilidad del ${(prediction.victoria_visitante * 100).toFixed(1)}% de ganar este partido.`,
                    general: prediction.victoria_local > 0.5 ? 
                        `${homeTeam} parte como favorito para este encuentro.` :
                        prediction.victoria_visitante > 0.5 ?
                        `${awayTeam} tiene ventaja pese a jugar fuera de casa.` :
                        "Partido muy equilibrado con resultado incierto."
                }
            },
            modelType: 'simple',
            serviceStatus: 'node_only'
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error en predicción simple:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando predicción simple',
            error: error.message
        });
    }
});

// Función para intentar conectar con Python
async function tryPythonPrediction(matchData) {
    try {
        const axios = require('axios');
        const response = await axios.post('http://localhost:5000/api/predict', matchData, {
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.log('Python service no disponible, usando modelo simple');
        return { success: false, error: error.message };
    }
}

// API de predicción inteligente (intenta Python, fallback a simple)
app.post('/api/predict', async (req, res) => {
    try {
        const { homeTeam, awayTeam, league, date } = req.body;
        
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren equipos local y visitante'
            });
        }

        console.log(`Predicción inteligente: ${homeTeam} vs ${awayTeam}`);

        // Intentar primero con Python
        const pythonData = {
            home_team: homeTeam,
            away_team: awayTeam,
            league: league,
            date: date
        };

        const pythonResult = await tryPythonPrediction(pythonData);
        
        if (pythonResult.success) {
            // Python funcionó, usar su respuesta
            console.log('Usando predicción de Python ML');
            return res.json({
                success: true,
                data: pythonResult.data,
                modelType: 'advanced_ml',
                serviceStatus: 'python_online'
            });
        } else {
            // Python falló, usar modelo simple
            console.log('Python no disponible, usando modelo simple');
            const prediction = generateSimplePrediction(homeTeam, awayTeam, league);
            
            return res.json({
                success: true,
                data: {
                    ...prediction,
                    fecha: date || new Date().toISOString().split('T')[0],
                    liga: league || 'Liga no especificada',
                    equipoLocal: homeTeam,
                    equipoVisitante: awayTeam,
                    analisis: {
                        local: `${homeTeam} tiene una probabilidad del ${(prediction.victoria_local * 100).toFixed(1)}% de ganar este partido.`,
                        visitante: `${awayTeam} tiene una probabilidad del ${(prediction.victoria_visitante * 100).toFixed(1)}% de ganar este partido.`,
                        general: prediction.victoria_local > 0.5 ? 
                            `${homeTeam} parte como favorito para este encuentro.` :
                            prediction.victoria_visitante > 0.5 ?
                            `${awayTeam} tiene ventaja pese a jugar fuera de casa.` :
                            "Partido muy equilibrado con resultado incierto."
                    }
                },
                modelType: 'simple_fallback',
                serviceStatus: 'python_offline',
                fallbackReason: pythonResult.error
            });
        }
    } catch (error) {
        console.error('Error en predicción inteligente:', error);
        res.status(500).json({
            success: false,
            message: 'Error generando predicción',
            error: error.message
        });
    }
});

// API de prueba de conexión con Python
app.get('/api/python/status', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:5000/api/health', { timeout: 3000 });
        res.json({
            status: 'online',
            python_response: response.data,
            message: 'Servicio Python ML disponible'
        });
    } catch (error) {
        res.json({
            status: 'offline',
            message: 'Servicio Python ML no disponible',
            error: error.message
        });
    }
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Ruta catch-all para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
    console.log(`🎯 Interfaz web disponible en: http://localhost:${PORT}`);
    console.log(`🔌 API endpoints:`);
    console.log(`   - GET  /api/health`);
    console.log(`   - POST /api/predict`);
    console.log(`   - POST /api/predict/simple`);
    console.log(`   - GET  /api/python/status`);
    console.log(`📊 Probando conexión con Python ML...`);
    
    // Probar conexión con Python al iniciar
    setTimeout(async () => {
        try {
            const axios = require('axios');
            await axios.get('http://localhost:5000/api/health', { timeout: 2000 });
            console.log(`✅ Conexión con Python ML establecida`);
        } catch (error) {
            console.log(`⚠️  Python ML no disponible, funcionando solo con modelo básico`);
        }
    }, 2000);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor backend...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor backend...');
    process.exit(0);
});