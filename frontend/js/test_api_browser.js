// 🧪 PRUEBA RÁPIDA DE LA API DESDE LA CONSOLA DEL NAVEGADOR
// Abre DevTools (F12) -> Consola y pega este código

console.log("🚀 Probando Predictor de Fútbol Premium...");

// Test 1: Verificar que el backend responde
fetch('/api/health')
  .then(response => response.json())
  .then(data => {
    console.log("✅ Backend funcionando:", data);
  })
  .catch(error => {
    console.log("❌ Error backend:", error);
  });

// Test 2: Predicción simple
const predictionData = {
  homeTeam: "Bayern Munich",
  awayTeam: "Borussia Dortmund", 
  league: "Bundesliga",
  date: "2025-06-02"
};

console.log("🎯 Enviando predicción:", predictionData);

fetch('/api/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(predictionData)
})
.then(response => response.json())
.then(data => {
  console.log("🎉 Predicción recibida:", data);
  
  if (data.success) {
    console.log("📊 Resultados:");
    console.log(`   Victoria Local: ${(data.data.victoria_local * 100).toFixed(1)}%`);
    console.log(`   Empate: ${(data.data.empate * 100).toFixed(1)}%`);
    console.log(`   Victoria Visitante: ${(data.data.victoria_visitante * 100).toFixed(1)}%`);
    
    if (data.data.analisis) {
      console.log("📝 Análisis:", data.data.analisis.general);
    }
  }
})
.catch(error => {
  console.log("❌ Error predicción:", error);
});

// Test 3: Verificar servicio Python (ML avanzado)
fetch('/api/python/status')
  .then(response => response.json())
  .then(data => {
    console.log("🐍 Estado Python ML:", data);
  })
  .catch(error => {
    console.log("⚠️ Python ML no disponible (usará modelo simple)");
  });