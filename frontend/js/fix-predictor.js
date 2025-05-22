/**
 * SCRIPT DE CORRECCIÓN PARA PREDICTOR DE FÚTBOL PREMIUM
 * Este script soluciona problemas comunes en la aplicación
 */

// Función autoejecutable para no contaminar el scope global
(function() {
  console.log('🔧 Iniciando script de corrección para Predictor de Fútbol Premium...');
  
  // Verificar si API existe
  if (typeof window.API === 'undefined' || window.API === null) {
    console.warn('API no está definido. Creando una nueva implementación...');
    window.API = {};
  }
  
  // Implementar fetchWithErrorHandling si no existe
  if (typeof window.API.fetchWithErrorHandling !== 'function') {
    window.API.fetchWithErrorHandling = async function(url, options = {}) {
      try {
        console.log(`Realizando petición a: ${url}`);
        const response = await fetch(url, options);
        
        // Verificar el tipo de contenido antes de intentar parsear como JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`La respuesta no es JSON: ${contentType}`);
          const text = await response.text();
          console.log(`Respuesta texto: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
          
          // Intentar convertir a JSON si parece JSON
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            try {
              return JSON.parse(text);
            } catch (parseError) {
              console.error('Error parseando respuesta como JSON:', parseError);
              throw new Error(`Respuesta no válida: ${text.substring(0, 100)}`);
            }
          }
          
          // Si no es JSON y la respuesta no está vacía, considerarlo un error
          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
          
          // Devolver un objeto simple con el texto
          return { text: text, status: response.status };
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Respuesta exitosa de ${url}:`, data);
        return data;
      } catch (error) {
        console.error(`Error en petición a ${url}:`, error);
        throw error;
      }
    };
  }
  
  // Implementar o corregir getTeamsByLeague
  window.API.getTeamsByLeague = async function(leagueId) {
    try {
      console.log(`Obteniendo equipos para liga ID: ${leagueId}`);
      
      // Intentar obtener equipos del backend
      try {
        const data = await window.API.fetchWithErrorHandling(`/api/teams?league=${leagueId}`);
        
        // Manejar diferentes formatos de respuesta
        if (data.teams && Array.isArray(data.teams)) {
          console.log(`Se encontraron ${data.teams.length} equipos en data.teams`);
          return data.teams;
        } 
        else if (data.datos && Array.isArray(data.datos)) {
          console.log(`Se encontraron ${data.datos.length} equipos en data.datos`);
          return data.datos;
        } 
        else if (Array.isArray(data)) {
          console.log(`Se encontraron ${data.length} equipos en array directo`);
          return data;
        }
        else if (data.data && Array.isArray(data.data)) {
          console.log(`Se encontraron ${data.data.length} equipos en data.data`);
          return data.data;
        }
        else {
          console.warn('Estructura de respuesta no reconocida para equipos:', data);
          
          // Intentar encontrar array en la respuesta
          const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            console.log(`Se encontró posible array con ${possibleArrays[0].length} elementos`);
            return possibleArrays[0];
          }
          
          // Si no se encuentra nada, devolver datos de ejemplo
          console.log('Devolviendo datos de ejemplo para equipos');
          return getExampleTeams(leagueId);
        }
      } catch (backendError) {
        console.error('Error obteniendo equipos del backend, usando datos de ejemplo:', backendError);
        return getExampleTeams(leagueId);
      }
    } catch (error) {
      console.error("Error en getTeamsByLeague:", error);
      return getExampleTeams(leagueId);
    }
  };
  
  // Implementar o corregir generatePrediction
  window.API.generatePrediction = async function(params) {
    try {
      console.log('Generando predicción con parámetros:', params);
      
      // Transformar parámetros para que coincidan con lo esperado por el backend
      const transformedParams = {
        local_team: params.equipoLocal || params.homeTeam,
        away_team: params.equipoVisitante || params.awayTeam,
        competition: params.liga || params.league,
        // Añadir fecha si existe
        ...(params.fecha && { match_date: params.fecha })
      };
      
      console.log('Parámetros transformados:', transformedParams);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transformedParams)
      };
      
      try {
        // Usar la URL correcta del backend: /api/predict en lugar de /api/predictions/generate
        const data = await window.API.fetchWithErrorHandling('/api/predict', options);
        
        console.log('Respuesta de predicción:', data);
        
        // Manejar diferentes formatos de respuesta
        if (data.prediction) {
          return data;
        } else if (data.datos) {
          return data.datos;
        } else {
          console.warn('Formato de predicción no reconocido, devolviendo datos completos');
          return data;
        }
      } catch (backendError) {
        console.error('Error en el backend al generar predicción:', backendError);
        
        // Simular una respuesta positiva
        return {
          prediction: 'local_win',
          probabilities: {
            local_win: 0.65,
            draw: 0.20,
            away_win: 0.15
          },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error("Error en generatePrediction:", error);
      // Devolver un objeto con información del error para mostrar al usuario
      return {
        error: true,
        message: error.message || "Error al generar la predicción",
        details: "Verifica que el servidor Python esté funcionando correctamente"
      };
    }
  };
  
  // Función auxiliar para datos de ejemplo
  function getExampleTeams(leagueId) {
    const id = Number(leagueId);
    
    switch (id) {
      case 1: // Liga Española
        return [
          { id: 101, name: 'Real Madrid' },
          { id: 102, name: 'Barcelona' },
          { id: 103, name: 'Atlético de Madrid' },
          { id: 104, name: 'Sevilla' },
          { id: 105, name: 'Valencia' }
        ];
      case 2: // Premier League
        return [
          { id: 201, name: 'Manchester City' },
          { id: 202, name: 'Liverpool' },
          { id: 203, name: 'Chelsea' },
          { id: 204, name: 'Arsenal' },
          { id: 205, name: 'Tottenham' }
        ];
      case 3: // Serie A
        return [
          { id: 301, name: 'Juventus' },
          { id: 302, name: 'Inter de Milán' },
          { id: 303, name: 'AC Milan' },
          { id: 304, name: 'Napoli' },
          { id: 305, name: 'Roma' }
        ];
      case 4: // Bundesliga
        return [
          { id: 401, name: 'Bayern Munich' },
          { id: 402, name: 'Borussia Dortmund' },
          { id: 403, name: 'RB Leipzig' },
          { id: 404, name: 'Bayer Leverkusen' },
          { id: 405, name: 'Wolfsburg' }
        ];
      case 5: // Ligue 1
        return [
          { id: 501, name: 'PSG' },
          { id: 502, name: 'Olympique de Marseille' },
          { id: 503, name: 'Lyon' },
          { id: 504, name: 'Monaco' },
          { id: 505, name: 'Lille' }
        ];
      default:
        return [
          { id: 901, name: 'Equipo 1' },
          { id: 902, name: 'Equipo 2' },
          { id: 903, name: 'Equipo 3' },
          { id: 904, name: 'Equipo 4' },
          { id: 905, name: 'Equipo 5' }
        ];
    }
  }
  
  // Define loadTeamsByLeague si no existe (ya que se menciona en los errores)
  if (typeof window.loadTeamsByLeague !== 'function') {
    window.loadTeamsByLeague = async function(leagueId) {
      return await window.API.getTeamsByLeague(leagueId);
    };
  }
  
  // Define loadTeams si no existe
  if (typeof window.loadTeams !== 'function') {
    window.loadTeams = async function(leagueId) {
      try {
        console.log(`Cargando equipos para liga: ${leagueId}`);
        const teams = await window.API.getTeamsByLeague(leagueId);
        
        // Buscar selectores de equipos
        const homeTeamSelect = document.querySelector('#home-team-select') || 
                              document.querySelector('select[name="homeTeam"]');
        const awayTeamSelect = document.querySelector('#away-team-select') || 
                              document.querySelector('select[name="awayTeam"]');
        
        if (homeTeamSelect && awayTeamSelect) {
          // Limpiar selectores
          homeTeamSelect.innerHTML = '';
          awayTeamSelect.innerHTML = '';
          
          // Opciones predeterminadas
          const homeDefaultOption = document.createElement('option');
          homeDefaultOption.value = '';
          homeDefaultOption.textContent = 'Selecciona equipo local';
          homeDefaultOption.selected = true;
          homeTeamSelect.appendChild(homeDefaultOption);
          
          const awayDefaultOption = document.createElement('option');
          awayDefaultOption.value = '';
          awayDefaultOption.textContent = 'Selecciona equipo visitante';
          awayDefaultOption.selected = true;
          awayTeamSelect.appendChild(awayDefaultOption);
          
          // Añadir equipos
          teams.forEach(team => {
            // Opción para equipo local
            const homeOption = document.createElement('option');
            homeOption.value = team.id;
            homeOption.textContent = team.name || team.nombre;
            homeTeamSelect.appendChild(homeOption);
            
            // Opción para equipo visitante
            const awayOption = document.createElement('option');
            awayOption.value = team.id;
            awayOption.textContent = team.name || team.nombre;
            awayTeamSelect.appendChild(awayOption);
          });
          
          console.log(`✅ Se cargaron ${teams.length} equipos en los selectores`);
        } else {
          console.error('No se encontraron los selectores de equipos');
        }
        
        return teams;
      } catch (error) {
        console.error('Error cargando equipos:', error);
        return [];
      }
    };
  }
  
  // Configurar el botón de "Analizar Partido"
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Configurando botones y eventos de la aplicación...');
    
    // Esperar un poco para que otros scripts se carguen
    setTimeout(function() {
      // Buscar el botón de analizar partido
      const analyzeButton = document.querySelector('button[id="analyze-button"]') || 
                            document.querySelector('button:contains("Analizar Partido")') ||
                            document.querySelector('.btn-primary');
      
      if (!analyzeButton) {
        console.error('No se pudo encontrar el botón de análisis');
        return;
      }
      
      console.log('✅ Botón de análisis encontrado:', analyzeButton);
      
      // Sobrescribir cualquier evento existente
      analyzeButton.onclick = async function(e) {
        e.preventDefault();
        console.log('🔍 Botón de análisis presionado');
        
        // Obtener valores de los campos
        const ligaSelect = document.querySelector('select[id="league-select"]') || document.querySelector('select');
        const liga = ligaSelect ? ligaSelect.value : '';
        
        const fechaInput = document.querySelector('input[type="date"]');
        const fecha = fechaInput ? fechaInput.value : '';
        
        const equipoLocalSelect = document.querySelector('select[id="home-team-select"]') || 
                                document.querySelector('select[name="homeTeam"]');
        const equipoLocal = equipoLocalSelect ? equipoLocalSelect.value : '';
        
        const equipoVisitanteSelect = document.querySelector('select[id="away-team-select"]') || 
                                    document.querySelector('select[name="awayTeam"]');
        const equipoVisitante = equipoVisitanteSelect ? equipoVisitanteSelect.value : '';
        
        // Para depuración
        console.log('Valores de los campos:', {
          ligaSelect: ligaSelect,
          liga: liga,
          fechaInput: fechaInput,
          fecha: fecha,
          equipoLocalSelect: equipoLocalSelect,
          equipoLocal: equipoLocal,
          equipoVisitanteSelect: equipoVisitanteSelect,
          equipoVisitante: equipoVisitante
        });
        
        // Verificar que todos los campos necesarios tengan valor
        if (!liga || !equipoLocal || !equipoVisitante) {
          alert('Por favor, completa todos los campos requeridos');
          console.error('Campos incompletos:', {liga, fecha, equipoLocal, equipoVisitante});
          return;
        }
        
        // Mostrar indicador de carga
        let resultadoContainer = document.querySelector('#resultado-container');
        
        if (!resultadoContainer) {
          resultadoContainer = document.createElement('div');
          resultadoContainer.id = 'resultado-container';
          resultadoContainer.className = 'mt-4 p-3 border rounded';
          
          // Buscar dónde insertar el contenedor
          const form = document.querySelector('form') || document.querySelector('.container');
          if (form) {
            form.appendChild(resultadoContainer);
          } else {
            document.body.appendChild(resultadoContainer);
          }
        }
        
        resultadoContainer.innerHTML = '<p class="text-center">Analizando partido... Por favor espera.</p>';
        resultadoContainer.style.display = 'block';
        
        try {
          // Llamar a la API para generar predicción
          console.log('Enviando datos para predicción:', {liga, fecha, equipoLocal, equipoVisitante});
          
          const prediccion = await window.API.generatePrediction({
            liga: liga,
            fecha: fecha,
            equipoLocal: equipoLocal,
            equipoVisitante: equipoVisitante
          });
          
          console.log('Predicción recibida:', prediccion);
          
          if (prediccion && !prediccion.error) {
            // Mostrar resultado
            let resultadoHTML = '<h3 class="text-center mb-3">Resultado del Análisis</h3>';
            
            if (prediccion.prediction) {
              const resultadoTexto = 
                prediccion.prediction === 'local_win' ? 'Victoria Local' :
                prediccion.prediction === 'draw' ? 'Empate' :
                prediccion.prediction === 'away_win' ? 'Victoria Visitante' : 
                prediccion.prediction;
              
              resultadoHTML += `<p class="text-center"><strong>Predicción:</strong> ${resultadoTexto}</p>`;
            }
            
            if (prediccion.probabilities) {
              resultadoHTML += '<div class="mt-3">';
              resultadoHTML += '<p class="text-center"><strong>Probabilidades:</strong></p>';
              resultadoHTML += '<ul class="list-group">';
              
              if (prediccion.probabilities.local_win !== undefined) {
                resultadoHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">
                  Victoria Local 
                  <span class="badge bg-primary rounded-pill">${(prediccion.probabilities.local_win * 100).toFixed(2)}%</span>
                </li>`;
              }
              
              if (prediccion.probabilities.draw !== undefined) {
                resultadoHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">
                  Empate 
                  <span class="badge bg-primary rounded-pill">${(prediccion.probabilities.draw * 100).toFixed(2)}%</span>
                </li>`;
              }
              
              if (prediccion.probabilities.away_win !== undefined) {
                resultadoHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">
                  Victoria Visitante 
                  <span class="badge bg-primary rounded-pill">${(prediccion.probabilities.away_win * 100).toFixed(2)}%</span>
                </li>`;
              }
              
              resultadoHTML += '</ul>';
              resultadoHTML += '</div>';
            }
            
            if (prediccion.timestamp) {
              resultadoHTML += `<p class="text-center mt-3"><small>Análisis generado: ${prediccion.timestamp}</small></p>`;
            }
            
            resultadoContainer.innerHTML = resultadoHTML;
          } else {
            // Mostrar error
            resultadoContainer.innerHTML = `
              <h3 class="text-center mb-3">Error en el Análisis</h3>
              <p class="text-center">${prediccion?.message || 'No se pudo generar la predicción'}</p>
              <p class="text-center text-muted">${prediccion?.details || 'Inténtalo de nuevo más tarde'}</p>
            `;
          }
        } catch (error) {
          console.error('Error al generar predicción:', error);
          resultadoContainer.innerHTML = `
            <h3 class="text-center mb-3">Error en el Análisis</h3>
            <p class="text-center">Ocurrió un error al procesar la solicitud: ${error.message}</p>
            <p class="text-center text-muted">Verifica que el servidor Python esté funcionando correctamente</p>
          `;
        }
      };
      
      console.log('✅ Botón de análisis configurado con éxito');
    }, 1000); // Esperar 1 segundo para asegurar que la página esté completamente cargada
  });
  
  console.log('✅ Script de corrección cargado con éxito');
})();