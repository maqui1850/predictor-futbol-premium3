// frontend/js/main.js - JavaScript corregido para el Predictor de Fútbol

// Configurar fecha por defecto
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date-input') || document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
    }

    // Llenar opciones de liga
    fillLeagueOptions();
    
    // Configurar event listeners
    setupEventListeners();
    
    console.log('🚀 Predictor de Fútbol Premium cargado correctamente');
});

// Llenar opciones de liga
function fillLeagueOptions() {
    const leagueSelect = document.getElementById('league-select') || document.getElementById('league');
    if (!leagueSelect) return;
    
    const leagues = [
        { value: 'Premier League', text: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League (Inglaterra)' },
        { value: 'La Liga', text: '🇪🇸 La Liga (España)' },
        { value: 'Bundesliga', text: '🇩🇪 Bundesliga (Alemania)' },
        { value: 'Serie A', text: '🇮🇹 Serie A (Italia)' },
        { value: 'Ligue 1', text: '🇫🇷 Ligue 1 (Francia)' },
        { value: 'Champions League', text: '🏆 Champions League' },
        { value: 'Europa League', text: '🥈 Europa League' }
    ];
    
    // Limpiar opciones existentes excepto la primera
    leagueSelect.innerHTML = '<option value="">Selecciona una liga</option>';
    
    // Agregar opciones
    leagues.forEach(league => {
        const option = document.createElement('option');
        option.value = league.value;
        option.textContent = league.text;
        leagueSelect.appendChild(option);
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de análisis
    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisForm = document.getElementById('analysis-form');
    const predictionForm = document.getElementById('prediction-form');
    
    // Buscar el formulario y botón correcto
    const form = analysisForm || predictionForm;
    const button = analyzeBtn || document.querySelector('button[type="submit"]') || document.querySelector('.btn-primary');
    
    if (form) {
        form.addEventListener('submit', handlePredictionSubmit);
        console.log('✅ Event listener agregado al formulario');
    }
    
    if (button && !form) {
        button.addEventListener('click', handlePredictionClick);
        console.log('✅ Event listener agregado al botón');
    }
    
    // Botón de reset
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
}

// Manejar envío del formulario
function handlePredictionSubmit(event) {
    event.preventDefault();
    console.log('📝 Formulario enviado');
    
    const formData = extractFormData();
    if (validateFormData(formData)) {
        generatePrediction(formData);
    }
}

// Manejar clic del botón
function handlePredictionClick(event) {
    event.preventDefault();
    console.log('🖱️ Botón clickeado');
    
    const formData = extractFormData();
    if (validateFormData(formData)) {
        generatePrediction(formData);
    }
}

// Extraer datos del formulario
function extractFormData() {
    const getElementValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    };
    
    return {
        league: getElementValue('league-select') || getElementValue('league'),
        date: getElementValue('date-input') || getElementValue('date'),
        homeTeam: getElementValue('home-team-select') || getElementValue('home-team') || getElementValue('homeTeam'),
        awayTeam: getElementValue('away-team-select') || getElementValue('away-team') || getElementValue('awayTeam')
    };
}

// Validar datos del formulario
function validateFormData(data) {
    const errors = [];
    
    if (!data.homeTeam) errors.push('Selecciona o escribe el equipo local');
    if (!data.awayTeam) errors.push('Selecciona o escribe el equipo visitante');
    if (!data.league) errors.push('Selecciona una liga');
    if (!data.date) errors.push('Selecciona una fecha');
    
    if (data.homeTeam && data.awayTeam && data.homeTeam.toLowerCase() === data.awayTeam.toLowerCase()) {
        errors.push('Los equipos no pueden ser iguales');
    }
    
    if (errors.length > 0) {
        showError(errors.join('<br>'));
        return false;
    }
    
    return true;
}

// Generar predicción
async function generatePrediction(formData) {
    console.log('🎯 Generando predicción con datos:', formData);
    
    // Mostrar loading
    showLoading(true);
    hideError();
    hidePredictionResults();
    
    try {
        // Preparar datos para la API
        const requestData = {
            homeTeam: formData.homeTeam,
            awayTeam: formData.awayTeam,
            league: formData.league,
            date: formData.date
        };
        
        console.log('📡 Enviando petición a:', '/api/predict');
        console.log('📤 Datos enviados:', requestData);
        
        // Hacer petición a la API
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('📥 Respuesta recibida:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Datos de predicción:', result);
        
        if (result.success) {
            displayPredictionResults(result, formData);
        } else {
            throw new Error(result.message || 'Error desconocido en la predicción');
        }
        
    } catch (error) {
        console.error('❌ Error en predicción:', error);
        showError(`Error al generar predicción: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    const button = document.querySelector('.btn-primary') || document.getElementById('analyze-btn');
    if (!button) return;
    
    if (show) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Analizando...';
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.innerHTML = '<i class="fas fa-chart-line me-1"></i> Generar Predicción';
        button.disabled = false;
        button.classList.remove('loading');
    }
}

// Mostrar error
function showError(message) {
    let errorContainer = document.getElementById('error-container');
    
    if (!errorContainer) {
        // Crear contenedor de error si no existe
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'alert alert-danger alert-dismissible fade show';
        
        const form = document.querySelector('.card-body');
        if (form) {
            form.insertBefore(errorContainer, form.firstChild);
        }
    }
    
    errorContainer.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="hideError()"></button>
    `;
    errorContainer.style.display = 'block';
    errorContainer.classList.remove('d-none');
}

// Ocultar error
function hideError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.style.display = 'none';
        errorContainer.classList.add('d-none');
    }
}

// Mostrar resultados de predicción
function displayPredictionResults(result, formData) {
    console.log('📊 Mostrando resultados:', result);
    
    try {
        // Actualizar información del partido
        updateMatchInfo(formData, result);
        
        // Actualizar probabilidades
        updateProbabilities(result.data);
        
        // Actualizar análisis
        updateAnalysis(result.data);
        
        // Mostrar información del modelo
        updateModelInfo(result);
        
        // Mostrar contenedor de resultados
        showPredictionResults();
        
        // Scroll a resultados
        scrollToResults();
        
        console.log('✅ Resultados mostrados correctamente');
        
    } catch (error) {
        console.error('❌ Error mostrando resultados:', error);
        showError('Error al mostrar los resultados de la predicción');
    }
}

// Actualizar información del partido
function updateMatchInfo(formData, result) {
    // Nombres de equipos
    const homeNameEl = document.getElementById('home-team-name') || document.getElementById('home-name');
    const awayNameEl = document.getElementById('away-team-name') || document.getElementById('away-name');
    
    if (homeNameEl) homeNameEl.textContent = formData.homeTeam;
    if (awayNameEl) awayNameEl.textContent = formData.awayTeam;
    
    // Liga y fecha
    const leagueEl = document.getElementById('league-name');
    const dateEl = document.getElementById('match-date');
    
    if (leagueEl) leagueEl.textContent = formData.league;
    if (dateEl) {
        const fecha = new Date(formData.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateEl.textContent = fecha;
    }
}

// Actualizar probabilidades
function updateProbabilities(data) {
    // Extraer probabilidades del resultado
    const homeProb = data.victoria_local || data.homeWinProbability || 0;
    const drawProb = data.empate || data.drawProbability || 0;
    const awayProb = data.victoria_visitante || data.awayWinProbability || 0;
    
    // Actualizar elementos
    const homeProbEl = document.getElementById('home-prob');
    const drawProbEl = document.getElementById('draw-prob');
    const awayProbEl = document.getElementById('away-prob');
    
    if (homeProbEl) homeProbEl.textContent = `${(homeProb * 100).toFixed(1)}%`;
    if (drawProbEl) drawProbEl.textContent = `${(drawProb * 100).toFixed(1)}%`;
    if (awayProbEl) awayProbEl.textContent = `${(awayProb * 100).toFixed(1)}%`;
    
    // Actualizar clases de confianza
    updateConfidenceClasses(homeProb, drawProb, awayProb);
}

// Actualizar clases de confianza
function updateConfidenceClasses(homeProb, drawProb, awayProb) {
    const getConfidenceClass = (prob) => {
        if (prob >= 0.6) return 'confidence-high';
        if (prob >= 0.4) return 'confidence-medium';
        return 'confidence-low';
    };
    
    const homeCard = document.querySelector('.prediction-card:nth-child(1)');
    const drawCard = document.querySelector('.prediction-card:nth-child(2)');
    const awayCard = document.querySelector('.prediction-card:nth-child(3)');
    
    if (homeCard) {
        homeCard.className = `prediction-card card h-100 ${getConfidenceClass(homeProb)}`;
    }
    if (drawCard) {
        drawCard.className = `prediction-card card h-100 ${getConfidenceClass(drawProb)}`;
    }
    if (awayCard) {
        awayCard.className = `prediction-card card h-100 ${getConfidenceClass(awayProb)}`;
    }
}

// Actualizar análisis
function updateAnalysis(data) {
    const analysisEl = document.getElementById('analysis-text');
    if (!analysisEl) return;
    
    let analysisText = '';
    
    if (data.analisis && data.analisis.general) {
        analysisText = data.analisis.general;
    } else if (data.analysis) {
        analysisText = data.analysis;
    } else {
        // Generar análisis básico
        const homeProb = data.victoria_local || data.homeWinProbability || 0;
        const awayProb = data.victoria_visitante || data.awayWinProbability || 0;
        
        if (homeProb > 0.6) {
            analysisText = `El equipo local tiene una clara ventaja con ${(homeProb * 100).toFixed(1)}% de probabilidades de victoria.`;
        } else if (awayProb > 0.6) {
            analysisText = `El equipo visitante parte como favorito con ${(awayProb * 100).toFixed(1)}% de probabilidades de ganar.`;
        } else {
            analysisText = 'Partido muy equilibrado con resultado incierto. Cualquier resultado es posible.';
        }
    }
    
    analysisEl.textContent = analysisText;
}

// Actualizar información del modelo
function updateModelInfo(result) {
    // Buscar o crear elemento de información del modelo
    let modelInfoEl = document.getElementById('model-info');
    
    if (!modelInfoEl) {
        modelInfoEl = document.createElement('div');
        modelInfoEl.id = 'model-info';
        modelInfoEl.className = 'alert alert-info mt-3';
        
        const analysisCard = document.querySelector('.card .card-body:last-child');
        if (analysisCard) {
            analysisCard.appendChild(modelInfoEl);
        }
    }
    
    const modelType = result.modelType || 'simple';
    const serviceStatus = result.serviceStatus || 'unknown';
    
    let modelText = '';
    let modelIcon = '';
    
    if (modelType.includes('advanced') || modelType.includes('ml')) {
        modelText = '🤖 Predicción generada con Inteligencia Artificial avanzada';
        modelIcon = 'fas fa-brain';
    } else {
        modelText = '📊 Predicción generada con modelo estadístico básico';
        modelIcon = 'fas fa-chart-bar';
    }
    
    modelInfoEl.innerHTML = `
        <i class="${modelIcon} me-2"></i>
        ${modelText}
        <small class="text-muted d-block mt-1">
            Modelo: ${modelType} | Estado: ${serviceStatus}
        </small>
    `;
}

// Mostrar contenedor de resultados
function showPredictionResults() {
    const resultsContainer = document.getElementById('prediction-container') || document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.classList.remove('d-none');
    }
}

// Ocultar resultados
function hidePredictionResults() {
    const resultsContainer = document.getElementById('prediction-container') || document.getElementById('results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
        resultsContainer.classList.add('d-none');
    }
}

// Scroll a resultados
function scrollToResults() {
    const resultsContainer = document.getElementById('prediction-container') || document.getElementById('results');
    if (resultsContainer) {
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
}

// Reset formulario
function resetForm() {
    const form = document.getElementById('analysis-form') || document.getElementById('prediction-form');
    if (form) {
        form.reset();
        
        // Restablecer fecha
        const dateInput = document.getElementById('date-input') || document.getElementById('date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }
    
    hidePredictionResults();
    hideError();
    
    console.log('🔄 Formulario reseteado');
}

// Función global para debugging
window.debugPredictor = function() {
    console.log('🔍 Debug Info:');
    console.log('- Formulario:', document.getElementById('analysis-form') || document.getElementById('prediction-form'));
    console.log('- Botón:', document.querySelector('.btn-primary'));
    console.log('- Liga:', document.getElementById('league-select') || document.getElementById('league'));
    console.log('- Fecha:', document.getElementById('date-input') || document.getElementById('date'));
    console.log('- Local:', document.getElementById('home-team-select') || document.getElementById('homeTeam'));
    console.log('- Visitante:', document.getElementById('away-team-select') || document.getElementById('awayTeam'));
};

// Función de prueba
window.testPrediction = function() {
    console.log('🧪 Ejecutando prueba de predicción...');
    
    const formData = {
        league: 'La Liga',
        date: new Date().toISOString().split('T')[0],
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona'
    };
    
    generatePrediction(formData);
};

console.log('✅ main.js cargado completamente');