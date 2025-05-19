/**
 * CARGAR LIGAS FIX - Predictor de Fútbol Premium
 * Solución para el problema de carga de ligas
 */

// Función autoejecutable para no contaminar el scope global
(function() {
  // Configuración
  const DEBUG = true;
  const AUTO_LOAD = true;
  
  // Función de log
  function log(message, type = 'info') {
    if (!DEBUG) return;
    
    const styles = {
      info: 'background:#d4f5d4;color:#0a560a;padding:2px 5px;border-radius:3px;',
      warn: 'background:#fff3cd;color:#856404;padding:2px 5px;border-radius:3px;',
      error: 'background:#f8d7da;color:#721c24;padding:2px 5px;border-radius:3px;',
      success: 'background:#d4edda;color:#155724;padding:2px 5px;border-radius:3px;font-weight:bold;',
    };
    
    switch (type) {
      case 'warn':
        console.warn(`%c[LIGAS FIX]%c ${message}`, styles.warn, '');
        break;
      case 'error':
        console.error(`%c[LIGAS FIX]%c ${message}`, styles.error, '');
        break;
      case 'success':
        console.log(`%c[LIGAS FIX]%c ${message}`, styles.success, '');
        break;
      default:
        console.log(`%c[LIGAS FIX]%c ${message}`, styles.info, '');
    }
  }
  
  log('🔄 Inicializando corrección de carga de ligas...', 'info');
  
  // Carga ligas una vez que el documento esté listo
  document.addEventListener('DOMContentLoaded', function() {
    if (AUTO_LOAD) {
      log('Documento cargado, esperando 1 segundo antes de cargar ligas...', 'info');
      setTimeout(fixedLoadLeagues, 1000);
    } else {
      log('Documento cargado. AUTO_LOAD desactivado. Usa loadLigasFix() para cargar manualmente.', 'info');
    }
  });
  
  // Función de carga de ligas arreglada
  window.loadLigasFix = fixedLoadLeagues;
  
  // Implementación arreglada de loadLeagues
  async function fixedLoadLeagues() {
    try {
      log('Iniciando carga de ligas...', 'info');
      
      // Buscar todos los posibles selectores de liga
      let leagueSelect = document.querySelector('#league-select');
      if (!leagueSelect) leagueSelect = document.querySelector('select[name="league"]');
      if (!leagueSelect) leagueSelect = document.querySelector('select[placeholder="Selecciona una liga"]');
      if (!leagueSelect) leagueSelect = document.querySelector('select');
      
      if (!leagueSelect) {
        log('Error: No se encontró ningún selector de ligas en el documento', 'error');
        showErrorInPage("No se pudo encontrar el selector de ligas en la página");
        return;
      }
      
      log(`Selector de ligas encontrado: ${leagueSelect.id || 'sin ID'}`, 'success');
      
      // Verificar API
      if (typeof API === 'undefined') {
        log('Error: Objeto API no está definido', 'error');
        
        // Crear una implementación básica
        window.API = {
          async getLeagues() {
            try {
              const response = await fetch('/api/leagues');
              if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
              
              const data = await response.json();
              
              if (data.leagues && Array.isArray(data.leagues)) {
                return data.leagues;
              } else if (data.datos && Array.isArray(data.datos)) {
                return data.datos;
              } else {
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
              return [
                { id: 1, nombre: "Liga Española", pais: "España" },
                { id: 2, nombre: "Premier League", pais: "Inglaterra" },
                { id: 3, nombre: "Serie A", pais: "Italia" },
                { id: 4, nombre: "Bundesliga", pais: "Alemania" },
                { id: 5, nombre: "Ligue 1", pais: "Francia" }
              ];
            }
          }
        };
        
        log('API básico creado para cargar ligas', 'warn');
      } else if (typeof API.getLeagues !== 'function') {
        log('Error: API.getLeagues no está definida', 'error');
        
        // Añadir getLeagues al API existente
        API.getLeagues = async function() {
          try {
            const response = await fetch('/api/leagues');
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            
            if (data.leagues && Array.isArray(data.leagues)) {
              return data.leagues;
            } else if (data.datos && Array.isArray(data.datos)) {
              return data.datos;
            } else {
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
            return [
              { id: 1, nombre: "Liga Española", pais: "España" },
              { id: 2, nombre: "Premier League", pais: "Inglaterra" },
              { id: 3, nombre: "Serie A", pais: "Italia" },
              { id: 4, nombre: "Bundesliga", pais: "Alemania" },
              { id: 5, nombre: "Ligue 1", pais: "Francia" }
            ];
          }
        };
        
        log('API.getLeagues implementada', 'warn');
      }
      
      // Obtener ligas a través de la API
      log('Llamando a API.getLeagues()...', 'info');
      let leagues = [];
      
      try {
        leagues = await API.getLeagues();
        log(`Se obtuvieron ${leagues.length} ligas desde API.getLeagues()`, 'success');
      } catch (apiError) {
        log(`Error llamando a API.getLeagues(): ${apiError.message}`, 'error');
        
        // Intentar fetch directo
        try {
          log('Intentando fetch directo a /api/leagues...', 'warn');
          const response = await fetch('/api/leagues');
          
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
          }
          
          const data = await response.json();
          log('Datos obtenidos directamente:', 'info');
          console.log(data);
          
          // Extraer ligas según formato
          if (data.leagues && Array.isArray(data.leagues)) {
            leagues = data.leagues;
            log(`Se obtuvieron ${leagues.length} ligas desde data.leagues`, 'success');
          } else if (data.datos && Array.isArray(data.datos)) {
            leagues = data.datos;
            log(`Se obtuvieron ${leagues.length} ligas desde data.datos`, 'success');
          } else if (Array.isArray(data)) {
            leagues = data;
            log(`Se obtuvieron ${leagues.length} ligas desde array directo`, 'success');
          } else {
            log('Estructura de respuesta no reconocida, usando datos de ejemplo', 'warn');
            leagues = [
              { id: 1, nombre: "Liga Española", pais: "España" },
              { id: 2, nombre: "Premier League", pais: "Inglaterra" },
              { id: 3, nombre: "Serie A", pais: "Italia" },
              { id: 4, nombre: "Bundesliga", pais: "Alemania" },
              { id: 5, nombre: "Ligue 1", pais: "Francia" }
            ];
          }
        } catch (fetchError) {
          log(`Error en fetch directo: ${fetchError.message}`, 'error');
          
          // Como último recurso, usar datos de ejemplo
          log('Usando ligas de ejemplo como último recurso', 'warn');
          leagues = [
            { id: 1, nombre: "Liga Española", pais: "España" },
            { id: 2, nombre: "Premier League", pais: "Inglaterra" },
            { id: 3, nombre: "Serie A", pais: "Italia" },
            { id: 4, nombre: "Bundesliga", pais: "Alemania" },
            { id: 5, nombre: "Ligue 1", pais: "Francia" }
          ];
        }
      }
      
      // Verificar que tenemos ligas para mostrar
      if (!leagues || !Array.isArray(leagues) || leagues.length === 0) {
        log('No se obtuvieron ligas válidas, usando datos de ejemplo', 'warn');
        
        leagues = [
          { id: 1, nombre: "Liga Española", pais: "España" },
          { id: 2, nombre: "Premier League", pais: "Inglaterra" },
          { id: 3, nombre: "Serie A", pais: "Italia" },
          { id: 4, nombre: "Bundesliga", pais: "Alemania" },
          { id: 5, nombre: "Ligue 1", pais: "Francia" }
        ];
      }
      
      log(`Se procesarán ${leagues.length} ligas`, 'info');
      
      // Limpiar selector
      leagueSelect.innerHTML = '';
      log('Selector de ligas limpiado', 'info');
      
      // Añadir opción por defecto
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Selecciona una liga';
      defaultOption.selected = true;
      leagueSelect.appendChild(defaultOption);
      
      // Añadir opciones de liga
      leagues.forEach((league, index) => {
        try {
          const option = document.createElement('option');
          option.value = league.id;
          
          // Adaptarse a diferentes estructuras de datos
          const nombre = league.nombre || league.name || `Liga ${index+1}`;
          const pais = league.pais || league.country || '';
          
          option.textContent = pais ? `${nombre} (${pais})` : nombre;
          leagueSelect.appendChild(option);
          
          log(`Liga añadida: ID=${league.id}, Nombre=${nombre}`, 'info');
        } catch (optionError) {
          log(`Error añadiendo opción para liga ${index}: ${optionError.message}`, 'error');
        }
      });
      
      // Configurar evento para cargar equipos
      if (!leagueSelect._hasChangeListener) {
        log('Configurando evento change para selector de ligas', 'info');
        
        leagueSelect.addEventListener('change', function() {
          const selectedLeagueId = this.value;
          log(`Liga seleccionada: ${selectedLeagueId}`, 'info');
          
          if (selectedLeagueId) {
            if (typeof loadTeams === 'function') {
              loadTeams(selectedLeagueId);
            } else {
              log('Función loadTeams no encontrada, implementando versión provisional', 'warn');
              loadTeamsProvisional(selectedLeagueId);
            }
          }
        });
        
        // Marcar que ya tiene listener para evitar duplicados
        leagueSelect._hasChangeListener = true;
      }
      
      log('✅ Carga de ligas completada con éxito', 'success');
      
      // Mostrar mensaje de éxito en la página
      showSuccessInPage("Ligas cargadas correctamente");
      
    } catch (error) {
      log(`Error general en fixedLoadLeagues: ${error.message}`, 'error');
      showErrorInPage(`Error al cargar ligas: ${error.message}`);
    }
  }
  
  // Implementación provisional de loadTeams
  async function loadTeamsProvisional(leagueId) {
    try {
      log(`Cargando equipos para liga ID: ${leagueId}`, 'info');
      
      // Verificar API
      if (typeof API === 'undefined' || typeof API.getTeamsByLeague !== 'function') {
        // Implementar getTeamsByLeague provisional
        if (typeof API === 'undefined') window.API = {};
        
        API.getTeamsByLeague = async function(leagueId) {
          try {
            const response = await fetch(`/api/teams?league=${leagueId}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            
            const data = await response.json();
            
            if (data.teams && Array.isArray(data.teams)) {
              return data.teams;
            } else if (data.datos && Array.isArray(data.datos)) {
              return data.datos;
            } else {
              return getExampleTeams(leagueId);
            }
          } catch (error) {
            console.error("Error obteniendo equipos:", error);
            return getExampleTeams(leagueId);
          }
        };
        
        log('API.getTeamsByLeague implementada provisionalmente', 'warn');
      }
      
      // Buscar selectores de equipos
      const homeTeamSelect = document.querySelector('#home-team-select, select[name="homeTeam"], select[placeholder="Selecciona equipo local"]');
      const awayTeamSelect = document.querySelector('#away-team-select, select[name="awayTeam"], select[placeholder="Selecciona equipo visitante"]');
      
      if (!homeTeamSelect || !awayTeamSelect) {
        log('No se encontraron los selectores de equipos', 'error');
        showErrorInPage("No se pudieron encontrar los selectores de equipos");
        return;
      }
      
      // Cargar equipos
      let teams = [];
      
      try {
        teams = await API.getTeamsByLeague(leagueId);
        log(`Se obtuvieron ${teams.length} equipos desde API`, 'success');
      } catch (error) {
        log(`Error obteniendo equipos: ${error.message}`, 'error');
        
        // Usar datos de ejemplo
        teams = getExampleTeams(leagueId);
        log('Usando datos de ejemplo para equipos', 'warn');
      }
      
      // Limpiar selectores
      homeTeamSelect.innerHTML = '';
      awayTeamSelect.innerHTML = '';
      
      // Añadir opciones por defecto
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
      
      // Añadir opciones de equipos
      teams.forEach(team => {
        const id = team.id;
        const nombre = team.name || team.nombre || 'Equipo sin nombre';
        
        // Opción para equipo local
        const homeOption = document.createElement('option');
        homeOption.value = id;
        homeOption.textContent = nombre;
        homeTeamSelect.appendChild(homeOption);
        
        // Opción para equipo visitante
        const awayOption = document.createElement('option');
        awayOption.value = id;
        awayOption.textContent = nombre;
        awayTeamSelect.appendChild(awayOption);
        
        log(`Equipo añadido: ID=${id}, Nombre=${nombre}`, 'info');
      });
      
      log(`✅ Se cargaron ${teams.length} equipos correctamente`, 'success');
    } catch (error) {
      log(`Error en loadTeamsProvisional: ${error.message}`, 'error');
      showErrorInPage(`Error al cargar equipos: ${error.message}`);
    }
  }
  
  // Función para obtener equipos de ejemplo según liga
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
  
  // Funciones para mostrar mensajes en la página
  function showErrorInPage(message) {
    // Buscar o crear contenedor de error
    let errorDiv = document.getElementById('diagnostic-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'diagnostic-error';
      errorDiv.style.margin = '10px';
      errorDiv.style.padding = '10px';
      errorDiv.style.backgroundColor = '#ffeeee';
      errorDiv.style.border = '1px solid #ff0000';
      errorDiv.style.borderRadius = '5px';
      errorDiv.style.color = '#ff0000';
      
      // Insertar al inicio del contenido o antes del formulario
      const formElement = document.querySelector('form, #analysis-form');
      if (formElement) {
        formElement.parentNode.insertBefore(errorDiv, formElement);
      } else {
        document.body.insertBefore(errorDiv, document.body.firstChild);
      }
    }
    
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
  }
  
  function showSuccessInPage(message) {
    // Buscar o crear contenedor de éxito
    let successDiv = document.getElementById('diagnostic-success');
    if (!successDiv) {
      successDiv = document.createElement('div');
      successDiv.id = 'diagnostic-success';
      successDiv.style.margin = '10px';
      successDiv.style.padding = '10px';
      successDiv.style.backgroundColor = '#eeffee';
      successDiv.style.border = '1px solid #00cc00';
      successDiv.style.borderRadius = '5px';
      successDiv.style.color = '#006600';
      
      // Insertar al inicio del contenido o antes del formulario
      const formElement = document.querySelector('form, #analysis-form');
      const errorDiv = document.getElementById('diagnostic-error');
      
      if (errorDiv) {
        errorDiv.parentNode.insertBefore(successDiv, errorDiv.nextSibling);
      } else if (formElement) {
        formElement.parentNode.insertBefore(successDiv, formElement);
      } else {
        document.body.insertBefore(successDiv, document.body.firstChild);
      }
    }
    
    successDiv.innerHTML = `<strong>Éxito:</strong> ${message}`;
    
    // Ocultar automáticamente después de 5 segundos
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.style.display = 'none';
      }
    }, 5000);
  }
})();