// 🤖 INTEGRACIÓN COMPLETA CON INTELIGENCIA ARTIFICIAL
// Conecta el frontend con el servicio Python ML para predicciones avanzadas

console.log("🤖 Activando Inteligencia Artificial para predicciones...");

// Configuración del servicio IA
const AI_SERVICE = {
    baseUrl: '/api',
    pythonUrl: '/api/python',
    endpoints: {
        predict: '/predict',
        predictAdvanced: '/predict/advanced',
        predictSimple: '/predict/simple',
        pythonStatus: '/python/status',
        health: '/health'
    }
};

// Estado del servicio IA
let aiServiceStatus = {
    available: false,
    modelLoaded: false,
    responseTime: 0,
    accuracy: 0,
    lastCheck: null
};

// Verificar estado del servicio IA
async function checkAIServiceStatus() {
    console.log("🔍 Verificando estado del servicio IA...");
    
    try {
        const startTime = Date.now();
        
        // Verificar backend principal
        const backendResponse = await fetch(`${AI_SERVICE.baseUrl}/health`);
        const backendData = await backendResponse.json();
        
        // Verificar servicio Python
        const pythonResponse = await fetch(`${AI_SERVICE.baseUrl}/python/status`);
        const pythonData = await pythonResponse.json();
        
        const endTime = Date.now();
        
        aiServiceStatus = {
            available: backendResponse.ok && pythonResponse.ok,
            modelLoaded: pythonData.model_loaded || false,
            responseTime: endTime - startTime,
            accuracy: pythonData.accuracy || 0,
            lastCheck: new Date().toISOString(),
            backend: backendData,
            python: pythonData
        };
        
        updateAIStatusIndicator();
        
        console.log("✅ Estado IA actualizado:", aiServiceStatus);
        return aiServiceStatus;
        
    } catch (error) {
        console.warn("⚠️ Servicio IA no disponible, usando modo fallback");
        aiServiceStatus = {
            available: false,
            modelLoaded: false,
            responseTime: 0,
            accuracy: 0,
            lastCheck: new Date().toISOString(),
            error: error.message
        };
        
        updateAIStatusIndicator();
        return aiServiceStatus;
    }
}

// Actualizar indicador visual del estado IA
function updateAIStatusIndicator() {
    // Crear indicador si no existe
    let indicator = document.getElementById('ai-status-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'ai-status-indicator';
        indicator.className = 'ai-status-indicator';
        
        // Añadir al navbar
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            navbar.appendChild(indicator);
        }
    }
    
    const status = aiServiceStatus.available ? 'online' : 'offline';
    const statusText = aiServiceStatus.available ? 'IA Online' : 'IA Offline';
    const icon = aiServiceStatus.available ? '🤖' : '⚠️';
    const accuracy = aiServiceStatus.accuracy ? ` (${(aiServiceStatus.accuracy * 100).toFixed(1)}%)` : '';
    
    indicator.innerHTML = `
        <div class="ai-status ${status}">
            <span class="ai-icon">${icon}</span>
            <span class="ai-text">${statusText}${accuracy}</span>
            <div class="ai-details">
                <small>Modelo: ${aiServiceStatus.modelLoaded ? 'Cargado' : 'No disponible'}</small>
                <small>Respuesta: ${aiServiceStatus.responseTime}ms</small>
            </div>
        </div>
    `;
}

// Realizar predicción con IA
async function predictWithAI(matchData) {
    console.log("🤖 Generando predicción con IA...", matchData);
    
    try {
        // Mostrar loading
        showPredictionLoading();
        
        // Intentar predicción avanzada primero
        let response;
        let predictionType = 'advanced';
        
        if (aiServiceStatus.available) {
            try {
                response = await fetch(`${AI_SERVICE.baseUrl}/predict/advanced`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        homeTeam: matchData.homeTeam,
                        awayTeam: matchData.awayTeam,
                        league: matchData.league,
                        date: matchData.date,
                        includeStats: true
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Servicio avanzado no disponible');
                }
            } catch (error) {
                console.warn("⚠️ Predicción avanzada falló, usando modelo simple");
                predictionType = 'simple';
                
                response = await fetch(`${AI_SERVICE.baseUrl}/predict/simple`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(matchData)
                });
            }
        } else {
            // Usar modelo simple directamente
            predictionType = 'simple';
            response = await fetch(`${AI_SERVICE.baseUrl}/predict/simple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(matchData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`✅ Predicción ${predictionType} generada:`, data);
            
            // Procesar y mostrar resultados
            processPredictionResults(data.data, predictionType);
            
            return data;
        } else {
            throw new Error(data.message || 'Error en predicción');
        }
        
    } catch (error) {
        console.error("❌ Error en predicción IA:", error);
        showPredictionError(error.message);
        return null;
    } finally {
        hidePredictionLoading();
    }
}

// Procesar resultados de predicción
function processPredictionResults(data, type) {
    console.log("📊 Procesando resultados de predicción...");
    
    // Normalizar datos según el tipo de predicción
    const normalizedData = type === 'advanced' ? normalizeAdvancedPrediction(data) : normalizeSimplePrediction(data);
    
    // Mostrar en interfaz
    displayPredictionResults(normalizedData, type);
    
    // Actualizar recomendación
    updateBestBetRecommendation(normalizedData);
    
    // Añadir análisis IA
    addAIAnalysis(normalizedData, type);
}

// Normalizar predicción avanzada
function normalizeAdvancedPrediction(data) {
    return {
        result: {
            home: data.homeWinProbability || data.victoria_local || 0,
            draw: data.drawProbability || data.empate || 0,
            away: data.awayWinProbability || data.victoria_visitante || 0
        },
        expectedGoals: data.expectedGoals || {
            home: data.goles_esperados_local || 0,
            away: data.goles_esperados_visitante || 0,
            total: data.total_goles_esperados || 0
        },
        markets: data.markets || {},
        confidence: data.confidence || 5,
        analysis: data.analisis || data.analysis,
        modelType: 'advanced'
    };
}

// Normalizar predicción simple
function normalizeSimplePrediction(data) {
    return {
        result: {
            home: data.victoria_local || 0,
            draw: data.empate || 0,
            away: data.victoria_visitante || 0
        },
        expectedGoals: {
            home: data.goles_esperados_local || 0,
            away: data.goles_esperados_visitante || 0,
            total: (data.goles_esperados_local || 0) + (data.goles_esperados_visitante || 0)
        },
        markets: data.mercados_adicionales || {},
        confidence: data.confianza === 'alta' ? 8 : data.confianza === 'media' ? 5 : 3,
        analysis: data.analisis,
        modelType: 'simple'
    };
}

// Mostrar resultados en la interfaz
function displayPredictionResults(data, type) {
    // Actualizar información del partido
    updateMatchInfo(data);
    
    // Mostrar resultados 1X2
    updateResultTab(data.result, data.confidence);
    
    // Mostrar mercados adicionales si están disponibles
    if (data.markets.btts || data.markets.ambos_equipos_marcan) {
        updateBTTSTab(data.markets);
    }
    
    if (data.markets.overUnder || data.markets.mas_2_5_goles) {
        updateOverUnderTab(data.markets, data.expectedGoals);
    }
    
    // Mostrar badge del tipo de modelo usado
    showModelTypeBadge(type);
    
    // Mostrar contenedor de predicción
    const container = document.getElementById('prediction-container');
    if (container) {
        container.classList.remove('d-none');
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// Actualizar información del partido
function updateMatchInfo(data) {
    const homeTeamName = document.getElementById('home-team-name');
    const awayTeamName = document.getElementById('away-team-name');
    const matchDate = document.getElementById('match-date');
    const leagueName = document.getElementById('league-name');
    
    if (homeTeamName) homeTeamName.textContent = document.getElementById('home-team-select')?.value || '';
    if (awayTeamName) awayTeamName.textContent = document.getElementById('away-team-select')?.value || '';
    if (matchDate) matchDate.textContent = document.getElementById('date-input')?.value || '';
    if (leagueName) leagueName.textContent = document.getElementById('league-select')?.value || '';
}

// Actualizar pestaña de resultado
function updateResultTab(result, confidence) {
    const container = document.getElementById('result-predictions');
    if (!container) return;
    
    const homePerc = (result.home * 100).toFixed(1);
    const drawPerc = (result.draw * 100).toFixed(1);
    const awayPerc = (result.away * 100).toFixed(1);
    
    container.innerHTML = `
        <div class="prediction-summary">
            <div class="prediction-confidence">
                <span class="confidence-label">Confianza del modelo:</span>
                <span class="confidence-value">${confidence}/10</span>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidence * 10}%"></div>
                </div>
            </div>
        </div>
        
        <div class="prediction-items">
            <div class="prediction-item ${result.home > Math.max(result.draw, result.away) ? 'recommended' : ''}">
                <div class="prediction-label">
                    <span class="icon">🏠</span>
                    <span>Victoria Local (1)</span>
                </div>
                <div class="prediction-bar">
                    <div class="progress-bar">
                        <div class="progress-fill home" style="width: ${homePerc}%"></div>
                    </div>
                    <span class="percentage">${homePerc}%</span>
                </div>
                <div class="prediction-odds">Cuota: ${(1/result.home).toFixed(2)}</div>
            </div>
            
            <div class="prediction-item ${result.draw > Math.max(result.home, result.away) ? 'recommended' : ''}">
                <div class="prediction-label">
                    <span class="icon">🤝</span>
                    <span>Empate (X)</span>
                </div>
                <div class="prediction-bar">
                    <div class="progress-bar">
                        <div class="progress-fill draw" style="width: ${drawPerc}%"></div>
                    </div>
                    <span class="percentage">${drawPerc}%</span>
                </div>
                <div class="prediction-odds">Cuota: ${(1/result.draw).toFixed(2)}</div>
            </div>
            
            <div class="prediction-item ${result.away > Math.max(result.home, result.draw) ? 'recommended' : ''}">
                <div class="prediction-label">
                    <span class="icon">✈️</span>
                    <span>Victoria Visitante (2)</span>
                </div>
                <div class="prediction-bar">
                    <div class="progress-bar">
                        <div class="progress-fill away" style="width: ${awayPerc}%"></div>
                    </div>
                    <span class="percentage">${awayPerc}%</span>
                </div>
                <div class="prediction-odds">Cuota: ${(1/result.away).toFixed(2)}</div>
            </div>
        </div>
    `;
}

// Mostrar badge del tipo de modelo
function showModelTypeBadge(type) {
    let badge = document.getElementById('model-type-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'model-type-badge';
        badge.className = 'model-type-badge';
        
        const header = document.querySelector('#prediction-container .card-header');
        if (header) {
            header.appendChild(badge);
        }
    }
    
    const isAdvanced = type === 'advanced';
    badge.innerHTML = `
        <span class="badge ${isAdvanced ? 'bg-success' : 'bg-warning'}">
            ${isAdvanced ? '🤖 IA Avanzada' : '📊 Modelo Básico'}
        </span>
    `;
}

// Añadir análisis IA
function addAIAnalysis(data, type) {
    let analysisContainer = document.getElementById('ai-analysis-container');
    if (!analysisContainer) {
        analysisContainer = document.createElement('div');
        analysisContainer.id = 'ai-analysis-container';
        analysisContainer.className = 'ai-analysis-container mt-4';
        
        const predictionContainer = document.getElementById('prediction-container');
        if (predictionContainer) {
            predictionContainer.appendChild(analysisContainer);
        }
    }
    
    const analysis = generateAIAnalysis(data, type);
    
    analysisContainer.innerHTML = `
        <div class="card">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0">
                    <i class="fas fa-robot me-2"></i>
                    Análisis de Inteligencia Artificial
                </h5>
            </div>
            <div class="card-body">
                <div class="ai-insights">
                    ${analysis.insights.map(insight => `
                        <div class="insight-item">
                            <div class="insight-icon">${insight.icon}</div>
                            <div class="insight-content">
                                <strong>${insight.title}</strong>
                                <p>${insight.description}</p>
                            </div>
                            <div class="insight-confidence">
                                <span class="confidence-score">${insight.confidence}/10</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="ai-recommendation mt-3">
                    <h6>💡 Recomendación Principal:</h6>
                    <div class="recommendation-card ${analysis.recommendation.confidence > 7 ? 'high-confidence' : ''}">
                        <div class="recommendation-content">
                            <strong>${analysis.recommendation.market}</strong>: ${analysis.recommendation.selection}
                        </div>
                        <div class="recommendation-reason">
                            ${analysis.recommendation.reason}
                        </div>
                        <div class="recommendation-confidence">
                            Confianza: ${analysis.recommendation.confidence}/10
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generar análisis IA
function generateAIAnalysis(data, type) {
    const insights = [];
    
    // Análisis de resultado
    const resultAnalysis = analyzeResult(data.result);
    insights.push({
        icon: '🎯',
        title: 'Predicción de Resultado',
        description: resultAnalysis.description,
        confidence: resultAnalysis.confidence
    });
    
    // Análisis de goles
    const goalsAnalysis = analyzeExpectedGoals(data.expectedGoals);
    insights.push({
        icon: '⚽',
        title: 'Expectativa de Goles',
        description: goalsAnalysis.description,
        confidence: goalsAnalysis.confidence
    });
    
    // Análisis del modelo usado
    const modelAnalysis = analyzeModelType(type);
    insights.push({
        icon: '🤖',
        title: 'Precisión del Modelo',
        description: modelAnalysis.description,
        confidence: modelAnalysis.confidence
    });
    
    // Generar recomendación principal
    const recommendation = generateMainRecommendation(data);
    
    return { insights, recommendation };
}

// Análisis de resultado
function analyzeResult(result) {
    const max = Math.max(result.home, result.draw, result.away);
    const winner = result.home === max ? 'local' : result.draw === max ? 'empate' : 'visitante';
    const confidence = Math.round(max * 10);
    
    let description;
    if (max > 0.7) {
        description = `Resultado muy probable: ${winner}. El modelo muestra alta confianza en este pronóstico.`;
    } else if (max > 0.5) {
        description = `Resultado probable: ${winner}. Ventaja moderada según el análisis estadístico.`;
    } else {
        description = `Partido equilibrado. Los resultados están muy reñidos según las predicciones.`;
    }
    
    return { description, confidence };
}

// Análisis de goles esperados
function analyzeExpectedGoals(goals) {
    const total = goals.total;
    let description;
    let confidence = 7;
    
    if (total > 3.5) {
        description = `Partido con muchos goles esperados (${total.toFixed(1)}). Ideal para mercados Over.`;
        confidence = 8;
    } else if (total > 2.5) {
        description = `Partido con goles moderados (${total.toFixed(1)}). Equilibrio entre Over/Under 2.5.`;
        confidence = 7;
    } else {
        description = `Partido con pocos goles esperados (${total.toFixed(1)}). Favorable para Under y defensas sólidas.`;
        confidence = 8;
    }
    
    return { description, confidence };
}

// Análisis del tipo de modelo
function analyzeModelType(type) {
    if (type === 'advanced') {
        return {
            description: 'Predicción generada con IA avanzada usando Machine Learning. Mayor precisión y análisis profundo.',
            confidence: 9
        };
    } else {
        return {
            description: 'Predicción generada con modelo estadístico básico. Análisis confiable basado en datos históricos.',
            confidence: 6
        };
    }
}

// Generar recomendación principal
function generateMainRecommendation(data) {
    const result = data.result;
    const goals = data.expectedGoals;
    
    // Encontrar la predicción con mayor confianza
    const maxResult = Math.max(result.home, result.draw, result.away);
    const resultConfidence = maxResult * 10;
    
    let market, selection, reason, confidence;
    
    if (maxResult > 0.65) {
        // Apuesta al resultado si es muy probable
        if (result.home === maxResult) {
            market = 'Resultado 1X2';
            selection = 'Victoria Local';
            reason = `El equipo local tiene ${(maxResult * 100).toFixed(1)}% de probabilidades de ganar.`;
            confidence = Math.round(resultConfidence);
        } else if (result.away === maxResult) {
            market = 'Resultado 1X2';
            selection = 'Victoria Visitante';
            reason = `El equipo visitante tiene ${(maxResult * 100).toFixed(1)}% de probabilidades de ganar.`;
            confidence = Math.round(resultConfidence);
        } else {
            market = 'Resultado 1X2';
            selection = 'Empate';
            reason = `Alta probabilidad de empate (${(maxResult * 100).toFixed(1)}%).`;
            confidence = Math.round(resultConfidence);
        }
    } else {
        // Apuesta a goles si el resultado es incierto
        if (goals.total > 2.7) {
            market = 'Over/Under';
            selection = 'Over 2.5 goles';
            reason = `Se esperan ${goals.total.toFixed(1)} goles en total. Ambos equipos deberían marcar.`;
            confidence = 7;
        } else {
            market = 'Over/Under';
            selection = 'Under 2.5 goles';
            reason = `Se esperan solo ${goals.total.toFixed(1)} goles. Partido defensivo probable.`;
            confidence = 7;
        }
    }
    
    return { market, selection, reason, confidence };
}

// Funciones auxiliares para UI
function showPredictionLoading() {
    const analyzeBtn = document.getElementById('analyze-btn') || document.querySelector('button[type="button"]:contains("Analizar")');
    if (analyzeBtn) {
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Analizando con IA...';
        analyzeBtn.disabled = true;
    }
}

function hidePredictionLoading() {
    const analyzeBtn = document.getElementById('analyze-btn') || document.querySelector('button[type="button"]:contains("Analizar")');
    if (analyzeBtn) {
        analyzeBtn.innerHTML = '<i class="fas fa-chart-line me-1"></i> Analizar Partido';
        analyzeBtn.disabled = false;
    }
}

function showPredictionError(message) {
    const errorContainer = document.getElementById('error-container') || document.createElement('div');
    errorContainer.id = 'error-container';
    errorContainer.className = 'alert alert-danger mt-3';
    errorContainer.innerHTML = `
        <strong>Error en predicción:</strong> ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    const form = document.getElementById('analysis-form');
    if (form && form.parentNode) {
        form.parentNode.insertBefore(errorContainer, form.nextSibling);
    }
}

// Configurar evento del botón de análisis
function setupAnalyzeButton() {
    const analyzeBtn = document.querySelector('[id*="analyze"], button:contains("Analizar")') 
                    || document.querySelector('button[class*="btn-primary"]');
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async function() {
            const homeTeam = document.getElementById('home-team-select')?.value;
            const awayTeam = document.getElementById('away-team-select')?.value;
            const league = document.getElementById('league-select')?.value;
            const date = document.getElementById('date-input')?.value;
            
            if (!homeTeam || !awayTeam || !league) {
                alert('Por favor, selecciona todos los campos requeridos');
                return;
            }
            
            await predictWithAI({
                homeTeam,
                awayTeam,
                league,
                date: date || new Date().toISOString().split('T')[0]
            });
        });
    }
}

// Estilos CSS para IA
const aiStyles = `
    .ai-status-indicator {
        margin-left: auto;
        margin-right: 15px;
    }
    .ai-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        transition: all 0.3s ease;
    }
    .ai-status.online {
        background: rgba(40, 167, 69, 0.1);
        border: 1px solid #28a745;
        color: #28a745;
    }
    .ai-status.offline {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid #ffc107;
        color: #856404;
    }
    .ai-details {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
    }
    .model-type-badge {
        margin-left: auto;
    }
    .ai-analysis-container .insight-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        border-bottom: 1px solid #e9ecef;
    }
    .insight-icon {
        font-size: 24px;
        width: 40px;
        text-align: center;
    }
    .insight-content {
        flex: 1;
    }
    .insight-confidence {
        font-weight: bold;
        color: #007bff;
    }
    .recommendation-card {
        padding: 15px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        background: #f8f9fa;
    }
    .recommendation-card.high-confidence {
        border-color: #28a745;
        background: #d4edda;
    }
    .confidence-bar {
        width: 100%;
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
        margin-top: 5px;
    }
    .confidence-fill {
        height: 100%;
        background: linear-gradient(90deg, #ffc107, #28a745);
        transition: width 0.3s ease;
    }
    .prediction-item.recommended {
        background: linear-gradient(135deg, #d4edda, #f8f9fa);
        border-left: 4px solid #28a745;
    }
    .progress-fill.home { background: linear-gradient(90deg, #28a745, #20c997); }
    .progress-fill.draw { background: linear-gradient(90deg, #ffc107, #fd7e14); }
    .progress-fill.away { background: linear-gradient(90deg, #dc3545, #e83e8c); }
`;

// Añadir estilos
const aiStyleSheet = document.createElement('style');
aiStyleSheet.textContent = aiStyles;
document.head.appendChild(aiStyleSheet);

// Inicializar sistema IA
async function initializeAI() {
    console.log("🚀 Inicializando sistema de IA...");
    
    // Verificar estado
    await checkAIServiceStatus();
    
    // Configurar botón de análisis
    setupAnalyzeButton();
    
    // Verificar estado cada 30 segundos
    setInterval(checkAIServiceStatus, 30000);
    
    console.log("✅ Sistema de IA inicializado");
}

// Exponer funciones globales
window.predictWithAI = predictWithAI;
window.checkAIServiceStatus = checkAIServiceStatus;

// Inicializar cuando esté listo
if (document.readyState !== 'loading') {
    initializeAI();
} else {
    document.addEventListener('DOMContentLoaded', initializeAI);
}

console.log("🤖 ¡Inteligencia Artificial activada!");
console.log("✅ Predicciones avanzadas con ML");
console.log("🎯 Análisis inteligente de partidos");
console.log("📊 Fallback automático disponible");