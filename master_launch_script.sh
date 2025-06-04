#!/bin/bash

echo ""
echo "⚽ PREDICTOR DE FÚTBOL PREMIUM"
echo "============================="
echo "🚀 Iniciando aplicación completa..."
echo ""

# Verificar sistema operativo
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Sistema Windows detectado"
    PYTHON_CMD="python"
    NODE_CMD="node"
else
    echo "🐧 Sistema Unix/Linux/Mac detectado"
    PYTHON_CMD="python3"
    NODE_CMD="node"
fi

# Función para verificar dependencias
check_dependency() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 está instalado"
        return 0
    else
        echo "❌ $1 no está instalado"
        return 1
    fi
}

# Verificar dependencias del sistema
echo "🔍 Verificando dependencias del sistema..."
DEPENDENCIES_OK=true

if ! check_dependency $NODE_CMD; then
    echo "   Instala Node.js desde: https://nodejs.org"
    DEPENDENCIES_OK=false
fi

if ! check_dependency $PYTHON_CMD; then
    echo "   Instala Python desde: https://python.org"
    DEPENDENCIES_OK=false
fi

if ! check_dependency pip; then
    echo "   pip debería venir con Python"
    DEPENDENCIES_OK=false
fi

if [ "$DEPENDENCIES_OK" = false ]; then
    echo ""
    echo "❌ Faltan dependencias críticas. Instálalas y vuelve a ejecutar."
    exit 1
fi

echo ""
echo "📁 Verificando estructura del proyecto..."

# Verificar estructura básica
REQUIRED_DIRS=("backend" "python_service" "frontend")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Directorio faltante: $dir"
        echo "Asegúrate de estar en el directorio raíz del proyecto"
        exit 1
    fi
done

echo "✅ Estructura del proyecto verificada"

# Ejecutar configuración inicial
echo ""
echo "⚙️ CONFIGURACIÓN INICIAL"
echo "======================="

# Crear directorios necesarios
mkdir -p python_service/data
mkdir -p python_service/models/saved
mkdir -p python_service/logs
mkdir -p backend/logs

# Verificar/crear datos de muestra si no existen
if [ ! -f "python_service/data/partidos_historicos.csv" ]; then
    echo "📊 Creando datos de muestra para entrenamiento..."
    
    cat > python_service/data/partidos_historicos.csv << 'EOF'
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
    
    echo "✅ Datos de muestra creados"
else
    echo "✅ Datos de entrenamiento encontrados"
fi

# Configurar variables de entorno
if [ ! -f "python_service/.env" ]; then
    echo "🔧 Configurando Python service..."
    cat > python_service/.env << 'EOF'
FLASK_ENV=development
PORT=5000
MODEL_PATH=models/saved/football_predictor.joblib
EOF
fi

if [ ! -f "backend/.env" ]; then
    echo "🔧 Configurando Backend..."
    cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=3000
PYTHON_SERVICE_URL=http://localhost:5000
EOF
fi

# Instalar dependencias de Python
echo ""
echo "🐍 Instalando dependencias de Python..."
cd python_service
pip install pandas numpy scikit-learn joblib flask flask-cors python-dotenv > /dev/null 2>&1
cd ..

# Instalar dependencias de Node.js
echo "📦 Instalando dependencias de Node.js..."
cd backend
npm install > /dev/null 2>&1
cd ..

echo ""
echo "🤖 ENTRENANDO MODELO DE MACHINE LEARNING"
echo "========================================"

cd python_service
if [ ! -f "models/saved/football_predictor.joblib" ]; then
    echo "Entrenando modelo... (esto tomará 1-2 minutos)"
    $PYTHON_CMD train_simple.py
    if [ $? -eq 0 ]; then
        echo "✅ Modelo entrenado exitosamente"
    else
        echo "❌ Error al entrenar el modelo"
        exit 1
    fi
else
    echo "✅ Modelo ya existe, omitiendo entrenamiento"
fi
cd ..

echo ""
echo "🎉 CONFIGURACIÓN COMPLETADA"
echo "=========================="
echo ""
echo "La aplicación se iniciará automáticamente en unos segundos..."
echo ""

# Función para iniciar servicios en segundo plano
start_python_service() {
    echo "🐍 Iniciando servicio Python..."
    cd python_service
    $PYTHON_CMD api.py > ../logs/python.log 2>&1 &
    PYTHON_PID=$!
    cd ..
    echo "   PID: $PYTHON_PID"
    
    # Esperar a que el servicio esté listo
    for i in {1..15}; do
        curl -s http://localhost:5000/api/health > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Servicio Python listo"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Servicio Python no pudo iniciarse"
    return 1
}

start_node_service() {
    echo "🌐 Iniciando backend Node.js..."
    cd backend
    if [ -f "server-simple.js" ]; then
        $NODE_CMD server-simple.js > ../logs/node.log 2>&1 &
    else
        $NODE_CMD app.js > ../logs/node.log 2>&1 &
    fi
    NODE_PID=$!
    cd ..
    echo "   PID: $NODE_PID"
    
    # Esperar a que el servicio esté listo
    for i in {1..10}; do
        curl -s http://localhost:3000/api/health > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Backend Node.js listo"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Backend Node.js no pudo iniciarse"
    return 1
}

# Crear directorio de logs
mkdir -p logs

# Iniciar servicios
echo "🚀 INICIANDO SERVICIOS"
echo "====================="

start_python_service
PYTHON_OK=$?

start_node_service
NODE_OK=$?

echo ""
if [ $PYTHON_OK -eq 0 ] && [ $NODE_OK -eq 0 ]; then
    echo "🎉 ¡APLICACIÓN LISTA!"
    echo "===================="
    echo ""
    echo "🌐 Interfaz web: http://localhost:3000"
    echo "🔌 API Backend: http://localhost:3000/api"
    echo "🐍 API Python: http://localhost:5000/api"
    echo ""
    echo "📊 Ejemplos de prueba:"
    echo "   curl http://localhost:3000/api/health"
    echo "   curl http://localhost:5000/api/health"
    echo ""
    echo "📁 Logs disponibles en:"
    echo "   Backend: logs/node.log"
    echo "   Python: logs/python.log"
    echo ""
    echo "⏹️  Para detener: Ctrl+C o kill $NODE_PID $PYTHON_PID"
    echo ""
    
    # Abrir navegador automáticamente (si está disponible)
    if command -v xdg-open &> /dev/null; then
        sleep 2
        xdg-open http://localhost:3000 &
    elif command -v open &> /dev/null; then
        sleep 2
        open http://localhost:3000 &
    fi
    
    # Mantener el script corriendo
    echo "Presiona Ctrl+C para detener todos los servicios..."
    trap "echo '🛑 Deteniendo servicios...'; kill $PYTHON_PID $NODE_PID 2>/dev/null; exit" INT
    wait
    
else
    echo "❌ Error al iniciar algunos servicios"
    echo "Revisa los logs en el directorio 'logs/'"
    exit 1
fi