// frontend/js/advancedPrediction.js

/**
 * Módulo para la visualización y gestión de predicciones avanzadas
 */
const AdvancedPrediction = (function() {
  // Elementos DOM
  let predictionForm;
  let resultContainer;
  let loadingIndicator;
  let errorContainer;
  let teamStatsContainer;
  let confidenceIndicator;
  let marketsTabs;
  let chartContainer;
  
  // Configuración de la aplicación
  const config = {
    apiUrl: '/api',
    useAdvancedModel: true,
    showDetailedStats: true,
    refreshInterval: null,
    animationDuration: 800,
    chartColors: {
      home: 'rgba(54, 162, 235, 0.8)',
      draw: 'rgba(255, 206, 86, 0.8)',
      away: 'rgba(255, 99, 132, 0.8)',
      background: 'rgba(255, 255, 255, 0.1)'
    }
  };
  
  // Datos de la última predicción
  let lastPrediction = null;
  
  /**
   * Inicializa el módulo
   */
  function init() {
    // Capturar elementos DOM
    predictionForm = document.getElementById('prediction-form');
    resultContainer = document.getElementById('prediction-result');
    loadingIndicator = document.getElementById('loading-indicator');
    errorContainer = document.getElementById('error-container');
    teamStatsContainer = document.getElementById('team-stats-container');
    confidenceIndicator = document.getElementById('confidence-indicator');
    marketsTabs = document.getElementById('markets-tabs');
    chartContainer = document.getElementById('prediction-chart');
    
    // Vincular eventos
    if (predictionForm) {
      predictionForm.addEventListener('submit', handlePredictionSubmit);
      
      // Agregar opciones para modelo avanzado
      const modelTypeField = document.createElement('div');
      modelTypeField.className = 'form-check form-switch mb-3';
      modelTypeField.innerHTML = `
        <input class="form-check-input" type="checkbox" id="use-advanced-model" ${config.useAdvancedModel ? 'checked' : ''}>
        <label class="form-check-label" for="use-advanced-model">Usar modelo avanzado</label>
      `;
      
      predictionForm.appendChild(modelTypeField);
      
      // Evento para el switch de modelo avanzado
      document.getElementById('use-advanced-model').addEventListener('change', function(e) {
        config.useAdvancedModel = e.target.checked;
      });
    }
    
    // Verificar estado del servicio Python
    checkPythonService();
    
    console.log('Módulo de predicción avanzada inicializado');
  }
  
  /**
   * Verifica el estado del servicio Python
   */
  function checkPythonService() {
    fetch(`${config.apiUrl}/python/status`)
      .then(response => response.json())
      .then(data => {
        const statusBadge = document.getElementById('python-service-status');
        if (statusBadge) {
          if (data.success && data.status === 'online') {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'badge bg-success';
            
            // Actualizar información de rendimiento si existe el elemento
            const perfInfo = document.getElementById('service-performance');
            if (perfInfo && data.metrics) {
              perfInfo.innerHTML = `
                <small>
                  Tiempo de respuesta: ${data.responseTime}ms | 
                  Éxito: ${data.metrics.successRate} | 
                  Caché: ${data.metrics.cacheHitRate}
                </small>
              `;
            }
          } else {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'badge bg-danger';
            
            // Deshabilitar switch de modelo avanzado
            const modelSwitch = document.getElementById('use-advanced-model');
            if (modelSwitch) {
              modelSwitch.checked = false;
              modelSwitch.disabled = true;
              config.useAdvancedModel = false;
            }
          }
        }
      })
      .catch(error => {
        console.error('Error verificando estado del servicio Python:', error);
        const statusBadge = document.getElementById('python-service-status');
        if (statusBadge) {
          statusBadge.textContent = 'Error';
          statusBadge.className = 'badge bg-warning';
        }
      });
  }
  
  /**
   * Maneja el envío del formulario de predicción
   * @param {Event} e - Evento del formulario
   */
  function handlePredictionSubmit(e) {
    e.preventDefault();
    
    // Mostrar indicador de carga
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
    
    // Ocultar contenedores de resultados y errores
    if (resultContainer) {
      resultContainer.style.display = 'none';
    }
    if (errorContainer) {
      errorContainer.style.display = 'none';
    }
    
    // Obtener datos del formulario
    const formData = new FormData(predictionForm);
    const predictionData = {
      homeTeam: formData.get('homeTeam'),
      awayTeam: formData.get('awayTeam'),
      league: formData.get('league'),
      date: formData.get('date'),
      includeStats: true
    };
    
    // Determinar endpoint según configuración
    const endpoint = config.useAdvancedModel ? 
      `${config.apiUrl}/predict/advanced` : 
      `${config.apiUrl}/predict/simple`;
    
    // Enviar solicitud
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(predictionData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Ocultar indicador de carga
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      if (data.success) {
        // Guardar predicción actual
        lastPrediction = data;
        
        // Mostrar resultados
        displayPredictionResults(data);
      } else {
        throw new Error(data.message || 'Error desconocido al obtener predicción');
      }
    })
    .catch(error => {
      console.error('Error en predicción:', error);
      
      // Ocultar indicador de carga
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Mostrar error
      if (errorContainer) {
        errorContainer.style.display = 'block';
        errorContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong>Error:</strong> ${error.message}
          </div>
        `;
      }
    });
  }
  
  /**
   * Muestra los resultados de la predicción
   * @param {object} data - Datos de predicción
   */
  function displayPredictionResults(data) {
    if (!resultContainer) return;
    
    // Extraer datos relevantes
    const prediction = data.data;
    const isAdvanced = data.modelType === 'advanced';
    
    // Preparar datos para visualización
    const homeTeam = prediction.equipoLocal;
    const awayTeam = prediction.equipoVisitante;
    
    // Probabilidades según modelo
    let homeProb, drawProb, awayProb, expectedGoalsHome, expectedGoalsAway;
    
    if (isAdvanced) {
      homeProb = prediction.homeWinProbability;
      drawProb = prediction.drawProbability;
      awayProb = prediction.awayWinProbability;
      expectedGoalsHome = prediction.expectedGoals.home;
      expectedGoalsAway = prediction.expectedGoals.away;
    } else {
      homeProb = prediction.victoria_local;
      drawProb = prediction.empate;
      awayProb = prediction.victoria_visitante;
      expectedGoalsHome = prediction.goles_esperados_local;
      expectedGoalsAway = prediction.goles_esperados_visitante;
    }
    
    // Construir HTML de resultados
    const resultHTML = `
      <div class="card prediction-card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Predicción: ${homeTeam} vs ${awayTeam}</h5>
          <span class="badge ${isAdvanced ? 'bg-primary' : 'bg-secondary'}">
            ${isAdvanced ? 'Modelo Avanzado' : 'Modelo Simple'}
          </span>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-4 text-center">
              <h6>${homeTeam}</h6>
              <div class="probability-circle" style="background: conic-gradient(#36a2eb ${homeProb * 360}deg, #e2e3e5 0deg);">
                <span>${Math.round(homeProb * 100)}%</span>
              </div>
              <p class="mt-2">Victoria Local</p>
              <p class="text-muted small">xG: ${expectedGoalsHome.toFixed(1)}</p>
            </div>
            <div class="col-md-4 text-center">
              <h6>Empate</h6>
              <div class="probability-circle" style="background: conic-gradient(#ffce56 ${drawProb * 360}deg, #e2e3e5 0deg);">
                <span>${Math.round(drawProb * 100)}%</span>
              </div>
              <p class="mt-2">Empate</p>
              <p class="text-muted small">Total xG: ${(expectedGoalsHome + expectedGoalsAway).toFixed(1)}</p>
            </div>
            <div class="col-md-4 text-center">
              <h6>${awayTeam}</h6>
              <div class="probability-circle" style="background: conic-gradient(#ff6384 ${awayProb * 360}deg, #e2e3e5 0deg);">
                <span>${Math.round(awayProb * 100)}%</span>
              </div>
              <p class="mt-2">Victoria Visitante</p>
              <p class="text-muted small">xG: ${expectedGoalsAway.toFixed(1)}</p>
            </div>
          </div>
          
          ${isAdvanced ? renderAdvancedDetails(prediction) : renderSimpleDetails(prediction)}
          
          <div class="row mt-4">
            <div class="col-12">
              <h6>Análisis:</h6>
              <p>${prediction.analisis?.general || 'No hay análisis disponible'}</p>
            </div>
          </div>
        </div>
        <div class="card-footer text-muted">
          <small>Fecha: ${prediction.fecha} | Liga: ${prediction.liga} | Fuente: ${prediction.source || 'modelo interno'}</small>
        </div>
      </div>
    `;
    
    // Mostrar resultados con animación
    resultContainer.innerHTML = resultHTML;
    resultContainer.style.display = 'block';
    
    // Aplicar estilos necesarios para los círculos de probabilidad
    const style = document.createElement('style');
    style.textContent = `
      .probability-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        position: relative;
      }
      
      .probability-circle span {
        font-size: 1.5rem;
        font-weight: bold;
      }
      
      .confidence-bar {
        height: 10px;
        border-radius: 5px;
        background-color: #e9ecef;
        margin-bottom: 10px;
      }
      
      .confidence-value {
        height: 100%;
        border-radius: 5px;
        transition: width 1s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    // Renderizar gráfico si tenemos el contenedor
    if (chartContainer) {
      renderPredictionChart(homeTeam, awayTeam, homeProb, drawProb, awayProb);
    }
    
    // Si es predicción avanzada, mostrar indicador de confianza
    if (isAdvanced && confidenceIndicator) {
      renderConfidenceIndicator(prediction.confidence);
    }
    
    // Mostrar pestañas de mercados si estamos en modelo avanzado
    if (isAdvanced && marketsTabs) {
      renderMarketsTabs(prediction.markets);
    }
  }
  
  /**
   * Renderiza detalles para predicción avanzada
   * @param {object} prediction - Datos de predicción
   * @returns {string} - HTML con detalles
   */
  function renderAdvancedDetails(prediction) {
    // Nivel de confianza
    const confidenceLevel = prediction.nivelesConfianza?.general || 'Media';
    const confidenceExplanation = prediction.nivelesConfianza?.explicacion || '';
    
    // Mercados adicionales
    const bttsYes = prediction.markets?.btts?.yes || 0;
    const over25 = prediction.markets?.overUnder?.over2_5 || 0;
    
    return `
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">Nivel de Confianza: ${confidenceLevel}</h6>
            </div>
            <div class="card-body">
              <div class="confidence-bar">
                <div class="confidence-value bg-${getConfidenceColor(prediction.confidence)}" 
                     style="width: ${prediction.confidence * 10}%"></div>
              </div>
              <small class="text-muted">${confidenceExplanation}</small>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">Mercados Principales</h6>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>Ambos equipos marcan:</span>
                <span class="badge bg-${getBadgeColor(bttsYes)}">
                  Sí: ${Math.round(bttsYes * 100)}% | No: ${Math.round((1 - bttsYes) * 100)}%
                </span>
              </div>
              <div class="d-flex justify-content-between">
                <span>Over/Under 2.5:</span>
                <span class="badge bg-${getBadgeColor(over25)}">
                  Over: ${Math.round(over25 * 100)}% | Under: ${Math.round((1 - over25) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Renderiza detalles para predicción simple
   * @param {object} prediction - Datos de predicción
   * @returns {string} - HTML con detalles
   */
  function renderSimpleDetails(prediction) {
    // Mercados adicionales del modelo simple
    const btts = prediction.mercados_adicionales?.ambos_equipos_marcan || 0;
    const over25 = prediction.mercados_adicionales?.mas_2_5_goles || 0;
    
    return `
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">Nivel de Confianza: ${prediction.confianza || 'Media'}</h6>
            </div>
            <div class="card-body">
              <p class="text-muted mb-0">
                <small>Predicción generada con modelo simple (no ML).</small>
              </p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">Mercados Adicionales</h6>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>Ambos equipos marcan:</span>
                <span class="badge bg-${getBadgeColor(btts)}">
                  Sí: ${Math.round(btts * 100)}% | No: ${Math.round((1 - btts) * 100)}%
                </span>
              </div>
              <div class="d-flex justify-content-between">
                <span>Over/Under 2.5:</span>
                <span class="badge bg-${getBadgeColor(over25)}">
                  Over: ${Math.round(over25 * 100)}% | Under: ${Math.round((1 - over25) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Renderiza el indicador de confianza
   * @param {number} confidence - Valor de confianza (0-10)
   */
  function renderConfidenceIndicator(confidence) {
    if (!confidenceIndicator) return;
    
    const confidencePercentage = confidence * 10; // Convertir a porcentaje (0-100)
    const color = getConfidenceColor(confidence);
    
    confidenceIndicator.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">Confianza de la Predicción</h5>
        </div>
        <div class="card-body">
          <div class="progress" style="height: 25px;">
            <div class="progress-bar bg-${color}" 
                 role="progressbar" 
                 style="width: ${confidencePercentage}%;" 
                 aria-valuenow="${confidencePercentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
              ${confidence.toFixed(1)}/10
            </div>
          </div>
          <p class="text-muted mt-2">
            <small>
              ${getConfidenceDescription(confidence)}
            </small>
          </p>
        </div>
      </div>
    `;
  }
  
  /**
   * Renderiza pestañas para diferentes mercados
   * @param {object} markets - Datos de mercados
   */
  function renderMarketsTabs(markets) {
    if (!marketsTabs || !markets) return;
    
    // Preparar datos de mercados
    const btts = markets.btts || {};
    const overUnder = markets.overUnder || {};
    const handicap = markets.handicap || {};
    
    marketsTabs.innerHTML = `
      <div class="card">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs" id="markets-nav" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="btts-tab" data-bs-toggle="tab" data-bs-target="#btts" type="button">
                BTTS
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="over-under-tab" data-bs-toggle="tab" data-bs-target="#over-under" type="button">
                Over/Under
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="handicap-tab" data-bs-toggle="tab" data-bs-target="#handicap" type="button">
                Hándicap
              </button>
            </li>
          </ul>
        </div>
        <div class="card-body">
          <div class="tab-content" id="markets-content">
            <div class="tab-pane fade show active" id="btts" role="tabpanel" aria-labelledby="btts-tab">
              <div class="row">
                <div class="col-md-6">
                  <div class="d-flex justify-content-between mb-2">
                    <span>Sí:</span>
                    <span class="badge bg-${getBadgeColor(btts.yes || 0)}">
                      ${Math.round((btts.yes || 0) * 100)}%</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>No:</span>
                    <span class="badge bg-${getBadgeColor((1 - (btts.yes || 0)))}">
                      ${Math.round((1 - (btts.yes || 0)) * 100)}%</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="progress mb-2" style="height: 30px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${(btts.yes || 0) * 100}%" 
                         aria-valuenow="${(btts.yes || 0) * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      Sí
                    </div>
                    <div class="progress-bar bg-danger" role="progressbar" 
                         style="width: ${(1 - (btts.yes || 0)) * 100}%" 
                         aria-valuenow="${(1 - (btts.yes || 0)) * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      No
                    </div>
                  </div>
                  <small class="text-muted">Ambos equipos marcarán al menos un gol</small>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="over-under" role="tabpanel" aria-labelledby="over-under-tab">
              <div class="row">
                <div class="col-md-6">
                  <h6>Over/Under 2.5 Goles</h6>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Over:</span>
                    <span class="badge bg-${getBadgeColor(overUnder.over2_5 || 0)}">
                      ${Math.round((overUnder.over2_5 || 0) * 100)}%</span>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Under:</span>
                    <span class="badge bg-${getBadgeColor(1 - (overUnder.over2_5 || 0))}">
                      ${Math.round((1 - (overUnder.over2_5 || 0)) * 100)}%</span>
                  </div>
                  <div class="progress mb-3" style="height: 25px;">
                    <div class="progress-bar bg-primary" role="progressbar" 
                         style="width: ${(overUnder.over2_5 || 0) * 100}%" 
                         aria-valuenow="${(overUnder.over2_5 || 0) * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      Over
                    </div>
                    <div class="progress-bar bg-secondary" role="progressbar" 
                         style="width: ${(1 - (overUnder.over2_5 || 0)) * 100}%" 
                         aria-valuenow="${(1 - (overUnder.over2_5 || 0)) * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      Under
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Más mercados de goles</h6>
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Línea</th>
                        <th>Over</th>
                        <th>Under</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1.5</td>
                        <td>${Math.round((overUnder.over1_5 || 0.75) * 100)}%</td>
                        <td>${Math.round((1 - (overUnder.over1_5 || 0.75)) * 100)}%</td>
                      </tr>
                      <tr>
                        <td>3.5</td>
                        <td>${Math.round((overUnder.over3_5 || 0.35) * 100)}%</td>
                        <td>${Math.round((1 - (overUnder.over3_5 || 0.35)) * 100)}%</td>
                      </tr>
                      <tr>
                        <td>4.5</td>
                        <td>${Math.round((overUnder.over4_5 || 0.2) * 100)}%</td>
                        <td>${Math.round((1 - (overUnder.over4_5 || 0.2)) * 100)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="handicap" role="tabpanel" aria-labelledby="handicap-tab">
              <div class="row">
                <div class="col-md-6">
                  <h6>Hándicap Asiático</h6>
                  <p class="mb-2">
                    <strong>Línea:</strong> ${handicap.line || 0}
                  </p>
                  <div class="d-flex justify-content-between mb-2">
                    <span>Probabilidad:</span>
                    <span class="badge bg-${getBadgeColor(handicap.probability || 0)}">
                      ${Math.round((handicap.probability || 0) * 100)}%</span>
                  </div>
                  <div class="progress mb-3" style="height: 25px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${(handicap.probability || 0) * 100}%" 
                         aria-valuenow="${(handicap.probability || 0) * 100}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                      ${Math.round((handicap.probability || 0) * 100)}%
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="alert alert-info">
                    <p class="mb-0">
                      <small>
                        <strong>Hándicap Asiático:</strong> Una línea de ${handicap.line || 0} significa 
                        ${handicap.line > 0 ? 'ventaja' : 'desventaja'} para el equipo local de 
                        ${Math.abs(handicap.line || 0)} goles.
                      </small>
                    </p>
                  </div>
                  <p class="text-muted">
                    <small>
                      El hándicap asiático permite compensar la diferencia de nivel entre equipos, 
                      ajustando el resultado final según la línea establecida.
                    </small>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Renderiza gráfico de predicción con Chart.js
   * @param {string} homeTeam - Nombre equipo local
   * @param {string} awayTeam - Nombre equipo visitante
   * @param {number} homeProb - Probabilidad victoria local
   * @param {number} drawProb - Probabilidad empate
   * @param {number} awayProb - Probabilidad victoria visitante
   */
  function renderPredictionChart(homeTeam, awayTeam, homeProb, drawProb, awayProb) {
    if (!chartContainer || !window.Chart) return;
    
    // Limpiar cualquier gráfico existente
    chartContainer.innerHTML = '<canvas id="prediction-canvas"></canvas>';
    const canvas = document.getElementById('prediction-canvas');
    
    // Crear nuevo gráfico
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Victoria Local', 'Empate', 'Victoria Visitante'],
        datasets: [{
          label: 'Probabilidad (%)',
          data: [
            Math.round(homeProb * 100), 
            Math.round(drawProb * 100), 
            Math.round(awayProb * 100)
          ],
          backgroundColor: [
            config.chartColors.home,
            config.chartColors.draw,
            config.chartColors.away
          ],
          borderColor: [
            config.chartColors.home.replace('0.8', '1'),
            config.chartColors.draw.replace('0.8', '1'),
            config.chartColors.away.replace('0.8', '1')
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                const index = tooltipItems[0].dataIndex;
                if (index === 0) return `Victoria: ${homeTeam}`;
                if (index === 1) return 'Empate';
                return `Victoria: ${awayTeam}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Probabilidad (%)'
            }
          }
        }
      }
    });
  }
  
  /**
   * Determina el color de la insignia según probabilidad
   * @param {number} probability - Probabilidad (0-1)
   * @returns {string} - Clase de color Bootstrap
   */
  function getBadgeColor(probability) {
    if (probability >= 0.7) return 'success';
    if (probability >= 0.5) return 'primary';
    if (probability >= 0.3) return 'warning';
    return 'danger';
  }
  
  /**
   * Determina el color según nivel de confianza
   * @param {number} confidence - Nivel de confianza (0-10)
   * @returns {string} - Clase de color Bootstrap
   */
  function getConfidenceColor(confidence) {
    if (confidence >= 8) return 'success';
    if (confidence >= 6) return 'primary';
    if (confidence >= 4) return 'info';
    if (confidence >= 2) return 'warning';
    return 'danger';
  }
  
  /**
   * Obtiene una descripción para el nivel de confianza
   * @param {number} confidence - Nivel de confianza (0-10)
   * @returns {string} - Descripción
   */
  function getConfidenceDescription(confidence) {
    if (confidence >= 8) {
      return 'Alta confianza basada en patrones estadísticos consistentes y datos de calidad.';
    } else if (confidence >= 6) {
      return 'Buena confianza respaldada por tendencias claras y datos históricos.';
    } else if (confidence >= 4) {
      return 'Confianza moderada basada en datos suficientes pero con algunas variables inciertas.';
    } else if (confidence >= 2) {
      return 'Baja confianza debido a datos limitados o inconsistentes.';
    } else {
      return 'Muy baja confianza por insuficiencia de datos o alta volatilidad.';
    }
  }
  
  // Exponer métodos públicos
  return {
    init,
    checkPythonService,
    getConfig: () => config
  };
})();

// Inicializar módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  AdvancedPrediction.init();
});