#!/bin/bash

echo "🚀 INICIANDO PREDICTOR DE FÚTBOL PREMIUM"
echo "========================================"

# Crear directorios necesarios
echo "📁 Creando estructura de directorios..."
mkdir -p python_service/data
mkdir -p python_service/models/saved
mkdir -p python_service/logs
mkdir -p backend/logs

# Generar datos de entrenamiento de muestra
echo "📊 Generando datos de entrenamiento de muestra..."
cat > python_service/data/partidos_historicos.csv << EOF
match_id,date,season,league,home_team,away_team,home_goals,away_goals,result,total_goals,home_shots_on_target,away_shots_on_target,home_corners,away_corners,home_fouls,away_fouls,home_yellow_cards,away_yellow_cards,home_red_cards,away_red_cards
1,2023-08-12,2023,Premier League,Manchester City,Arsenal,2,1,H,3,8,4,7,3,11,14,2,3,0,0
2,2023-08-13,2023,Premier League,Liverpool,Chelsea,1,1,D,2,6,7,5,6,13,12,1,2,0,0
3,2023-08-14,2023,Premier League,Manchester United,Tottenham,3,0,H,3,9,2,8,2,10,15,3,1,0,1
4,2023-08-15,2023,La Liga,Real Madrid,Barcelona,2,1,H,3,7,5,6,4,12,13,2,3,0,0
5,2023-08-16,2023,La Liga,Atletico Madrid,Sevilla,1,0,H,1,4,3,5,3,14,11,2,2,0,0
6,2023-08-17,2023,Premier League,Newcastle,Brighton,2,2,D,4,6,6,4,5,11,12,1,3,0,0
7,2023-08-18,2023,La Liga,Valencia,Real Sociedad,0,1,A,1,3,4,3,6,13,10,2,1,1,0
8,2023-08-19,2023,Premier League,West Ham,Crystal Palace,1,2,A,3,5,7,4,7,12,14,2,2,0,0
9,2023-08-20,2023,La Liga,Villarreal,Real Betis,3,1,H,4,8,3,7,2,9,13,1,3,0,0
10,2023-08-21,2023,Premier League,Aston Villa,Everton,2,0,H,2,6,2,6,3,11,15,2,2,0,0
11,2023-08-22,2023,La Liga,Athletic Bilbao,Getafe,1,1,D,2,4,4,5,5,12,12,2,2,0,0
12,2023-08-23,2023,Premier League,Brentford,Fulham,2,1,H,3,7,4,5,4,10,11,1,2,0,0
13,2023-08-24,2023,La Liga,Osasuna,Mallorca,0,2,A,2,3,6,2,7,14,9,3,1,0,0
14,2023-08-25,2023,Premier League,Bournemouth,Nottingham Forest,1,3,A,4,4,8,3,6,13,11,2,3,0,1
15,2023-08-26,2023,La Liga,Celta Vigo,Granada,2,0,H,2,6,3,6,2,11,14,1,3,0,0
16,2023-09-02,2023,Premier League,Arsenal,Manchester United,3,1,H,4,9,3,8,2,9,16,1,4,0,0
17,2023-09-03,2023,Premier League,Chelsea,Liverpool,0,1,A,1,3,5,3,7,14,11,3,2,0,0
18,2023-09-04,2023,Premier League,Tottenham,Manchester City,1,2,A,3,4,8,4,8,12,10,2,1,0,0
19,2023-09-05,2023,La Liga,Barcelona,Real Madrid,1,2,A,3,6,7,5,6,11,12,2,3,1,0
20,2023-09-06,2023,La Liga,Sevilla,Atletico Madrid,0,0,D,0,2,3,2,4,13,14,2,3,0,0
EOF

echo "✅ Datos de muestra creados en python_service/data/partidos_historicos.csv"

# Crear archivo de variables de entorno para Python
echo "🔧 Configurando variables de entorno..."
cat > python_service/.env << EOF
FLASK_ENV=development
PORT=5000
MODEL_PATH=models/saved/football_predictor.joblib
API_KEYS=test_key_123,dev_key_456
JWT_SECRET_KEY=mi_clave_secreta_jwt_2024
EOF

# Crear archivo de variables de entorno para Node.js
cat > backend/.env << EOF
NODE_ENV=development
PORT=3000
PYTHON_SERVICE_URL=http://localhost:5000
CACHE_TTL=3600
API_FOOTBALL_KEY=tu_clave_api_opcional
EOF

echo "✅ Variables de entorno configuradas"

# Instalar dependencias de Node.js
echo "📦 Instalando dependencias de Node.js..."
cd backend
npm install --silent

# Volver al directorio raíz
cd ..

# Instalar dependencias de Python
echo "🐍 Instalando dependencias de Python..."
cd python_service
pip install pandas numpy scikit-learn joblib requests flask flask-cors python-dotenv matplotlib seaborn

# Volver al directorio raíz
cd ..

echo ""
echo "🎯 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "Para iniciar la aplicación, ejecuta:"
echo "1. Terminal 1 (Entrenar modelo y iniciar Python): ./start_python.sh"
echo "2. Terminal 2 (Iniciar Node.js): ./start_backend.sh"
echo "3. Abrir navegador: http://localhost:3000"
echo ""
echo "¡La aplicación estará lista en 2-3 minutos!"