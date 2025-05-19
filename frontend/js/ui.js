// frontend/js/ui.js

/**
 * Módulo para la gestión de la interfaz de usuario
 */
const UI = (function() {
  // Elementos DOM que usaremos con frecuencia
  const elements = {
    // Selectores y formularios
    leagueSelect: document.getElementById('league-select'),
    dateInput: document.getElementById('date-input'),
    homeTeamSelect: document.getElementById('home-team-select'),
    awayTeamSelect: document.getElementById('away-team-select'),
    analyzeBtn: document.getElementById('analyze-btn'),
    resetBtn: document.getElementById('reset-btn'),
    dataSourceToggle: document.getElementById('data-source-toggle'),
    
    // Contenedores de resultados
    matchInfoContainer: document.getElementById('match-info'),
    predictionContainer: document.getElementById('prediction-container'),
    loadingIndicator: document.getElementById('loading-indicator'),
    errorContainer: document.getElementById('error-container'),
    
    // Tabs de análisis
    resultTab: document.getElementById('result-tab'),
    bttsTab: document.getElementById('btts-tab'),
    overUnderTab: document.getElementById('over-under-tab'),
    cornersTab: document.getElementById('corners-tab'),
    cardsTab: document.getElementById('cards-tab'),
    handicapTab: document.getElementById('handicap-tab'),
    
    // Contenedores de gráficos
    resultChart: document.getElementById('result-chart'),
    bttsChart: document.getElementById('btts-chart'),
    overUnderChart: document.getElementById('over-under-chart'),
    cornersChart: document.getElementById('corners-chart'),
    cardsChart: document.getElementById('cards-chart'),
    handicapChart: document.getElementById('handicap-chart'),
    
    // Sección de apuesta recomendada
    bestBetContainer: document.getElementById('best-bet-container')
  };
  
  /**
   * Inicializa la interfaz de usuario
   */
  function initialize() {
    // Establecer fecha actual en el input
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    elements.dateInput.value = formattedDate;
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar ligas al inicio
    loadLeagues();
    
    console.log('UI inicializada correctamente');
  }
  
  /**
   * Configura los event listeners para la interacción
   */
  function setupEventListeners() {
    // Cambio de liga
    elements.leagueSelect.addEventListener('change', () => {
      const leagueId = elements.leagueSelect.value;
      if (leagueId) {
        loadTeamsByLeague(leagueId);
      } else {
        clearTeamSelects();
      }
    });
    
    // Botón de análisis
    elements.analyzeBtn.addEventListener('click', handleAnalyzeClick);
    
    // Botón de reset
    elements.resetBtn.addEventListener('click', resetForm);
    
    // Cambio de fuente de datos
    elements.dataSourceToggle.addEventListener('change', handleDataSourceChange);
    
    // Tabs de análisis
    document.querySelectorAll('.nav-link[data-bs-toggle="tab"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', handleTabChange);
    });
  }
  
  /**
   * Maneja el evento de clic en el botón de análisis
   */
  async function handleAnalyzeClick() {
    // Validar formulario
    if (!validateForm()) {
      return;
    }
    
    try {
      // Mostrar indicador de carga
      showLoading(elements.predictionContainer);
      
      // Recoger datos del formulario
      const leagueId = elements.leagueSelect.value;
      const date = elements.dateInput.value;
      const homeTeamId = elements.homeTeamSelect.value;
      const awayTeamId = elements.awayTeamSelect.value;
      
      // Generar predicción
      const predictionParams = {
        homeTeamId,
        awayTeamId,
        leagueId,
        date
      };
      
      const predictionData = await API.generatePrediction(predictionParams);
      
      // Mostrar resultados
      displayPrediction(predictionData);
      
      // Ocultar indicador de carga
      hideLoading(elements.predictionContainer);
      
      // Mostrar el contenedor de predicción
      elements.predictionContainer.classList.remove('d-none');
      
      // Hacer scroll a los resultados
      elements.predictionContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      // Ocultar indicador de carga
      hideLoading(elements.predictionContainer);
      
      // Mostrar error
      showError('Error generando predicción: ' + error.message);
    }
  }
  
  /**
   * Muestra la mejor apuesta recomendada
   * @param {object} bestBet - Mejor apuesta recomendada
   */
  function displayBestBet(bestBet) {
    const container = elements.bestBetContainer;
    
    if (!bestBet) {
      container.innerHTML = '<div class="alert alert-warning">No se pudo determinar una apuesta recomendada</div>';
      return;
    }
    
    // Determinar color según confianza
    const confidenceColor = getConfidenceColor(bestBet.confidence);
    
    // Mapeo de mercados a nombres legibles
    const marketNames = {
      'result': 'Resultado 1X2',
      'btts': 'Ambos equipos marcan',
      'overUnder': 'Goles Over/Under',
      'corners': 'Córners',
      'cards': 'Tarjetas',
      'handicap': 'Hándicap asiático'
    };
    
    // Mapeo de selecciones a nombres legibles según mercado
    let pickName = bestBet.pick;
    
    if (bestBet.market === 'result') {
      const resultNames = {
        '1': 'Victoria local',
        'X': 'Empate',
        '2': 'Victoria visitante'
      };
      pickName = resultNames[bestBet.pick] || bestBet.pick;
    } else if (bestBet.market === 'btts') {
      pickName = bestBet.pick === 'Yes' ? 'Sí' : 'No';
    } else if (bestBet.market === 'overUnder' || bestBet.market === 'corners' || bestBet.market === 'cards') {
      // Extraer el tipo (O/U) y la línea
      const type = bestBet.pick.charAt(0);
      const line = bestBet.pick.substring(1);
      
      const marketTypeMap = {
        'overUnder': 'goles',
        'corners': 'córners',
        'cards': 'tarjetas'
      };
      
      pickName = type === 'O' ? 
        `Más de ${line} ${marketTypeMap[bestBet.market]}` : 
        `Menos de ${line} ${marketTypeMap[bestBet.market]}`;
    }
    
    // Construir contenido
    container.innerHTML = `
      <div class="best-bet-card card border-${confidenceColor}">
        <div class="card-header bg-${confidenceColor} text-white">
          <h5 class="mb-0">Apuesta Recomendada</h5>
        </div>
        <div class="card-body">
          <h6 class="card-subtitle mb-2 text-muted">${marketNames[bestBet.market]}</h6>
          <h4 class="card-title">${pickName}</h4>
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <p class="mb-0">Cuota estimada: <strong>${bestBet.odds.toFixed(2)}</strong></p>
              <p class="mb-0">Confianza: <strong>${bestBet.confidence.toFixed(1)}/10</strong> (${bestBet.rating})</p>
            </div>
            <div class="text-center">
              <div class="confidence-meter">
                <div class="meter-fill bg-${confidenceColor}" style="width: ${bestBet.confidence * 10}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Obtiene un color según el nivel de confianza
   * @param {number} confidence - Nivel de confianza (0-10)
   * @returns {string} - Nombre de color Bootstrap
   */
  function getConfidenceColor(confidence) {
    if (confidence >= 7.5) return 'success';
    if (confidence >= 6.0) return 'primary';
    if (confidence >= 5.0) return 'info';
    if (confidence >= 3.5) return 'warning';
    return 'danger';
  }
  
  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   */
  function showError(message) {
    elements.errorContainer.innerHTML = `
      <div class="alert alert-danger alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    
    elements.errorContainer.classList.remove('d-none');
    
    // Hacer scroll al error
    elements.errorContainer.scrollIntoView({ behavior: 'smooth' });
  }
  
  /**
   * Limpia mensajes de error
   */
  function clearError() {
    elements.errorContainer.innerHTML = '';
    elements.errorContainer.classList.add('d-none');
  }
  
  /**
   * Muestra una notificación temporal
   * @param {string} message - Mensaje de notificación
   */
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-info notification-toast';
    notification.innerHTML = message;
    
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      // Eliminar del DOM después de la animación
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);
  }
  
  /**
   * Muestra indicador de carga
   * @param {HTMLElement} element - Elemento a mostrar como cargando
   */
  function showLoading(element) {
    if (!element) return;
    
    // Añadir clase de carga
    element.classList.add('loading');
    
    // Crear spinner si es necesario
    if (!element.querySelector('.spinner-border')) {
      const spinner = document.createElement('div');
      spinner.className = 'spinner-overlay';
      spinner.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>';
      element.appendChild(spinner);
    }
  }
  
  /**
   * Oculta indicador de carga
   * @param {HTMLElement} element - Elemento a dejar de mostrar como cargando
   */
  function hideLoading(element) {
    if (!element) return;
    
    // Quitar clase de carga
    element.classList.remove('loading');
    
    // Eliminar spinner
    const spinner = element.querySelector('.spinner-overlay');
    if (spinner) {
      element.removeChild(spinner);
    }
  }
  
  // Funciones para inicializar y actualizar gráficos
  
  /**
   * Inicializa gráfico de resultado 1X2
   * @param {HTMLElement} container - Contenedor del gráfico
   */
  function initResultChart(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Guardar referencia al gráfico
    elements.resultChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Victoria local', 'Empate', 'Victoria visitante'],
        datasets: [{
          label: 'Probabilidad',
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Probabilidad (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Probabilidad de resultado'
          }
        }
      }
    });
  }
  
  /**
   * Actualiza gráfico de resultado 1X2
   * @param {object} predictions - Predicciones de resultado
   */
  function updateResultChart(predictions) {
    if (!elements.resultChartInstance) {
      const container = document.getElementById('result-chart');
      if (container) {
        initResultChart(container);
      }
    }
    
    if (elements.resultChartInstance) {
      elements.resultChartInstance.data.datasets[0].data = [
        Math.round(predictions['1'].probability * 100),
        Math.round(predictions['X'].probability * 100),
        Math.round(predictions['2'].probability * 100)
      ];
      
      elements.resultChartInstance.update();
    }
  }
  
  /**
   * Inicializa gráfico de BTTS
   * @param {HTMLElement} container - Contenedor del gráfico
   */
  function initBttsChart(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Guardar referencia al gráfico
    elements.bttsChartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Ambos marcan', 'No ambos marcan'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 159, 64, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Probabilidad BTTS'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Actualiza gráfico de BTTS
   * @param {object} predictions - Predicciones de BTTS
   */
  function updateBttsChart(predictions) {
    if (!elements.bttsChartInstance) {
      const container = document.getElementById('btts-chart');
      if (container) {
        initBttsChart(container);
      }
    }
    
    if (elements.bttsChartInstance) {
      elements.bttsChartInstance.data.datasets[0].data = [
        Math.round(predictions['Yes'].probability * 100),
        Math.round(predictions['No'].probability * 100)
      ];
      
      elements.bttsChartInstance.update();
    }
  }
  
  /**
   * Inicializa gráfico de Over/Under
   * @param {HTMLElement} container - Contenedor del gráfico
   */
  function initOverUnderChart(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Guardar referencia al gráfico
    elements.overUnderChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Más de 1.5', 'Menos de 1.5', 'Más de 2.5', 'Menos de 2.5', 'Más de 3.5', 'Menos de 3.5'],
        datasets: [{
          label: 'Probabilidad',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Probabilidad (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Probabilidad Over/Under Goles'
          }
        }
      }
    });
  }
  
  /**
   * Actualiza gráfico de Over/Under
   * @param {object} predictions - Predicciones de Over/Under
   */
  function updateOverUnderChart(predictions) {
    if (!elements.overUnderChartInstance) {
      const container = document.getElementById('over-under-chart');
      if (container) {
        initOverUnderChart(container);
      }
    }
    
    if (elements.overUnderChartInstance) {
      elements.overUnderChartInstance.data.datasets[0].data = [
        Math.round(predictions['O1.5'].probability * 100),
        Math.round(predictions['U1.5'].probability * 100),
        Math.round(predictions['O2.5'].probability * 100),
        Math.round(predictions['U2.5'].probability * 100),
        Math.round(predictions['O3.5'].probability * 100),
        Math.round(predictions['U3.5'].probability * 100)
      ];
      
      elements.overUnderChartInstance.update();
    }
  }
  
  /**
   * Inicializa gráfico de córners
   * @param {HTMLElement} container - Contenedor del gráfico
   */
  function initCornersChart(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Guardar referencia al gráfico
    elements.cornersChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Más de 8.5', 'Menos de 8.5', 'Más de 9.5', 'Menos de 9.5', 'Más de 10.5', 'Menos de 10.5'],
        datasets: [{
          label: 'Probabilidad',
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Probabilidad (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Probabilidad Córners'
          }
        }
      }
    });
  }
  
  /**
   * Actualiza gráfico de córners
   * @param {object} predictions - Predicciones de córners
   */
  function updateCornersChart(predictions) {
    if (!elements.cornersChartInstance) {
      const container = document.getElementById('corners-chart');
      if (container) {
        initCornersChart(container);
      }
    }
    
    if (elements.cornersChartInstance) {
      elements.cornersChartInstance.data.datasets[0].data = [
        Math.round(predictions['O8.5'].probability * 100),
        Math.round(predictions['U8.5'].probability * 100),
        Math.round(predictions['O9.5'].probability * 100),
        Math.round(predictions['U9.5'].probability * 100),
        Math.round(predictions['O10.5'].probability * 100),
        Math.round(predictions['U10.5'].probability * 100)
      ];
      
      elements.cornersChartInstance.update();
    }
  }
  
  /**
   * Inicializa gráfico de tarjetas
   * @param {HTMLElement} container - Contenedor del gráfico
   */
  function initCardsChart(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Guardar referencia al gráfico
    elements.cardsChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Más de 3.5', 'Menos de 3.5', 'Más de 4.5', 'Menos de 4.5'],
        datasets: [{
          label: 'Probabilidad',
          data: [0, 0, 0, 0],
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Probabilidad (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Probabilidad Tarjetas'
          }
        }
      }
    });
  }
  
  /**
   * Actualiza gráfico de tarjetas
   * @param {object} predictions - Predicciones de tarjetas
   */
  function updateCardsChart(predictions) {
    if (!elements.cardsChartInstance) {
      const container = document.getElementById('cards-chart');
      if (container) {
        initCardsChart(container);
      }
    }
    
    if (elements.cardsChartInstance) {
      elements.cardsChartInstance.data.datasets[0].data = [
        Math.round(predictions['O3.5'].probability * 100),
        Math.round(predictions['U3.5'].probability * 100),
        Math.round(predictions['O4.5'].probability * 100),
        Math.round(predictions['U4.5'].probability * 100)
      ];
      
      elements.cardsChartInstance.update();
    }
  }
  
  /**
   * Inicializa gráfico de hándicap
   * @param {HTMLElement} container - Contenedor del gráfico
   */
  function initHandicapChart(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    
    // Guardar referencia al gráfico - por ahora vacío, 
    // se llenará dinámicamente ya que las líneas pueden variar
    elements.handicapChartInstance = new Chart(canvas, {
      type: 'horizontalBar',
      data: {
        labels: [],
        datasets: [{
          label: 'Probabilidad',
          data: [],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Probabilidad (%)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Probabilidad Hándicap Asiático'
          }
        }
      }
    });
  }
  
  /**
   * Actualiza gráfico de hándicap
   * @param {object} predictions - Predicciones de hándicap
   */
  function updateHandicapChart(predictions) {
    if (!elements.handicapChartInstance) {
      const container = document.getElementById('handicap-chart');
      if (container) {
        initHandicapChart(container);
      }
    }
    
    if (elements.handicapChartInstance) {
      // Extraer etiquetas y datos dinámicamente
      const labels = [];
      const data = [];
      
      // Ordenar claves para mostrar en orden
      const sortedKeys = Object.keys(predictions).sort((a, b) => {
        const valueA = parseFloat(a);
        const valueB = parseFloat(b);
        
        // Manejar casos especiales (0, +, -)
        if (a === '0') return 1;
        if (b === '0') return -1;
        
        if (isNaN(valueA) || isNaN(valueB)) {
          return a.localeCompare(b);
        }
        
        return valueA - valueB;
      });
      
      sortedKeys.forEach(key => {
        const displayKey = key.startsWith('+') || key.startsWith('-') ? 
          key : 
          (key === '0' ? 'Sin hándicap (0)' : key);
          
        labels.push(displayKey);
        data.push(Math.round(predictions[key].probability * 100));
      });
      
      elements.handicapChartInstance.data.labels = labels;
      elements.handicapChartInstance.data.datasets[0].data = data;
      
      elements.handicapChartInstance.update();
    }
  }
  
  // Exponer funciones públicas
  return {
    initialize,
    loadLeagues,
    loadTeamsByLeague,
    displayPrediction
  };
})();

// Inicializar la UI cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', UI.initialize);

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}
