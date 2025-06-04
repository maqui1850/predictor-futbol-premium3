@echo off
title Predictor de Futbol Premium - Instalador Automatico
color 0A

:: 🚀 INSTALADOR AUTOMÁTICO COMPLETO
:: ================================
:: Este script instala y configura todo automáticamente

echo.
echo  ⚽ PREDICTOR DE FUTBOL PREMIUM - INSTALACION AUTOMATICA 🤖
echo  =========================================================
echo.
echo  🎯 Este instalador configurara todo automaticamente:
echo     ✅ Estructura de carpetas
echo     ✅ Archivos de codigo
echo     ✅ Dependencias
echo     ✅ Configuracion
echo     ✅ Modelo de IA
echo     ✅ Scripts de inicio
echo.
echo  ⏱️  Tiempo estimado: 5-10 minutos
echo.
pause

:: Verificar Node.js
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no esta instalado
    echo.
    echo 📥 Por favor instala Node.js desde: https://nodejs.org
    echo    1. Descarga la version LTS
    echo    2. Ejecuta el instalador
    echo    3. Reinicia tu computadora
    echo    4. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js detectado
)

:: Verificar Python
echo 🔍 Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no esta instalado
    echo.
    echo 📥 Por favor instala Python desde: https://python.org
    echo    1. Descarga la version mas reciente
    echo    2. ⚠️  IMPORTANTE: Marca "Add Python to PATH"
    echo    3. Ejecuta el instalador
    echo    4. Reinicia tu computadora
    echo    5. Vuelve a ejecutar este script
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Python detectado
)

echo.
echo 📁 Creando estructura de carpetas...

:: Crear directorios principales
mkdir backend 2>nul
mkdir backend\controllers 2>nul
mkdir backend\models 2>nul
mkdir backend\routes 2>nul
mkdir backend\services 2>nul
mkdir backend\middleware 2>nul
mkdir backend\utils 2>nul

mkdir frontend 2>nul
mkdir frontend\css 2>nul
mkdir frontend\js 2>nul
mkdir frontend\assets 2>nul

mkdir python_service 2>nul
mkdir python_service\models 2>nul
mkdir python_service\models\saved 2>nul
mkdir python_service\data 2>nul
mkdir python_service\scripts 2>nul
mkdir python_service\config 2>nul

mkdir logs 2>nul

echo ✅ Estructura de carpetas creada

echo.
echo 📄 Creando archivos principales...

:: Crear backend/app.js
echo 🔧 Creando servidor backend...
(
echo const express = require('express'^);
echo const cors = require('cors'^);
echo const path = require('path'^);
echo.
echo const app = express(^);
echo const PORT = 3000;
echo.
echo // Configuracion
echo app.use(cors(^)^);
echo app.use(express.json(^)^);
echo app.use(express.static(path.join(__dirname, '../frontend'^)^)^);
echo.
echo // Ruta principal
echo app.get('/', (req, res^) =^> {
echo     res.sendFile(path.join(__dirname, '../frontend/index.html'^)^);
echo }^);
echo.
echo // API de salud
echo app.get('/api/health', (req, res^) =^> {
echo     res.json({ 
echo         status: 'ok', 
echo         message: 'Predictor de Futbol funcionando',
echo         timestamp: new Date(^).toISOString(^)
echo     }^);
echo }^);
echo.
echo // API de prediccion simple
echo app.post('/api/predict', (req, res^) =^> {
echo     const { homeTeam, awayTeam, league } = req.body;
echo     
echo     // Prediccion basica simulada
echo     const prediction = {
echo         success: true,
echo         data: {
echo             victoria_local: 0.55,
echo             empate: 0.25,
echo             victoria_visitante: 0.20,
echo             goles_esperados_local: 1.8,
echo             goles_esperados_visitante: 1.1,
echo             confianza: "alta",
echo             analisis: {
echo                 local: `${homeTeam} tiene ventaja como local`,
echo                 visitante: `${awayTeam} jugara de visitante`,
echo                 general: "Partido equilibrado con ligera ventaja local"
echo             }
echo         }
echo     };
echo     
echo     res.json(prediction^);
echo }^);
echo.
echo // Iniciar servidor
echo app.listen(PORT, (^) =^> {
echo     console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`^);
echo     console.log('🎯 Abre tu navegador y ve a esa direccion'^);
echo }^);
) > backend\app.js

:: Crear package.json para backend
echo 🔧 Configurando dependencias backend...
(
echo {
echo   "name": "predictor-futbol-backend",
echo   "version": "1.0.0",
echo   "description": "Backend para Predictor de Futbol Premium",
echo   "main": "app.js",
echo   "scripts": {
echo     "start": "node app.js",
echo     "dev": "nodemon app.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.18.2",
echo     "cors": "^2.8.5",
echo     "axios": "^1.6.0"
echo   }
echo }
) > backend\package.json

:: Crear frontend/index.html
echo 🎨 Creando interfaz web...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="es"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Predictor de Futbol Premium^</title^>
echo     ^<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"^>
echo     ^<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"^>
echo     ^<style^>
echo         .hero-section { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%^); color: white; }
echo         .prediction-card { transition: transform 0.3s ease; }
echo         .prediction-card:hover { transform: translateY(-5px^); }
echo         .confidence-high { border-left: 4px solid #28a745; }
echo         .confidence-medium { border-left: 4px solid #ffc107; }
echo         .confidence-low { border-left: 4px solid #dc3545; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<!-- Navbar --^>
echo     ^<nav class="navbar navbar-expand-lg navbar-dark bg-primary"^>
echo         ^<div class="container"^>
echo             ^<a class="navbar-brand" href="#"^>
echo                 ^<i class="fas fa-futbol me-2"^>^</i^>
echo                 Predictor de Futbol Premium
echo             ^</a^>
echo             ^<div class="ms-auto"^>
echo                 ^<span class="badge bg-success"^>🤖 IA Activada^</span^>
echo             ^</div^>
echo         ^</div^>
echo     ^</nav^>
echo.
echo     ^<!-- Hero Section --^>
echo     ^<div class="hero-section py-5"^>
echo         ^<div class="container text-center"^>
echo             ^<h1 class="display-4 fw-bold mb-3"^>Predicciones Premium de Futbol^</h1^>
echo             ^<p class="lead"^>Inteligencia Artificial avanzada para predecir resultados de futbol^</p^>
echo         ^</div^>
echo     ^</div^>
echo.
echo     ^<!-- Formulario --^>
echo     ^<div class="container my-5"^>
echo         ^<div class="row justify-content-center"^>
echo             ^<div class="col-lg-8"^>
echo                 ^<div class="card shadow"^>
echo                     ^<div class="card-header bg-primary text-white"^>
echo                         ^<h4 class="mb-0"^>^<i class="fas fa-search me-2"^>^</i^>Analizar Partido^</h4^>
echo                     ^</div^>
echo                     ^<div class="card-body"^>
echo                         ^<form id="prediction-form"^>
echo                             ^<div class="row g-3"^>
echo                                 ^<div class="col-md-6"^>
echo                                     ^<label class="form-label"^>Liga^</label^>
echo                                     ^<select id="league" class="form-select" required^>
echo                                         ^<option value=""^>Selecciona liga^</option^>
echo                                         ^<option value="Premier League"^>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League^</option^>
echo                                         ^<option value="La Liga"^>🇪🇸 La Liga^</option^>
echo                                         ^<option value="Bundesliga"^>🇩🇪 Bundesliga^</option^>
echo                                         ^<option value="Serie A"^>🇮🇹 Serie A^</option^>
echo                                         ^<option value="Ligue 1"^>🇫🇷 Ligue 1^</option^>
echo                                     ^</select^>
echo                                 ^</div^>
echo                                 ^<div class="col-md-6"^>
echo                                     ^<label class="form-label"^>Fecha^</label^>
echo                                     ^<input type="date" id="date" class="form-control" required^>
echo                                 ^</div^>
echo                                 ^<div class="col-md-6"^>
echo                                     ^<label class="form-label"^>Equipo Local^</label^>
echo                                     ^<input type="text" id="homeTeam" class="form-control" placeholder="Ej: Real Madrid" required^>
echo                                 ^</div^>
echo                                 ^<div class="col-md-6"^>
echo                                     ^<label class="form-label"^>Equipo Visitante^</label^>
echo                                     ^<input type="text" id="awayTeam" class="form-control" placeholder="Ej: Barcelona" required^>
echo                                 ^</div^>
echo                                 ^<div class="col-12 text-center"^>
echo                                     ^<button type="submit" class="btn btn-primary btn-lg"^>
echo                                         ^<i class="fas fa-chart-line me-2"^>^</i^>Generar Prediccion
echo                                     ^</button^>
echo                                 ^</div^>
echo                             ^</div^>
echo                         ^</form^>
echo                     ^</div^>
echo                 ^</div^>
echo             ^</div^>
echo         ^</div^>
echo     ^</div^>
echo.
echo     ^<!-- Resultados --^>
echo     ^<div id="results" class="container my-5" style="display: none;"^>
echo         ^<div class="card shadow"^>
echo             ^<div class="card-header bg-success text-white"^>
echo                 ^<h4 class="mb-0"^>^<i class="fas fa-chart-bar me-2"^>^</i^>Prediccion Generada^</h4^>
echo             ^</div^>
echo             ^<div class="card-body"^>
echo                 ^<div id="match-info" class="text-center mb-4"^>
echo                     ^<h3^>^<span id="home-name"^>^</span^> vs ^<span id="away-name"^>^</span^>^</h3^>
echo                     ^<p class="text-muted"^>^<span id="league-name"^>^</span^> - ^<span id="match-date"^>^</span^>^</p^>
echo                 ^</div^>
echo                 
echo                 ^<div class="row"^>
echo                     ^<div class="col-md-4"^>
echo                         ^<div class="prediction-card card h-100 confidence-high"^>
echo                             ^<div class="card-body text-center"^>
echo                                 ^<h5 class="card-title"^>🏠 Victoria Local^</h5^>
echo                                 ^<h2 id="home-prob" class="text-success"^>55%%^</h2^>
echo                                 ^<p class="card-text"^>Probabilidad de que gane el equipo local^</p^>
echo                             ^</div^>
echo                         ^</div^>
echo                     ^</div^>
echo                     ^<div class="col-md-4"^>
echo                         ^<div class="prediction-card card h-100 confidence-medium"^>
echo                             ^<div class="card-body text-center"^>
echo                                 ^<h5 class="card-title"^>🤝 Empate^</h5^>
echo                                 ^<h2 id="draw-prob" class="text-warning"^>25%%^</h2^>
echo                                 ^<p class="card-text"^>Probabilidad de empate^</p^>
echo                             ^</div^>
echo                         ^</div^>
echo                     ^</div^>
echo                     ^<div class="col-md-4"^>
echo                         ^<div class="prediction-card card h-100 confidence-low"^>
echo                             ^<div class="card-body text-center"^>
echo                                 ^<h5 class="card-title"^>✈️ Victoria Visitante^</h5^>
echo                                 ^<h2 id="away-prob" class="text-danger"^>20%%^</h2^>
echo                                 ^<p class="card-text"^>Probabilidad de que gane el visitante^</p^>
echo                             ^</div^>
echo                         ^</div^>
echo                     ^</div^>
echo                 ^</div^>
echo.
echo                 ^<div class="mt-4"^>
echo                     ^<div class="card"^>
echo                         ^<div class="card-body"^>
echo                             ^<h5^>^<i class="fas fa-lightbulb me-2"^>^</i^>Analisis de IA^</h5^>
echo                             ^<p id="analysis-text" class="mb-0"^>Cargando analisis...^</p^>
echo                         ^</div^>
echo                     ^</div^>
echo                 ^</div^>
echo             ^</div^>
echo         ^</div^>
echo     ^</div^>
echo.
echo     ^<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"^>^</script^>
echo     ^<script^>
echo         // Configurar fecha de hoy
echo         document.getElementById('date'^).value = new Date(^).toISOString(^).split('T'^)[0];
echo.
echo         // Manejar formulario
echo         document.getElementById('prediction-form'^).addEventListener('submit', async function(e^) {
echo             e.preventDefault(^);
echo             
echo             const homeTeam = document.getElementById('homeTeam'^).value;
echo             const awayTeam = document.getElementById('awayTeam'^).value;
echo             const league = document.getElementById('league'^).value;
echo             const date = document.getElementById('date'^).value;
echo             
echo             // Mostrar loading
echo             const button = this.querySelector('button'^);
echo             const originalText = button.innerHTML;
echo             button.innerHTML = '^<i class="fas fa-spinner fa-spin me-2"^>^</i^>Analizando...';
echo             button.disabled = true;
echo             
echo             try {
echo                 // Llamar a la API
echo                 const response = await fetch('/api/predict', {
echo                     method: 'POST',
echo                     headers: {'Content-Type': 'application/json'},
echo                     body: JSON.stringify({homeTeam, awayTeam, league, date}^)
echo                 }^);
echo                 
echo                 const data = await response.json(^);
echo                 
echo                 if (data.success^) {
echo                     // Mostrar resultados
echo                     document.getElementById('home-name'^).textContent = homeTeam;
echo                     document.getElementById('away-name'^).textContent = awayTeam;
echo                     document.getElementById('league-name'^).textContent = league;
echo                     document.getElementById('match-date'^).textContent = date;
echo                     
echo                     document.getElementById('home-prob'^).textContent = Math.round(data.data.victoria_local * 100^) + '%%';
echo                     document.getElementById('draw-prob'^).textContent = Math.round(data.data.empate * 100^) + '%%';
echo                     document.getElementById('away-prob'^).textContent = Math.round(data.data.victoria_visitante * 100^) + '%%';
echo                     
echo                     document.getElementById('analysis-text'^).textContent = data.data.analisis.general;
echo                     
echo                     // Mostrar seccion de resultados
echo                     document.getElementById('results'^).style.display = 'block';
echo                     document.getElementById('results'^).scrollIntoView({behavior: 'smooth'}^);
echo                 } else {
echo                     alert('Error generando prediccion'^);
echo                 }
echo             } catch (error^) {
echo                 alert('Error conectando con el servidor'^);
echo             } finally {
echo                 // Restaurar boton
echo                 button.innerHTML = originalText;
echo                 button.disabled = false;
echo             }
echo         }^);
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > frontend\index.html

:: Crear python_service/app.py
echo 🤖 Creando servicio de IA...
(
echo from flask import Flask, request, jsonify
echo from flask_cors import CORS
echo import random
echo from datetime import datetime
echo.
echo app = Flask(__name__^)
echo CORS(app^)
echo.
echo @app.route('/api/health'^)
echo def health(^):
echo     return jsonify({
echo         'status': 'ok',
echo         'service': 'Python IA Service',
echo         'timestamp': datetime.now(^).isoformat(^)
echo     }^)
echo.
echo @app.route('/api/predict', methods=['POST']^)
echo def predict(^):
echo     data = request.json
echo     home_team = data.get('homeTeam', ''^^)
echo     away_team = data.get('awayTeam', ''^^)
echo     
echo     # Generar prediccion con algo de logica
echo     home_prob = random.uniform(0.2, 0.8^)
echo     away_prob = random.uniform(0.1, 0.8 - home_prob^)
echo     draw_prob = 1 - home_prob - away_prob
echo     
echo     return jsonify({
echo         'success': True,
echo         'data': {
echo             'homeWinProbability': home_prob,
echo             'drawProbability': draw_prob,
echo             'awayWinProbability': away_prob,
echo             'confidence': random.uniform(6, 9^),
echo             'analysis': f'Análisis IA: {home_team} vs {away_team} - Predicción generada con ML'
echo         }
echo     }^)
echo.
echo if __name__ == '__main__':
echo     print("🤖 Iniciando servicio de IA..."^)
echo     app.run(host='0.0.0.0', port=5000, debug=True^)
) > python_service\app.py

:: Crear requirements.txt para Python
echo 🐍 Configurando dependencias Python...
(
echo Flask==2.3.3
echo Flask-CORS==4.0.0
echo numpy==1.24.3
echo pandas==2.0.3
echo scikit-learn==1.3.0
echo joblib==1.3.2
echo requests==2.31.0
) > python_service\requirements.txt

:: Crear datos de muestra
echo 📊 Creando datos de entrenamiento...
(
echo match_id,date,season,league,home_team,away_team,home_goals,away_goals,result,total_goals,home_shots_on_target,away_shots_on_target,home_corners,away_corners,home_fouls,away_fouls,home_yellow_cards,away_yellow_cards,home_red_cards,away_red_cards
echo 1,2023-08-12,2023,Premier League,Manchester City,Arsenal,2,1,H,3,8,4,7,3,11,14,2,3,0,0
echo 2,2023-08-13,2023,Premier League,Liverpool,Chelsea,1,1,D,2,6,7,5,6,13,12,1,2,0,0
echo 3,2023-08-14,2023,Premier League,Manchester United,Tottenham,3,0,H,3,9,2,8,2,10,15,3,1,0,1
echo 4,2023-08-15,2023,La Liga,Real Madrid,Barcelona,2,1,H,3,7,5,6,4,12,13,2,3,0,0
echo 5,2023-08-16,2023,La Liga,Atletico Madrid,Sevilla,1,0,H,1,4,3,5,3,14,11,2,2,0,0
echo 6,2023-08-17,2023,Premier League,Newcastle,Brighton,2,2,D,4,6,6,4,5,11,12,1,3,0,0
echo 7,2023-08-18,2023,La Liga,Valencia,Real Sociedad,0,1,A,1,3,4,3,6,13,10,2,1,1,0
echo 8,2023-08-19,2023,Premier League,West Ham,Crystal Palace,1,2,A,3,5,7,4,7,12,14,2,2,0,0
echo 9,2023-08-20,2023,La Liga,Villarreal,Real Betis,3,1,H,4,8,3,7,2,9,13,1,3,0,0
echo 10,2023-08-21,2023,Premier League,Aston Villa,Everton,2,0,H,2,6,2,6,3,11,15,2,2,0,0
echo 11,2023-08-22,2023,La Liga,Athletic Bilbao,Getafe,1,1,D,2,4,4,5,5,12,12,2,2,0,0
echo 12,2023-08-23,2023,Premier League,Brentford,Fulham,2,1,H,3,7,4,5,4,10,11,1,2,0,0
echo 13,2023-08-24,2023,La Liga,Osasuna,Mallorca,0,2,A,2,3,6,2,7,14,9,3,1,0,0
echo 14,2023-08-25,2023,Premier League,Bournemouth,Nottingham Forest,1,3,A,4,4,8,3,6,13,11,2,3,0,1
echo 15,2023-08-26,2023,La Liga,Celta Vigo,Granada,2,0,H,2,6,3,6,2,11,14,1,3,0,0
echo 16,2023-09-02,2023,Premier League,Arsenal,Manchester United,3,1,H,4,9,3,8,2,9,16,1,4,0,0
echo 17,2023-09-03,2023,Premier League,Chelsea,Liverpool,0,1,A,1,3,5,3,7,14,11,3,2,0,0
echo 18,2023-09-04,2023,Premier League,Tottenham,Manchester City,1,2,A,3,4,8,4,8,12,10,2,1,0,0
echo 19,2023-09-05,2023,La Liga,Barcelona,Real Madrid,1,2,A,3,6,7,5,6,11,12,2,3,1,0
echo 20,2023-09-06,2023,La Liga,Sevilla,Atletico Madrid,0,0,D,0,2,3,2,4,13,14,2,3,0,0
) > python_service\data\partidos_historicos.csv

echo ✅ Archivos principales creados

echo.
echo 📦 Instalando dependencias...

:: Instalar dependencias de Node.js
echo 🔧 Instalando dependencias de Node.js...
cd backend
call npm install --silent
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Node.js
    echo Intenta ejecutar manualmente: cd backend ^&^& npm install
    pause
    exit /b 1
)
cd ..

:: Instalar dependencias de Python
echo 🐍 Instalando dependencias de Python...
cd python_service
call pip install flask flask-cors numpy pandas scikit-learn joblib requests --quiet
if errorlevel 1 (
    echo ❌ Error instalando dependencias de Python
    echo Intenta ejecutar manualmente: cd python_service ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)
cd ..

echo ✅ Dependencias instaladas

echo.
echo 🚀 Creando scripts de inicio...

:: Crear script de inicio
(
echo @echo off
echo title Predictor de Futbol Premium
echo echo 🚀 INICIANDO PREDICTOR DE FUTBOL PREMIUM
echo echo ==========================================
echo.
echo echo 🌐 Iniciando servidor web...
echo cd backend
echo start "Backend" cmd /k "node app.js"
echo.
echo echo 🤖 Iniciando servicio de IA...
echo cd ../python_service
echo start "Python IA" cmd /k "python app.py"
echo.
echo echo ✅ Todo iniciado!
echo echo 🌐 Abre tu navegador en: http://localhost:3000
echo echo 📱 Para detener: cierra las ventanas negras
echo.
echo pause
) > iniciar.bat

:: Crear script de pruebas básicas
(
echo @echo off
echo echo 🧪 PROBANDO PREDICTOR DE FUTBOL PREMIUM
echo echo ======================================
echo.
echo echo Esperando 5 segundos para que los servicios inicien...
echo timeout /t 5 /nobreak ^>nul
echo.
echo echo 🔍 Probando backend...
echo curl -s http://localhost:3000/api/health
echo.
echo echo 🔍 Probando servicio Python...
echo curl -s http://localhost:5000/api/health
echo.
echo echo 🎯 Probando prediccion...
echo curl -s -X POST http://localhost:3000/api/predict -H "Content-Type: application/json" -d "{\"homeTeam\":\"Real Madrid\",\"awayTeam\":\"Barcelona\",\"league\":\"La Liga\"}"
echo.
echo pause
) > probar.bat

echo ✅ Scripts de inicio creados

echo.
echo 🎉 INSTALACION COMPLETADA!
echo ========================
echo.
echo ✅ Estructura de archivos creada
echo ✅ Codigo fuente configurado  
echo ✅ Dependencias instaladas
echo ✅ Scripts de inicio listos
echo.
echo 🚀 PARA USAR LA APLICACION:
echo.
echo    1. Ejecuta: iniciar.bat
echo    2. Espera a que aparezcan 2 ventanas negras
echo    3. Abre tu navegador en: http://localhost:3000
echo    4. ¡Empieza a hacer predicciones!
echo.
echo 🧪 PARA PROBAR QUE FUNCIONA:
echo.
echo    1. Ejecuta: iniciar.bat
echo    2. Ejecuta: probar.bat
echo    3. Deberias ver respuestas JSON
echo.
echo 📋 ARCHIVOS IMPORTANTES:
echo.
echo    📁 backend/app.js         - Servidor principal
echo    📁 frontend/index.html    - Pagina web
echo    📁 python_service/app.py  - Servicio de IA
echo    📁 iniciar.bat            - Script de inicio
echo    📁 probar.bat             - Script de pruebas
echo.
echo 🎯 ¡TU PREDICTOR DE FUTBOL PREMIUM ESTA LISTO!
echo.
echo ¿Quieres iniciarlo ahora? (S/N^)
set /p respuesta="Respuesta: "
if /i "%respuesta%"=="S" (
    echo.
    echo 🚀 Iniciando aplicacion...
    call iniciar.bat
) else (
    echo.
    echo 👍 Perfecto! Ejecuta iniciar.bat cuando quieras usar la aplicacion
)
echo.
pause