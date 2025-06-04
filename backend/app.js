const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuracion
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Predictor de Futbol funcionando',
        timestamp: new Date().toISOString()
    });
});

// API de prediccion simple
app.post('/api/predict', (req, res) => {
    const { homeTeam, awayTeam, league } = req.body;
ECHO est  desactivado.
    // Prediccion basica simulada
    const prediction = {
        success: true,
        data: {
            victoria_local: 0.55,
            empate: 0.25,
            victoria_visitante: 0.20,
            goles_esperados_local: 1.8,
            goles_esperados_visitante: 1.1,
            confianza: "alta",
            analisis: {
                local: `${homeTeam} tiene ventaja como local`,
                visitante: `${awayTeam} jugara de visitante`,
                general: "Partido equilibrado con ligera ventaja local"
            }
        }
    };
ECHO est  desactivado.
    res.json(prediction);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`ðŸš€ Servidor corriendo en http://localhost:${PORT}`);
    console.log('ðŸŽ¯ Abre tu navegador y ve a esa direccion');
});
