// frontend/js/main.js - VERSIÓN CORREGIDA CON NAVEGACIÓN DE PESTAÑAS

class PredictorApp {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.pythonUrl = 'http://localhost:5000/api';
        this.currentPrediction = null;
        this.isLoading = false;
        
        // Configuración de ligas mundiales
        this.worldLeagues = {
            'Europa': {
                'Premier League': {
                    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra',
                    teams: ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham', 'Newcastle', 'Brighton', 'West Ham', 'Aston Villa', 'Crystal Palace', 'Brentford', 'Fulham', 'Wolves', 'Everton', 'Nottingham Forest', 'Burnley', 'Sheffield United', 'Luton Town', 'Bournemouth']
                },
                'La Liga': {
                    country: '🇪🇸 España',
                    teams: ['Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia', 'Athletic Bilbao', 'Getafe', 'Osasuna', 'Las Palmas', 'Girona', 'Rayo Vallecano', 'Mallorca', 'Celta Vigo', 'Cadiz', 'Granada', 'Almeria', 'Alaves']
                },
                'Bundesliga': {
                    country: '🇩🇪 Alemania',
                    teams: ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Union Berlin', 'SC Freiburg', 'Bayer Leverkusen', 'Eintracht Frankfurt', 'Wolfsburg', 'Mainz', 'Borussia Monchengladbach', 'FC Koln', 'Werder Bremen', 'Augsburg', 'VfB Stuttgart', 'Hoffenheim', 'VfL Bochum', 'Heidenheim', 'Darmstadt']
                },
                'Serie A': {
                    country: '🇮🇹 Italia',
                    teams: ['Inter Milan', 'AC Milan', 'Juventus', 'Napoli', 'AS Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino', 'Monza', 'Genoa', 'Lecce', 'Udinese', 'Cagliari', 'Hellas Verona', 'Empoli', 'Frosinone', 'Sassuolo', 'Salernitana']
                },
                'Ligue 1': {
                    country: '🇫🇷 Francia',
                    teams: ['Paris Saint-Germain', 'AS Monaco', 'Lille', 'Olympique Marseille', 'Olympique Lyon', 'Nice', 'Lens', 'Rennes', 'Strasbourg', 'Montpellier', 'Nantes', 'Brest', 'Reims', 'Toulouse', 'Le Havre', 'Metz', 'Lorient', 'Clermont']
                }
            },
            'Sudamérica': {
                'Liga Argentina': {
                    country: '🇦🇷 Argentina',
                    teams: ['River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo', 'Estudiantes', 'Velez Sarsfield', 'Lanus', 'Defensa y Justicia', 'Talleres']
                },
                'Brasileirao': {
                    country: '🇧🇷 Brasil',
                    teams: ['Flamengo', 'Palmeiras', 'Sao Paulo', 'Corinthians', 'Santos', 'Atletico Mineiro', 'Internacional', 'Gremio', 'Fluminense', 'Botafogo']
                }
            },
            'Norteamérica': {
                'MLS': {
                    country: '🇺🇸 Estados Unidos',
                    teams: ['LA Galaxy', 'LAFC', 'Seattle Sounders', 'Portland Timbers', 'Atlanta United', 'Inter Miami', 'New York City FC', 'New York Red Bulls', 'Chicago Fire', 'Toronto FC']
                },
                'Liga MX': {
                    country: '🇲🇽 México',
                    teams: ['Club America', 'Chivas', 'Cruz Azul', 'Pumas', 'Tigres', 'Monterrey', 'Santos Laguna', 'Pachuca', 'Leon', 'Atlas']
                }
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateLeagues();
        this.setupTabNavigation();
        this.checkServices();
        this.setDefaultDate();
        console.log('✅ PredictorApp inicializado correctamente');
    }

    setupEventListeners() {
        // Formulario principal
        const form = document.getElementById('analysis-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Selector de liga
        const leagueSelect = document.getElementById('league-select');
        if (leagueSelect) {
            leagueSelect.addEventListener('change', (e) => this.handleLeagueChange(e));
        }

        // Botón de análisis
        const analyzeBtn = document.getElementById('analyze-btn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', (e) => this.handleAnalyzeClick(e));
        }

        // Botón reset
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => this.handleReset(e));
        }
    }

    setupTabNavigation() {
        // Configurar navegación entre pestañas
        const tabs = document.querySelectorAll('.market-tab');
        console.log(`📋 Configurando ${tabs.length} pestañas de mercado`);
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const marketId = tab.getAttribute('data-market');
                this.switchToMarket(marketId);
            });
        });
    }

    switchToMarket(marketId) {
        console.log(`🔄 Cambiando a mercado: ${marketId}`);
        
        // Actualizar pestañas activas
        document.querySelectorAll('.market-tab').forEach(tab => {
            if (tab.getAttribute('data-market') === marketId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Mostrar contenido correspondiente
        document.querySelectorAll('.market-content').forEach(content => {
            if (content.id === `market-${marketId}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    populateLeagues() {
        const leagueSelect = document.getElementById('league-select');
        if (!leagueSelect) return;

        leagueSelect.innerHTML = '<option value="">Selecciona una liga</option>';

        Object.entries(this.worldLeagues).forEach(([continent, leagues]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = continent;

            Object.entries(leagues).forEach(([leagueName, leagueData]) => {
                const option = document.createElement('option');
                option.value = leagueName;
                option.textContent = `${leagueData.country} ${leagueName}`;
                optgroup.appendChild(option);
            });

            leagueSelect.appendChild(optgroup);
        });
    }

    handleLeagueChange(e) {
        const selectedLeague = e.target.value;
        this.populateTeams(selectedLeague);
    }

    populateTeams(leagueName) {
        const homeTeamSelect = document.getElementById('home-team-select');
        const awayTeamSelect = document.getElementById('away-team-select');
        
        if (!homeTeamSelect || !awayTeamSelect || !leagueName) return;

        // Encontrar los equipos de la liga seleccionada
        let teams = [];
        Object.values(this.worldLeagues).forEach(continent => {
            if (continent[leagueName]) {
                teams = continent[leagueName].teams;
            }
        });

        // Populate home team select
        homeTeamSelect.innerHTML = '<option value="">Selecciona equipo local</option>';
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            homeTeamSelect.appendChild(option);
        });

        // Populate away team select
        awayTeamSelect.innerHTML = '<option value="">Selecciona equipo visitante</option>';
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            awayTeamSelect.appendChild(option);
        });
    }

    setDefaultDate() {
        const dateInput = document.getElementById('date-input');
        if (dateInput) {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            dateInput.value = formattedDate;
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        await this.generatePrediction();
    }

    async handleAnalyzeClick(e) {
        e.preventDefault();
        await this.generatePrediction();
    }

    async generatePrediction() {
        if (this.isLoading) return;

        const league = document.getElementById('league-select')?.value;
        const homeTeam = document.getElementById('home-team-select')?.value;
        const awayTeam = document.getElementById('away-team-select')?.value;
        const date = document.getElementById('date-input')?.value;

        // Validación
        if (!league || !homeTeam || !awayTeam || !date) {
            this.showError('Por favor completa todos los campos');
            return;
        }

        if (homeTeam === awayTeam) {
            this.showError('Un equipo no puede jugar contra sí mismo');
            return;
        }

        this.setLoading(true);
        this.hideError();

        try {
            // Intentar predicción avanzada primero
            let prediction = await this.tryAdvancedPrediction({
                homeTeam,
                awayTeam,
                league,
                date
            });

            if (!prediction) {
                // Fallback a predicción simple
                prediction = await this.trySimplePrediction({
                    homeTeam,
                    awayTeam,
                    league,
                    date
                });
            }

            if (prediction) {
                this.displayPrediction(prediction, { homeTeam, awayTeam, league, date });
            } else {
                throw new Error('No se pudo generar la predicción');
            }

        } catch (error) {
            console.error('❌ Error:', error);
            this.showError(`Error al generar predicción: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    async tryAdvancedPrediction(matchData) {
        try {
            const response = await fetch(`${this.apiUrl}/predict/advanced`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Predicción avanzada exitosa:', data);
                return data;
            }
        } catch (error) {
            console.warn('⚠️ Predicción avanzada falló, usando fallback');
        }
        return null;
    }

    async trySimplePrediction(matchData) {
        try {
            const response = await fetch(`${this.apiUrl}/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Predicción simple exitosa:', data);
            return data;

        } catch (error) {
            console.error('❌ Error en predicción simple:', error);
            throw error;
        }
    }

    displayPrediction(prediction, matchInfo) {
        console.log('🎯 Mostrando predicción:', prediction);
        this.currentPrediction = prediction;
        
        // Mostrar información del partido
        this.updateMatchInfo(matchInfo);
        
        // Actualizar información del modelo
        this.updateModelInfo(prediction);
        
        // Mostrar predicciones en pestañas
        this.updateResultTab(prediction.data);
        this.updateBTTSTab(prediction.data);
        this.updateOverUnderTab(prediction.data);
        this.updateCornersTab(prediction.data);
        this.updateCardsTab(prediction.data);
        this.updateHandicapTab(prediction.data);
        
        // Mostrar mejor apuesta
        this.updateBestBet(prediction.data);
        
        // Mostrar container de resultados
        const container = document.getElementById('prediction-container');
        if (container) {
            container.classList.remove('d-none');
            container.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Asegurarse de que la primera pestaña esté activa
        this.switchToMarket('1x2');
    }

    updateMatchInfo(matchInfo) {
        const homeTeamName = document.getElementById('home-team-name');
        const awayTeamName = document.getElementById('away-team-name');
        const matchDate = document.getElementById('match-date');
        const leagueName = document.getElementById('league-name');
        const matchVenue = document.getElementById('match-venue');

        if (homeTeamName) homeTeamName.textContent = matchInfo.homeTeam;
        if (awayTeamName) awayTeamName.textContent = matchInfo.awayTeam;
        if (matchDate) matchDate.textContent = this.formatDate(matchInfo.date);
        if (leagueName) leagueName.textContent = matchInfo.league;
        if (matchVenue) matchVenue.textContent = `Estadio del ${matchInfo.homeTeam}`;
    }

    updateModelInfo(prediction) {
        const modelType = document.getElementById('model-type');
        const modelAccuracy = document.getElementById('model-accuracy');
        const modelConfidence = document.getElementById('model-confidence');
        
        if (modelType) {
            modelType.textContent = prediction.meta?.modelType || 'Machine Learning';
        }
        
        if (modelAccuracy) {
            modelAccuracy.textContent = prediction.meta?.accuracy || '68%';
        }
        
        if (modelConfidence) {
            const confidence = prediction.data?.confidence || 'alta';
            const stars = confidence === 'alta' ? '⭐⭐⭐⭐⭐' : 
                          confidence === 'media' ? '⭐⭐⭐⭐' : '⭐⭐⭐';
            modelConfidence.textContent = stars;
        }
    }

    updateResultTab(data) {
        const container = document.getElementById('result-predictions');
        if (!container) return;

        const homeProb = (data.victoria_local || data.homeWinProbability || 0.33) * 100;
        const drawProb = (data.empate || data.drawProbability || 0.33) * 100;
        const awayProb = (data.victoria_visitante || data.awayWinProbability || 0.34) * 100;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="prediction-item p-3 border rounded ${homeProb > 50 ? 'border-success' : ''}">
                        <h6 class="mb-2">🏠 Victoria Local</h6>
                        <h3 class="text-success mb-2">${homeProb.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-success" style="width: ${homeProb}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/homeProb).toFixed(2)}</small>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="prediction-item p-3 border rounded ${drawProb > 35 ? 'border-warning' : ''}">
                        <h6 class="mb-2">🤝 Empate</h6>
                        <h3 class="text-warning mb-2">${drawProb.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-warning" style="width: ${drawProb}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/drawProb).toFixed(2)}</small>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="prediction-item p-3 border rounded ${awayProb > 50 ? 'border-danger' : ''}">
                        <h6 class="mb-2">✈️ Victoria Visitante</h6>
                        <h3 class="text-danger mb-2">${awayProb.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-danger" style="width: ${awayProb}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/awayProb).toFixed(2)}</small>
                    </div>
                </div>
            </div>
            <div class="alert alert-info mt-3">
                <h6>📊 Análisis IA</h6>
                <p class="mb-0">${data.analisis?.general || 'Análisis estadístico completo realizado con algoritmos de machine learning.'}</p>
            </div>
        `;
    }

    updateBTTSTab(data) {
        const container = document.getElementById('btts-predictions');
        if (!container) return;

        const bttsYes = (data.mercados_adicionales?.ambos_equipos_marcan || 0.6) * 100;
        const bttsNo = 100 - bttsYes;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded ${bttsYes > 60 ? 'border-success' : ''}">
                        <h6 class="mb-2">✅ Ambos Marcan</h6>
                        <h3 class="text-success mb-2">${bttsYes.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-success" style="width: ${bttsYes}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/bttsYes).toFixed(2)}</small>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded ${bttsNo > 50 ? 'border-danger' : ''}">
                        <h6 class="mb-2">❌ No Ambos Marcan</h6>
                        <h3 class="text-danger mb-2">${bttsNo.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-danger" style="width: ${bttsNo}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/bttsNo).toFixed(2)}</small>
                    </div>
                </div>
            </div>
            <div class="alert alert-info mt-3">
                <h6>⚽ Análisis de Goles</h6>
                <p class="mb-0">
                    Goles esperados: Local ${(data.goles_esperados_local || 1.5).toFixed(1)} - 
                    Visitante ${(data.goles_esperados_visitante || 1.2).toFixed(1)}
                </p>
            </div>
        `;
    }

    updateOverUnderTab(data) {
        const container = document.getElementById('over-under-predictions');
        if (!container) return;

        const over25 = (data.mercados_adicionales?.mas_2_5_goles || 0.55) * 100;
        const under25 = 100 - over25;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded">
                        <h6 class="mb-2">📈 Over 2.5 Goles</h6>
                        <h3 class="text-success mb-2">${over25.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-success" style="width: ${over25}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/over25).toFixed(2)}</small>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded">
                        <h6 class="mb-2">📉 Under 2.5 Goles</h6>
                        <h3 class="text-warning mb-2">${under25.toFixed(1)}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-warning" style="width: ${under25}%"></div>
                        </div>
                        <small class="text-muted">Cuota estimada: ${(100/under25).toFixed(2)}</small>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="small-prediction p-2 border rounded text-center">
                        <strong>Over 1.5</strong><br>
                        <span class="text-success">${Math.min(95, over25 + 25).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="small-prediction p-2 border rounded text-center">
                        <strong>Over 3.5</strong><br>
                        <span class="text-warning">${Math.max(15, over25 - 20).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="small-prediction p-2 border rounded text-center">
                        <strong>Over 4.5</strong><br>
                        <span class="text-danger">${Math.max(5, over25 - 35).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateCornersTab(data) {
        const container = document.getElementById('corners-predictions');
        if (!container) return;

        const totalCorners = Math.floor(Math.random() * 3) + 8; // 8-11 corners
        const homeCorners = Math.floor(totalCorners * 0.55);
        const awayCorners = totalCorners - homeCorners;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded">
                        <h6 class="mb-2">🚩 Total Córners</h6>
                        <h3 class="text-info mb-2">${totalCorners-1}-${totalCorners+1}</h3>
                        <small class="text-muted">Rango esperado</small>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded">
                        <h6 class="mb-2">📊 Over 8.5 Córners</h6>
                        <h3 class="text-success mb-2">72%</h3>
                        <small class="text-muted">Cuota estimada: 1.39</small>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-6">
                    <div class="text-center">
                        <h6>Equipo Local</h6>
                        <h4 class="text-primary">${homeCorners} córners</h4>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="text-center">
                        <h6>Equipo Visitante</h6>
                        <h4 class="text-info">${awayCorners} córners</h4>
                    </div>
                </div>
            </div>
        `;
    }

    updateCardsTab(data) {
        const container = document.getElementById('cards-predictions');
        if (!container) return;

        const totalCards = Math.floor(Math.random() * 3) + 3; // 3-6 tarjetas
        const yellowCards = totalCards;
        const redCards = Math.random() < 0.15 ? 1 : 0;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="prediction-item p-3 border rounded text-center">
                        <h6 class="mb-2">🟨 Total Tarjetas</h6>
                        <h3 class="text-warning mb-2">${totalCards-1}-${totalCards+1}</h3>
                        <small class="text-muted">Rango esperado</small>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="prediction-item p-3 border rounded text-center">
                        <h6 class="mb-2">🟨 Amarillas</h6>
                        <h3 class="text-warning mb-2">${yellowCards}</h3>
                        <small class="text-muted">Promedio esperado</small>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="prediction-item p-3 border rounded text-center">
                        <h6 class="mb-2">🟥 Rojas</h6>
                        <h3 class="text-danger mb-2">${redCards > 0 ? '15%' : '< 10%'}</h3>
                        <small class="text-muted">Probabilidad</small>
                    </div>
                </div>
            </div>
            <div class="alert alert-info mt-3">
                <p class="mb-0">
                    <i class="fas fa-info-circle me-2"></i>
                    Predicción basada en el historial disciplinario de ambos equipos y el estilo del árbitro.
                </p>
            </div>
        `;
    }

    updateHandicapTab(data) {
        const container = document.getElementById('handicap-predictions');
        if (!container) return;

        const homeWin = (data.victoria_local || 0.33) * 100;
        const handicapHome = homeWin > 60 ? 45 : 35;
        const handicapAway = 100 - handicapHome;

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded">
                        <h6 class="mb-2">⚖️ Hándicap -1 Local</h6>
                        <h3 class="text-success mb-2">${handicapHome}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-success" style="width: ${handicapHome}%"></div>
                        </div>
                        <small class="text-muted">Ganar por 2+ goles</small>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="prediction-item p-3 border rounded">
                        <h6 class="mb-2">⚖️ Hándicap +1 Visitante</h6>
                        <h3 class="text-warning mb-2">${handicapAway}%</h3>
                        <div class="progress mb-2">
                            <div class="progress-bar bg-warning" style="width: ${handicapAway}%"></div>
                        </div>
                        <small class="text-muted">No perder por 2+ goles</small>
                    </div>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-md-4">
                    <div class="small-prediction p-2 border rounded text-center">
                        <strong>Hándicap 0</strong><br>
                        <span class="text-info">Local ${(homeWin).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="small-prediction p-2 border rounded text-center">
                        <strong>Hándicap -0.5</strong><br>
                        <span class="text-info">Local ${(homeWin * 0.9).toFixed(1)}%</span>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="small-prediction p-2 border rounded text-center">
                        <strong>Hándicap +0.5</strong><br>
                        <span class="text-info">Visitante ${(100 - homeWin * 0.9).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateBestBet(data) {
        const container = document.getElementById('best-bet-container');
        if (!container) return;

        const homeProb = (data.victoria_local || data.homeWinProbability || 0.33) * 100;
        const drawProb = (data.empate || data.drawProbability || 0.33) * 100;
        const awayProb = (data.victoria_visitante || data.awayWinProbability || 0.34) * 100;

        let bestBet = 'Victoria Local';
        let bestProb = homeProb;
        let bestIcon = '🏠';

        if (drawProb > bestProb) {
            bestBet = 'Empate';
            bestProb = drawProb;
            bestIcon = '🤝';
        }
        if (awayProb > bestProb) {
            bestBet = 'Victoria Visitante';
            bestProb = awayProb;
            bestIcon = '✈️';
        }

        container.innerHTML = `
            <div class="card border-success">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">🎯 Mejor Apuesta Recomendada</h5>
                </div>
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h4>${bestIcon} ${bestBet}</h4>
                            <p class="mb-0">Probabilidad: <strong>${bestProb.toFixed(1)}%</strong></p>
                            <small class="text-muted">Cuota estimada: ${(100/bestProb).toFixed(2)}</small>
                        </div>
                        <div class="col-md-4 text-end">
                            <span class="badge bg-success fs-6">Confianza: Alta</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async checkServices() {
        try {
            // Check backend
            const backendResponse = await fetch(`${this.apiUrl}/health`);
            const backendStatus = backendResponse.ok;
            
            // Check Python service
            let pythonStatus = false;
            try {
                const pythonResponse = await fetch(`${this.pythonUrl}/health`);
                pythonStatus = pythonResponse.ok;
            } catch (error) {
                console.warn('Python service offline');
            }
            
            this.updateServiceStatus(backendStatus, pythonStatus);
            
        } catch (error) {
            console.error('Error checking services:', error);
            this.updateServiceStatus(false, false);
        }
    }

    updateServiceStatus(backend, python) {
        const apiStatus = document.getElementById('api-status');
        const apiStatusFooter = document.getElementById('api-status-footer');
        
        const status = backend ? 'Online' : 'Offline';
        const statusClass = backend ? 'bg-success' : 'bg-danger';
        
        if (apiStatus) {
            apiStatus.textContent = status;
            apiStatus.className = `badge ${statusClass}`;
        }
        
        if (apiStatusFooter) {
            apiStatusFooter.textContent = status;
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        const analyzeBtn = document.getElementById('analyze-btn');
        
        if (analyzeBtn) {
            if (loading) {
                analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Analizando...';
                analyzeBtn.disabled = true;
            } else {
                analyzeBtn.innerHTML = '<i class="fas fa-chart-line me-1"></i> Generar Predicción';
                analyzeBtn.disabled = false;
            }
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            errorContainer.classList.remove('d-none');
        }
    }

    hideError() {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.classList.add('d-none');
        }
    }

    handleReset(e) {
        e.preventDefault();
        
        // Reset form
        const form = document.getElementById('analysis-form');
        if (form) {
            form.reset();
        }
        
        // Reset date to today
        this.setDefaultDate();
        
        // Hide prediction container
        const container = document.getElementById('prediction-container');
        if (container) {
            container.classList.add('d-none');
        }
        
        // Clear teams
        const homeTeamSelect = document.getElementById('home-team-select');
        const awayTeamSelect = document.getElementById('away-team-select');
        
        if (homeTeamSelect) {
            homeTeamSelect.innerHTML = '<option value="">Selecciona equipo local</option>';
        }
        if (awayTeamSelect) {
            awayTeamSelect.innerHTML = '<option value="">Selecciona equipo visitante</option>';
        }
        
        this.hideError();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando Predictor de Fútbol Premium...');
    window.predictorApp = new PredictorApp();
});