// 🔧 SCRIPT PARA ACTIVAR LA SELECCIÓN DE EQUIPOS
// Ejecutar en la consola del navegador (F12)

console.log("🔧 Configurando selección de equipos...");

// Equipos de la Bundesliga
const bundesligaTeams = [
  "Bayern Munich",
  "Borussia Dortmund", 
  "RB Leipzig",
  "Bayer Leverkusen",
  "Union Berlin",
  "SC Freiburg",
  "FC Köln",
  "Eintracht Frankfurt",
  "VfL Wolfsburg",
  "Borussia Mönchengladbach",
  "FSV Mainz 05",
  "1. FC Heidenheim",
  "VfB Stuttgart",
  "TSG Hoffenheim",
  "FC Augsburg",
  "Werder Bremen",
  "VfL Bochum",
  "SV Darmstadt 98"
];

// Equipos de Premier League
const premierLeagueTeams = [
  "Manchester City",
  "Arsenal", 
  "Liverpool",
  "Manchester United",
  "Chelsea",
  "Tottenham",
  "Newcastle",
  "Brighton",
  "West Ham",
  "Aston Villa",
  "Crystal Palace",
  "Brentford",
  "Fulham",
  "Wolves",
  "Everton",
  "Nottingham Forest",
  "Burnley",
  "Sheffield United",
  "Luton Town",
  "Bournemouth"
];

// Equipos de La Liga
const laLigaTeams = [
  "Real Madrid",
  "Barcelona", 
  "Atlético Madrid",
  "Sevilla",
  "Real Sociedad",
  "Real Betis",
  "Villarreal",
  "Valencia",
  "Athletic Bilbao",
  "Getafe",
  "Osasuna",
  "Las Palmas",
  "Girona",
  "Rayo Vallecano",
  "Mallorca",
  "Celta Vigo",
  "Cadiz",
  "Granada",
  "Almeria",
  "Alaves"
];

// Función para llenar selectores
function populateTeamSelectors() {
  const homeTeamSelect = document.getElementById('home-team-select');
  const awayTeamSelect = document.getElementById('away-team-select');
  const leagueSelect = document.getElementById('league-select');
  
  // Llenar selector de ligas si está vacío
  if (leagueSelect && leagueSelect.options.length <= 1) {
    const leagues = [
      { value: "Premier League", text: "Premier League (Inglaterra)" },
      { value: "La Liga", text: "La Liga (España)" }, 
      { value: "Bundesliga", text: "Bundesliga (Alemania)" },
      { value: "Serie A", text: "Serie A (Italia)" },
      { value: "Ligue 1", text: "Ligue 1 (Francia)" }
    ];
    
    leagues.forEach(league => {
      const option = document.createElement('option');
      option.value = league.value;
      option.textContent = league.text;
      leagueSelect.appendChild(option);
    });
    
    // Seleccionar Bundesliga por defecto (ya está seleccionada)
    leagueSelect.value = "Bundesliga";
  }
  
  // Llenar equipos según la liga seleccionada
  function updateTeams() {
    const selectedLeague = leagueSelect ? leagueSelect.value : "Bundesliga";
    let teams = bundesligaTeams; // Por defecto
    
    if (selectedLeague.includes("Premier League")) {
      teams = premierLeagueTeams;
    } else if (selectedLeague.includes("La Liga")) {
      teams = laLigaTeams;
    } else if (selectedLeague.includes("Bundesliga")) {
      teams = bundesligaTeams;
    }
    
    // Limpiar selectores de equipos
    if (homeTeamSelect) {
      homeTeamSelect.innerHTML = '<option value="">Selecciona equipo local</option>';
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        homeTeamSelect.appendChild(option);
      });
    }
    
    if (awayTeamSelect) {
      awayTeamSelect.innerHTML = '<option value="">Selecciona equipo visitante</option>';
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        awayTeamSelect.appendChild(option);
      });
    }
    
    console.log(`✅ Equipos cargados para: ${selectedLeague}`);
  }
  
  // Actualizar equipos al cambiar liga
  if (leagueSelect) {
    leagueSelect.addEventListener('change', updateTeams);
  }
  
  // Cargar equipos iniciales
  updateTeams();
}

// Ejecutar cuando la página esté lista
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', populateTeamSelectors);
} else {
  populateTeamSelectors();
}

// También ejecutar inmediatamente
populateTeamSelectors();

console.log("✅ Configuración de equipos completada");
console.log("🎯 Ahora puedes seleccionar equipos en los menús desplegables");