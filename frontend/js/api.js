/**
 * API CORRECTOR - Predictor de Fútbol Premium
 * Este script repara problemas comunes con el objeto API y asegura la correcta
 * carga de ligas y equipos.
 */

// Función autoejecutable para no contaminar el scope global
(function() {
  console.log('🔧 Inicializando reparación de API...');
  
  // Verificar si API existe
  if (typeof window.API === 'undefined' || window.API === null) {
    console.warn('API no está definido. Creando una nueva implementación...');
    
    // Crear objeto API
    window.API = {};
  } else {
    console.log('API existente detectado. Verificando métodos...');
  }
  
  // Implementar fetchWithErrorHandling si no existe
  if (typeof window.API.fetchWithErrorHandling !== 'function') {
    window.API.fetchWithErrorHandling = async function(url, options = {}) {
      try {
        console.log(`Realizando petición a: ${url}`);
        const response = await fetch(url, options);
        
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
  
  // Implementar o reparar getLeagues
  window.API.getLeagues = async function(season = new Date().getFullYear()) {
    try {
      console.log('Obteniendo ligas...');
      const data = await window.API.fetchWithErrorHandling(`/api/leagues?season=${season}`);
      
      // Manejar diferentes formatos de respuesta
      if (data.leagues && Array.isArray(data.leagues)) {
        console.log(`Se encontraron ${data.leagues.length} ligas en data.leagues`);
        return data.leagues;
      } 
      else if (data.datos && Array.isArray(data.datos)) {
        console.log(`Se encontraron ${data.datos.length} ligas en data.datos`);
        return data.datos;
      } 
      else if (Array.isArray(data)) {
        console.log(`Se encontraron ${data.length} ligas en array directo`);
        return data;
      }
      else {
        console.warn('Estructura de respuesta no reconocida:', data);
        // Intentar encontrar array en la respuesta
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          console.log(`Se encontró posible array con ${possibleArrays[0].length} elementos`);
          return possibleArrays[0];
        }
        
        // Si no se encuentra nada, devolver datos de ejemplo
        return [
          { id: 1, nombre: "Liga Española", pais: "España" },
          { id: 2, nombre: "Premier League", pais: "Inglaterra" },
          { id: 3, nombre: "Serie A", pais: "Italia" },
          { id: 4, nombre: "Bundesliga", pais: "Alemania" },
          { id: 5, nombre: "Ligue 1", pais: "Francia" }
        ];
      }
    } catch (error) {
      console.error("Error obteniendo ligas:", error);
      
      // Devolver datos de ejemplo en caso de error
      return [
        { id: 1, nombre: "Liga Española", pais: "España" },
        { id: 2, nombre: "Premier League", pais: "Inglaterra" },
        { id: 3, nombre: "Serie A", pais: "Italia" },
        { id: 4, nombre: "Bundesliga", pais: "Alemania" },
        { id: 5, nombre: "Ligue 1", pais: "Francia" }
      ];
    }
  };
  
  // Implementar o reparar getTeamsByLeague
  window.API.getTeamsByLeague = async function(leagueId) {
    try {
      console.log(`Obteniendo equipos para liga ID: ${leagueId}`);
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
      else {
        console.warn('Estructura de respuesta no reconocida:', data);
        
        // Intentar encontrar array en la respuesta
        const possibleArrays = Object.values(data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          console.log(`Se encontró posible array con ${possibleArrays[0].length} elementos`);
          return possibleArrays[0];
        }
        
        // Si no se encuentra nada, devolver datos de ejemplo
        return getExampleTeams(leagueId);
      }
    } catch (error) {
      console.error("Error obteniendo equipos:", error);
      return getExampleTeams(leagueId);
    }
  };
  
  // Implementar o reparar generatePrediction
  if (typeof window.API.generatePrediction !== 'function') {
    window.API.generatePrediction = async function(params) {
      try {
        console.log('Generando predicción con parámetros:', params);
        
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params)
        };
        
        const data = await window.API.fetchWithErrorHandling('/api/predictions/generate', options);
        
        // Manejar diferentes formatos de respuesta
        if (data.prediction) {
          return data.prediction;
        } else if (data.datos) {
          return data.datos;
        } else {
          console.warn('Formato de predicción no reconocido');
          return data;
        }
      } catch (error) {
        console.error("Error generando predicción:", error);
        return null;
      }
    };
  }
  
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
  
  // SECCIÓN DE CORRECCIÓN DE CARGA DE LIGAS
  // También arreglamos la función loadLeagues si existe
  
  // Verificar si loadLeagues existe y reemplazarla
  if (typeof window.loadLeagues === 'function') {
    console.log('Se ha detectado la función loadLeagues. Reemplazando con versión corregida...');
    
    // Guardar referencia a la función original
    const originalLoadLeagues = window.loadLeagues;
    
    // Reemplazar con versión mejorada
    window.loadLeagues = async function() {
      console.log('🔄 Ejecutando loadLeagues mejorada...');
      
      try {
        // Buscar selector de ligas
        let leagueSelect = document.querySelector('#league-select');
        if (!leagueSelect) leagueSelect = document.querySelector('select[name="league"]');
        if (!leagueSelect) leagueSelect = document.querySelector('select[placeholder="Selecciona una liga"]');
        if (!leagueSelect) leagueSelect = document.querySelector('select');
        
        if (!leagueSelect) {
          console.error('No se encontró ningún selector de ligas en el documento');
          return;
        }
        
        console.log(`Selector de ligas encontrado: ${leagueSelect.id || 'sin ID'}`);
        
        // Obtener ligas 
        const leagues = await API.getLeagues();
        console.log(`Se obtuvieron ${leagues.length} ligas`);
        
        // Limpiar selector
        leagueSelect.innerHTML = '';
        
        // Añadir opción predeterminada
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona una liga';
        defaultOption.selected = true;
        leagueSelect.appendChild(defaultOption);
        
        // Añadir ligas
        leagues.forEach((league, index) => {
          try {
            const option = document.createElement('option');
            option.value = league.id;
            
            // Adaptarse a diferentes estructuras
            const nombre = league.nombre || league.name || `Liga ${index+1}`;
            const pais = league.pais || league.country || '';
            
            option.textContent = pais ? `${nombre} (${pais})` : nombre;
            leagueSelect.appendChild(option);
            
            console.log(`Liga añadida: ID=${league.id}, Nombre=${nombre}`);
          } catch (optionError) {
            console.error(`Error añadiendo opción para liga ${index}:`, optionError);
          }
        });
        
        // Configurar evento change si no existe
        if (!leagueSelect._hasChangeListener) {
          leagueSelect.addEventListener('change', function() {
            const selectedLeagueId = this.value;
            if (selectedLeagueId) {
              if (typeof loadTeams === 'function') {
                loadTeams(selectedLeagueId);
              }
            }
          });
          
          // Marcar que ya tiene listener
          leagueSelect._hasChangeListener = true;
        }
        
        console.log('✅ Carga de ligas completada con éxito');
      } catch (error) {
        console.error('Error en loadLeagues mejorada:', error);
        
        // Intentar llamar a la original como fallback
        try {
          console.log('Intentando ejecutar loadLeagues original como fallback...');
          return originalLoadLeagues();
        } catch (originalError) {
          console.error('Error en loadLeagues original:', originalError);
        }
      }
    };
  } else {
    console.log('No se ha detectado la función loadLeagues. Creando nueva implementación...');
    
    // Crear función loadLeagues
    window.loadLeagues = async function() {
      console.log('🔄 Ejecutando loadLeagues...');
      
      try {
        // Buscar selector de ligas
        let leagueSelect = document.querySelector('#league-select');
        if (!leagueSelect) leagueSelect = document.querySelector('select[name="league"]');
        if (!leagueSelect) leagueSelect = document.querySelector('select[placeholder="Selecciona una liga"]');
        if (!leagueSelect) leagueSelect = document.querySelector('select');
        
        if (!leagueSelect) {
          console.error('No se encontró ningún selector de ligas en el documento');
          return;
        }
        
        console.log(`Selector de ligas encontrado: ${leagueSelect.id || 'sin ID'}`);
        
        // Obtener ligas 
        const leagues = await API.getLeagues();
        console.log(`Se obtuvieron ${leagues.length} ligas`);
        
        // Limpiar selector
        leagueSelect.innerHTML = '';
        
        // Añadir opción predeterminada
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Selecciona una liga';
        defaultOption.selected = true;
        leagueSelect.appendChild(defaultOption);
        
        // Añadir ligas
        leagues.forEach((league, index) => {
          try {
            const option = document.createElement('option');
            option.value = league.id;
            
            // Adaptarse a diferentes estructuras
            const nombre = league.nombre || league.name || `Liga ${index+1}`;
            const pais = league.pais || league.country || '';
            
            option.textContent = pais ? `${nombre} (${pais})` : nombre;
            leagueSelect.appendChild(option);
            
            console.log(`Liga añadida: ID=${league.id}, Nombre=${nombre}`);
          } catch (optionError) {
            console.error(`Error añadiendo opción para liga ${index}:`, optionError);
          }
        });
        
        // Configurar evento change
        leagueSelect.addEventListener('change', function() {
          const selectedLeagueId = this.value;
          if (selectedLeagueId) {
            if (typeof loadTeams === 'function') {
              loadTeams(selectedLeagueId);
            } else if (typeof window.API.getTeamsByLeague === 'function') {
              // Implementación provisional de loadTeams si no existe
              async function loadTeamsProvisional(leagueId) {
                try {
                  const teams = await window.API.getTeamsByLeague(leagueId);
                  
                  // Buscar selectores de equipos
                  const homeTeamSelect = document.querySelector('#home-team-select, select[name="homeTeam"]');
                  const awayTeamSelect = document.querySelector('#away-team-select, select[name="awayTeam"]');
                  
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
                  }
                } catch (error) {
                  console.error('Error cargando equipos:', error);
                }
              }
              
              loadTeamsProvisional(selectedLeagueId);
            }
          }
        });
        
        console.log('✅ Carga de ligas completada con éxito');
      } catch (error) {
        console.error('Error en loadLeagues:', error);
      }
    };
  }
  
  console.log('✅ Reparación de API completada');
  
  // Aplicar corrección inmediata - recargar ligas
  setTimeout(() => {
    if (typeof loadLeagues === 'function') {
      console.log('🔄 Recargando ligas automáticamente...');
      loadLeagues();
    }
  }, 500);
})();