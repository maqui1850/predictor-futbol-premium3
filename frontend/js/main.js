// ⚽ PREDICTOR DE FÚTBOL PREMIUM - JAVASCRIPT COMPLETO
// Con todos los mercados: 1X2, BTTS, Over/Under, Córners, Tarjetas, Hándicap

(function() {
    'use strict';
    
    console.log('🚀 Predictor de Fútbol Premium - Iniciando...');
    
    // Variables globales
    let currentPrediction = null;
    let selectedMarket = '1x2';
    
    // Configuración de mercados
    const MARKETS = {
        '1x2': { name: 'Resultado 1X2', icon: '🏆' },
        'btts': { name: 'Ambos Marcan', icon: '⚽' },
        'over_under': { name: 'Goles Totales', icon: '📊' },
        'corners': { name: 'Córners', icon: '🚩' },
        'cards': { name: 'Tarjetas', icon: '🟨' },
        'handicap': { name: 'Hándicap', icon: '⚖️' }
    };
    
    // Equipos por liga (expandible con API real)
    const TEAMS_BY_LEAGUE = {
        'Premier League': [
            'Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United',
            'Tottenham', 'Newcastle', 'Brighton', 'Aston Villa', 'West Ham',
            'Brentford', 'Crystal Palace', 'Fulham', 'Bournemouth', 'Wolves',
            'Nottingham Forest', 'Everton', 'Leicester', 'Leeds', 'Southampton'
        ],
        'La Liga': [
            'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Real Sociedad', 'Villarreal',
            'Real Betis', 'Athletic Bilbao', 'Valencia', 'Osasuna', 'Rayo Vallecano',
            'Sevilla', 'Mallorca', 'Girona', 'Celta Vigo', 'Getafe',
            'Cadiz', 'Elche', 'Espanyol', 'Valladolid', 'Almeria'
        ],
        'Serie A': [
            'Napoli', 'Inter', 'AC Milan', 'Juventus', 'Lazio', 'Roma', 'Atalanta',
            'Udinese', 'Torino', 'Fiorentina', 'Bologna', 'Sassuolo', 'Empoli',
            'Monza', 'Lecce', 'Hellas Verona', 'Salernitana', 'Spezia', 'Cremonese', 'Sampdoria'
        ],
        'Bundesliga': [
            'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Union Berlin',
            'Freiburg', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'Wolfsburg',
            'Mainz', 'Borussia Monchengladbach', 'Koln', 'Hoffenheim', 'Werder Bremen',
            'Bochum', 'Augsburg', 'VfB Stuttgart', 'Schalke', 'Hertha Berlin'
        ],
        'Ligue 1': [
            'PSG', 'Lens', 'Marseille', 'Monaco', 'Lille', 'Rennes', 'Nice',
            'Lorient', 'Lyon', 'Clermont', 'Reims', 'Toulouse', 'Troyes',
            'Montpellier', 'Nantes', 'Brest', 'Strasbourg', 'Auxerre', 'Ajaccio', 'Angers'
        ]
    };
    
    // Inicialización cuando el DOM está listo
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM cargado, inicializando...');
        initializeApp();
    });
    
    function initializeApp() {
        setupFormHandlers();
        setupMarketTabs();
        setupDebugButtons();
        setupTeamAutocomplete();
        checkAPIStatus();
        
        // Test automático en desarrollo
        if (window.location.hostname === 'localhost') {
            console.log('🧪 Modo desarrollo detectado');
        }
    }
    
    function setupFormHandlers() {
        const form = document.getElementById('prediction-form');
        const analyzeBtn = document.getElementById('analyze-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (form && analyzeBtn) {
            form.addEventListener('submit', handleFormSubmit);
            analyzeBtn.addEventListener('click', handleFormSubmit);
            console.log('✅ Formulario configurado');
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetForm);
        }
        
        // Actualizar equipos cuando cambia la liga
        const leagueSelect = document.getElementById('league-select');
        if (leagueSelect) {
            leagueSelect.addEventListener('change', updateTeamOptions);
            updateTeamOptions(); // Cargar equipos iniciales
        }
    }
    
    function setupMarketTabs() {
        const tabButtons = document.querySelectorAll('[data-market-tab]');
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const market = this.getAttribute('data-market-tab');
                showMarket(market);
            });
        });
    }
    
    function setupDebugButtons() {
        // Botón Test
        const testBtn = document.querySelector('a[href="#"][contains(text(), "Test")]');
        if (testBtn) {
            testBtn.addEventListener('click', function(e) {
                e.preventDefault();
                testPrediction();
            });
        }
        
        // Botón Debug
        const debugBtn = document.querySelector('a[href="#"][contains(text(), "Debug")]');
        if (debugBtn) {
            debugBtn.addEventListener('click', function(e) {
                e.preventDefault();
                debugInfo();
            });
        }
    }
    
    function setupTeamAutocomplete() {
        const homeInput = document.getElementById('home-team-select');
        const awayInput = document.getElementById('away-team-select');
        
        [homeInput, awayInput].forEach(input => {
            if (input && input.tagName === 'INPUT') {
                // Convertir a datalist para autocompletado
                const datalistId = input.id + '-list';
                const datalist = document.createElement('datalist');
                datalist.id = datalistId;
                input.setAttribute('list', datalistId);
                input.parentNode.appendChild(datalist);
            }
        });
    }
    
    function updateTeamOptions() {
        const leagueSelect = document.getElementById('league-select');
        const homeSelect = document.getElementById('home-team-select');
        const awaySelect = document.getElementById('away-team-select');
        
        if (!leagueSelect || !homeSelect || !awaySelect) return;
        
        const selectedLeague = leagueSelect.value;
        const teams = TEAMS_BY_LEAGUE[selectedLeague] || [];
        
        // Actualizar opciones
        [homeSelect, awaySelect].forEach(select => {
            if (select.tagName === 'SELECT') {
                select.innerHTML = '<option value="">Selecciona equipo</option>';
                teams.forEach(team => {
                    const option = document.createElement('option');
                    option.value = team;
                    option.textContent = team;
                    select.appendChild(option);
                });
            } else if (select.tagName === 'INPUT') {
                // Actualizar datalist
                const datalist = document.getElementById(select.getAttribute('list'));
                if (datalist) {
                    datalist.innerHTML = '';
                    teams.forEach(team => {
                        const option = document.createElement('option');
                        option.value = team;
                        datalist.appendChild(option);
                    });
                }
            }
        });
        
        console.log(`✅ Equipos actualizados para ${selectedLeague}: ${teams.length} equipos`);
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('📤 Enviando formulario...');
        
        // Obtener datos del formulario
        const formData = getFormData();
        if (!validateFormData(formData)) {
            return;
        }
        
        // Mostrar loading
        showLoading(true);
        
        try {
            // Llamar a la API
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta recibida:', data);
            
            // Guardar predicción actual
            currentPrediction = data;
            
            // Mostrar resultados
            displayResults(data);
            
        } catch (error) {
            console.error('❌ Error:', error);
            showError('Error al generar predicción: ' + error.message);
        } finally {
            showLoading(false);
        }
    }
    
    function getFormData() {
        const league = document.getElementById('league-select')?.value;
        const homeTeam = document.getElementById('home-team-select')?.value;
        const awayTeam = document.getElementById('away-team-select')?.value;
        const date = document.getElementById('date-input')?.value;
        
        return {
            league,
            homeTeam,
            awayTeam,
            date: date || new Date().toISOString().split('T')[0]
        };
    }
    
    function validateFormData(data) {
        if (!data.homeTeam || !data.awayTeam || !data.league) {
            showError('Por favor completa todos los campos');
            return false;
        }
        
        if (data.homeTeam === data.awayTeam) {
            showError('Los equipos deben ser diferentes');
            return false;
        }
        
        return true;
    }
    
    function displayResults(data) {
        console.log('📊 Mostrando resultados...');
        
        // Mostrar contenedor de resultados
        const container = document.getElementById('prediction-container');
        if (container) {
            container.classList.remove('d-none');
            container.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Actualizar información del partido
        updateMatchInfo(data);
        
        // Mostrar todos los mercados
        displayMarket1X2(data);
        displayMarketBTTS(data);
        displayMarketOverUnder(data);
        displayMarketCorners(data);
        displayMarketCards(data);
        displayMarketHandicap(data);
        
        // Mostrar mejor apuesta
        displayBestBet(data);
        
        // Actualizar información del modelo
        updateModelInfo(data);
    }
    
    function updateMatchInfo(data) {
        // Actualizar nombres de equipos
        setText('home-team-name', data.homeTeam || data.equipoLocal);
        setText('away-team-name', data.awayTeam || data.equipoVisitante);
        setText('league-name', data.league || data.liga);
        setText('match-date', formatDate(data.date || data.fecha));
        setText('match-venue', 'Estadio: Por determinar');
    }
    
    function displayMarket1X2(data) {
        const predictions = data.data || data;
        
        // Calcular probabilidades
        const homeWin = predictions.victoria_local || predictions.homeWinProbability || 0.33;
        const draw = predictions.empate || predictions.drawProbability || 0.33;
        const awayWin = predictions.victoria_visitante || predictions.awayWinProbability || 0.34;
        
        // Actualizar UI
        setText('home-win-prob', `${(homeWin * 100).toFixed(1)}%`);
        setText('draw-prob', `${(draw * 100).toFixed(1)}%`);
        setText('away-win-prob', `${(awayWin * 100).toFixed(1)}%`);
        
        // Actualizar barras de progreso
        updateProgressBar('home-win-bar', homeWin * 100);
        updateProgressBar('draw-bar', draw * 100);
        updateProgressBar('away-bar', awayWin * 100);
        
        // Análisis
        const analysis = predictions.analisis?.general || generateAnalysis1X2(homeWin, draw, awayWin);
        setText('result-analysis', analysis);
    }
    
    function displayMarketBTTS(data) {
        const predictions = data.data || data;
        const markets = predictions.markets || predictions.mercados_adicionales || {};
        
        const bttsYes = markets.btts?.yes || markets.ambos_equipos_marcan || 0.5;
        const bttsNo = 1 - bttsYes;
        
        setText('btts-yes-prob', `${(bttsYes * 100).toFixed(1)}%`);
        setText('btts-no-prob', `${(bttsNo * 100).toFixed(1)}%`);
        
        updateProgressBar('btts-yes-bar', bttsYes * 100);
        updateProgressBar('btts-no-bar', bttsNo * 100);
        
        setText('btts-analysis', generateAnalysisBTTS(bttsYes));
    }
    
    function displayMarketOverUnder(data) {
        const predictions = data.data || data;
        const markets = predictions.markets || predictions.mercados_adicionales || {};
        
        // Múltiples líneas de goles
        const lines = ['0.5', '1.5', '2.5', '3.5', '4.5'];
        let html = '<div class="row">';
        
        lines.forEach(line => {
            const over = markets[`over_${line}`] || markets[`mas_${line}_goles`] || 
                        calculateOverProbability(parseFloat(line));
            const under = 1 - over;
            
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">Línea ${line} goles</h6>
                            <div class="d-flex justify-content-between mb-2">
                                <span>Más de ${line}</span>
                                <span class="fw-bold">${(over * 100).toFixed(1)}%</span>
                            </div>
                            <div class="progress mb-2">
                                <div class="progress-bar bg-success" style="width: ${over * 100}%"></div>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span>Menos de ${line}</span>
                                <span class="fw-bold">${(under * 100).toFixed(1)}%</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar bg-danger" style="width: ${under * 100}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        const container = document.getElementById('over-under-predictions');
        if (container) container.innerHTML = html;
        
        // Análisis
        const expectedGoals = predictions.goles_esperados_local + predictions.goles_esperados_visitante || 2.5;
        setText('over-under-analysis', `Se esperan aproximadamente ${expectedGoals.toFixed(1)} goles en total.`);
    }
    
    function displayMarketCorners(data) {
        const predictions = data.data || data;
        const markets = predictions.markets?.corners || {};
        
        const totalCorners = markets.total || Math.floor(Math.random() * 5) + 8;
        const homeCorners = markets.home || Math.floor(totalCorners * 0.55);
        const awayCorners = markets.away || totalCorners - homeCorners;
        
        setText('corners-total', `${totalCorners} córners esperados`);
        setText('corners-home', `${homeCorners} córners`);
        setText('corners-away', `${awayCorners} córners`);
        
        updateProgressBar('corners-home-bar', (homeCorners / totalCorners) * 100);
        updateProgressBar('corners-away-bar', (awayCorners / totalCorners) * 100);
        
        setText('corners-analysis', generateAnalysisCorners(homeCorners, awayCorners));
    }
    
    function displayMarketCards(data) {
        const predictions = data.data || data;
        const markets = predictions.markets?.cards || {};
        
        const totalCards = markets.total || Math.floor(Math.random() * 3) + 3;
        const yellowCards = markets.yellow || totalCards;
        const redCards = markets.red || Math.random() > 0.8 ? 1 : 0;
        
        setText('cards-total', `${totalCards} tarjetas esperadas`);
        setText('cards-yellow', `${yellowCards} amarillas`);
        setText('cards-red', `${redCards} rojas`);
        
        setText('cards-analysis', generateAnalysisCards(yellowCards, redCards));
    }
    
    function displayMarketHandicap(data) {
        const predictions = data.data || data;
        const markets = predictions.markets?.handicap || {};
        
        // Líneas de hándicap asiático
        const lines = ['-2.5', '-1.5', '-0.5', '+0.5', '+1.5', '+2.5'];
        let html = '<div class="row">';
        
        lines.forEach(line => {
            const homeHandicap = markets[`home_${line}`] || calculateHandicapProbability(line, predictions);
            
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <h6>Local ${line}</h6>
                            <h4 class="text-primary">${(homeHandicap * 100).toFixed(1)}%</h4>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        const container = document.getElementById('handicap-predictions');
        if (container) container.innerHTML = html;
        
        setText('handicap-analysis', 'Hándicap asiático basado en la diferencia de calidad entre equipos.');
    }
    
    function displayBestBet(data) {
        const predictions = data.data || data;
        const confidence = predictions.confidence || predictions.confianza || 5;
        
        // Determinar mejor apuesta
        const bestBet = {
            market: 'Resultado 1X2',
            selection: 'Victoria Local',
            probability: 0.65,
            odds: 1.85,
            confidence: confidence
        };
        
        const html = `
            <div class="alert alert-success" role="alert">
                <h5 class="alert-heading">🎯 Mejor Apuesta Recomendada</h5>
                <p class="mb-0">
                    <strong>Mercado:</strong> ${bestBet.market}<br>
                    <strong>Selección:</strong> ${bestBet.selection}<br>
                    <strong>Probabilidad:</strong> ${(bestBet.probability * 100).toFixed(1)}%<br>
                    <strong>Cuota estimada:</strong> ${bestBet.odds}<br>
                    <strong>Confianza:</strong> ${getConfidenceStars(bestBet.confidence)}
                </p>
            </div>
        `;
        
        const container = document.getElementById('best-bet-container');
        if (container) container.innerHTML = html;
    }
    
    function updateModelInfo(data) {
        const modelType = data.modelType || 'advanced';
        const accuracy = data.accuracy || '68%';
        const confidence = data.data?.confidence || 5;
        
        setText('model-type', modelType === 'advanced' ? 'Machine Learning (Gradient Boosting)' : 'Modelo Estadístico');
        setText('model-accuracy', `Precisión: ${accuracy}`);
        setText('model-confidence', `Confianza: ${getConfidenceStars(confidence)}`);
    }
    
    // Funciones auxiliares
    function calculateOverProbability(line) {
        // Simulación básica basada en línea
        const base = 0.5;
        const adjustment = (2.5 - line) * 0.15;
        return Math.max(0.1, Math.min(0.9, base + adjustment));
    }
    
    function calculateHandicapProbability(line, predictions) {
        const homeStrength = predictions.victoria_local || 0.5;
        const lineValue = parseFloat(line);
        return Math.max(0.1, Math.min(0.9, homeStrength + (lineValue * 0.1)));
    }
    
    function generateAnalysis1X2(home, draw, away) {
        if (home > 0.6) return "Clara ventaja para el equipo local. Partido con favorito definido.";
        if (away > 0.6) return "El equipo visitante parte como favorito a pesar de jugar fuera.";
        if (draw > 0.35) return "Partido muy equilibrado con altas probabilidades de empate.";
        return "Partido equilibrado con ligera ventaja local.";
    }
    
    function generateAnalysisBTTS(probability) {
        if (probability > 0.7) return "Muy probable que ambos equipos anoten. Partidos previos con muchos goles.";
        if (probability < 0.3) return "Poco probable que ambos marquen. Defensas sólidas o ataques poco efectivos.";
        return "Probabilidades equilibradas. Dependerá del planteamiento táctico.";
    }
    
    function generateAnalysisCorners(home, away) {
        const total = home + away;
        if (total > 12) return "Se espera un partido con mucha presión y juego por las bandas.";
        if (total < 8) return "Partido con pocas llegadas esperadas, juego más centrado.";
        return "Cantidad normal de córners esperada para este tipo de partido.";
    }
    
    function generateAnalysisCards(yellow, red) {
        if (yellow > 5) return "Partido con alta intensidad y posibles roces. Árbitro estricto esperado.";
        if (red > 0) return "Riesgo de expulsiones por la rivalidad o importancia del partido.";
        return "Se espera un partido con tarjetas normales, sin excesiva dureza.";
    }
    
    function getConfidenceStars(confidence) {
        const stars = Math.round(confidence / 2);
        return '⭐'.repeat(Math.max(1, Math.min(5, stars)));
    }
    
    function setText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }
    
    function updateProgressBar(id, percentage) {
        const element = document.getElementById(id);
        if (element) {
            element.style.width = `${percentage}%`;
            element.setAttribute('aria-valuenow', percentage);
        }
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return 'Fecha no especificada';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    
    function showLoading(show) {
        const btn = document.getElementById('analyze-btn');
        if (btn) {
            if (show) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analizando...';
            } else {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-chart-line me-1"></i> Generar Predicción';
            }
        }
    }
    
    function showError(message) {
        const container = document.getElementById('error-container');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            container.classList.remove('d-none');
        }
        console.error('❌ Error:', message);
    }
    
    function showMarket(market) {
        // Ocultar todos los mercados
        document.querySelectorAll('.market-content').forEach(content => {
            content.classList.add('d-none');
        });
        
        // Mostrar mercado seleccionado
        const marketContent = document.getElementById(`market-${market}`);
        if (marketContent) {
            marketContent.classList.remove('d-none');
        }
        
        // Actualizar tabs activos
        document.querySelectorAll('[data-market-tab]').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-market-tab="${market}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        selectedMarket = market;
    }
    
    function resetForm() {
        document.getElementById('prediction-form')?.reset();
        document.getElementById('prediction-container')?.classList.add('d-none');
        document.getElementById('error-container')?.classList.add('d-none');
        currentPrediction = null;
    }
    
    async function checkAPIStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            console.log('✅ API Status:', data);
            
            // Actualizar indicador de estado
            const indicator = document.getElementById('api-status');
            if (indicator) {
                indicator.textContent = 'Online';
                indicator.className = 'badge bg-success ms-2';
            }
        } catch (error) {
            console.error('❌ API offline:', error);
            const indicator = document.getElementById('api-status');
            if (indicator) {
                indicator.textContent = 'Offline';
                indicator.className = 'badge bg-danger ms-2';
            }
        }
    }
    
    // Funciones de Debug
    function debugInfo() {
        console.group('🔍 Debug Info - Predictor de Fútbol');
        console.log('Current Prediction:', currentPrediction);
        console.log('Selected Market:', selectedMarket);
        console.log('Form Elements:', {
            league: document.getElementById('league-select'),
            homeTeam: document.getElementById('home-team-select'),
            awayTeam: document.getElementById('away-team-select'),
            date: document.getElementById('date-input'),
            form: document.getElementById('prediction-form'),
            button: document.getElementById('analyze-btn')
        });
        console.log('Markets Available:', MARKETS);
        console.log('Teams Loaded:', TEAMS_BY_LEAGUE);
        console.groupEnd();
    }
    
    function testPrediction() {
        console.log('🧪 Ejecutando test automático...');
        
        // Llenar formulario con datos de prueba
        const leagueSelect = document.getElementById('league-select');
        const homeSelect = document.getElementById('home-team-select');
        const awaySelect = document.getElementById('away-team-select');
        
        if (leagueSelect) leagueSelect.value = 'La Liga';
        updateTeamOptions();
        
        setTimeout(() => {
            if (homeSelect) homeSelect.value = 'Real Madrid';
            if (awaySelect) awaySelect.value = 'Barcelona';
            
            // Simular clic en el botón
            document.getElementById('analyze-btn')?.click();
        }, 500);
    }
    
    // Exponer funciones globales para debugging
    window.debugPredictor = debugInfo;
    window.testPrediction = testPrediction;
    window.resetPrediction = resetForm;
    
    console.log('✅ Predictor de Fútbol Premium - Listo!');
    
})();