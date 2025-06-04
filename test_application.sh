#!/bin/bash

echo "🧪 PROBANDO PREDICTOR DE FÚTBOL PREMIUM"
echo "======================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar resultados
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Función para hacer peticiones HTTP
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-""}
    local description=$4
    
    echo -n "🔍 Probando: $description... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "%{http_code}" -X POST \
                   -H "Content-Type: application/json" \
                   -d "$data" \
                   "$url" 2>/dev/null)
    else
        response=$(curl -s -w "%{http_code}" "$url" 2>/dev/null)
    fi
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        echo -e "${GREEN}✅ OK ($http_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ FALLO ($http_code)${NC}"
        return 1
    fi
}

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0

# 1. Verificar que los servicios están corriendo
echo ""
echo -e "${BLUE}📡 VERIFICANDO SERVICIOS${NC}"
echo "========================"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend Node.js (puerto 3000)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    BACKEND_OK=true
else
    echo -e "${RED}❌ Backend Node.js no responde${NC}"
    BACKEND_OK=false
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servicio Python (puerto 5000)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    PYTHON_OK=true
else
    echo -e "${YELLOW}⚠️ Servicio Python no responde (usará fallback)${NC}"
    PYTHON_OK=false
fi

# 2. Pruebas de Health Check
echo ""
echo -e "${BLUE}❤️ HEALTH CHECKS${NC}"
echo "================="

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if test_endpoint "http://localhost:3000/api/health" "GET" "" "Backend health"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

if [ "$PYTHON_OK" = true ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_endpoint "http://localhost:5000/api/health" "GET" "" "Python health"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

# 3. Pruebas de Predicciones
echo ""
echo -e "${BLUE}🎯 PREDICCIONES${NC}"
echo "==============="

# Predicción simple
SIMPLE_PREDICTION='{"homeTeam": "Real Madrid", "awayTeam": "Barcelona", "league": "La Liga"}'
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if test_endpoint "http://localhost:3000/api/predict/simple" "POST" "$SIMPLE_PREDICTION" "Predicción simple"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# Predicción avanzada (si Python está disponible)
if [ "$PYTHON_OK" = true ]; then
    ADVANCED_PREDICTION='{"homeTeam": "Manchester City", "awayTeam": "Liverpool", "league": "Premier League"}'
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_endpoint "http://localhost:3000/api/predict/advanced" "POST" "$ADVANCED_PREDICTION" "Predicción avanzada"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

# Predicción inteligente (fallback automático)
SMART_PREDICTION='{"homeTeam": "Arsenal", "awayTeam": "Chelsea", "league": "Premier League"}'
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if test_endpoint "http://localhost:3000/api/predict" "POST" "$SMART_PREDICTION" "Predicción inteligente"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 4. Pruebas específicas de Python (si está disponible)
if [ "$PYTHON_OK" = true ]; then
    echo ""
    echo -e "${BLUE}🐍 SERVICIO PYTHON${NC}"
    echo "=================="
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_endpoint "http://localhost:5000/" "GET" "" "Python root"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    PYTHON_PREDICTION='{"home_team": "Valencia", "away_team": "Sevilla", "league": "La Liga"}'
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_endpoint "http://localhost:5000/api/predict" "POST" "$PYTHON_PREDICTION" "Python predict"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

# 5. Pruebas de Interfaz Web
echo ""
echo -e "${BLUE}🌐 INTERFAZ WEB${NC}"
echo "==============="

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if test_endpoint "http://localhost:3000/" "GET" "" "Página principal"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
fi

# 6. Verificar archivos críticos
echo ""
echo -e "${BLUE}📁 ARCHIVOS CRÍTICOS${NC}"
echo "===================="

CRITICAL_FILES=(
    "backend/app.js:Backend principal"
    "backend/controllers/predictionController.js:Controlador predicciones"
    "python_service/train_simple.py:Script entrenamiento"
    "python_service/api.py:API Python"
    "frontend/index.html:Interfaz web"
)

for file_desc in "${CRITICAL_FILES[@]}"; do
    file="${file_desc%%:*}"
    desc="${file_desc##*:}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $desc${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $desc (falta: $file)${NC}"
    fi
done

# 7. Verificar modelo entrenado
echo ""
echo -e "${BLUE}🤖 MODELO ML${NC}"
echo "============"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -f "python_service/models/saved/football_predictor.joblib" ]; then
    echo -e "${GREEN}✅ Modelo ML entrenado${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️ Modelo ML no encontrado (se puede entrenar)${NC}"
fi

# 8. Prueba de predicción completa con respuesta detallada
echo ""
echo -e "${BLUE}🔬 PRUEBA DETALLADA${NC}"
echo "==================="

echo "Realizando predicción completa..."
response=$(curl -s -X POST http://localhost:3000/api/predict \
    -H "Content-Type: application/json" \
    -d '{"homeTeam": "Barcelona", "awayTeam": "Real Madrid", "league": "La Liga"}')

if [ $? -eq 0 ] && [ ! -z "$response" ]; then
    echo -e "${GREEN}✅ Respuesta recibida${NC}"
    
    # Verificar estructura de respuesta
    if echo "$response" | grep -q "success"; then
        echo -e "${GREEN}✅ Estructura JSON válida${NC}"
        
        # Extraer datos si están disponibles
        if echo "$response" | grep -q "probability\|victoria"; then
            echo -e "${GREEN}✅ Contiene predicciones${NC}"
        fi
        
        # Mostrar respuesta parcial
        echo -e "${BLUE}📊 Muestra de respuesta:${NC}"
        echo "$response" | head -c 200
        echo "..."
    fi
else
    echo -e "${RED}❌ No se pudo obtener respuesta${NC}"
fi

# Resumen final
echo ""
echo "=================================="
echo -e "${BLUE}📋 RESUMEN DE PRUEBAS${NC}"
echo "=================================="

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "Total de pruebas: $TOTAL_TESTS"
echo "Pruebas exitosas: $PASSED_TESTS"
echo "Pruebas fallidas: $((TOTAL_TESTS - PASSED_TESTS))"
echo "Porcentaje éxito: $PERCENTAGE%"

echo ""
if [ $PERCENTAGE -ge 90 ]; then
    echo -e "${GREEN}🎉 ¡EXCELENTE! La aplicación está funcionando perfectamente${NC}"
    STATUS="EXCELENTE"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}✅ BUENO. La aplicación funciona con algunas limitaciones${NC}"
    STATUS="BUENO"
elif [ $PERCENTAGE -ge 50 ]; then
    echo -e "${YELLOW}⚠️ REGULAR. Algunas funcionalidades no están disponibles${NC}"
    STATUS="REGULAR"
else
    echo -e "${RED}❌ MALO. Hay problemas significativos${NC}"
    STATUS="MALO"
fi

echo ""
echo -e "${BLUE}🔗 ENLACES ÚTILES${NC}"
echo "================="
echo "🌐 Aplicación: http://localhost:3000"
echo "🔌 API Backend: http://localhost:3000/api/health"
if [ "$PYTHON_OK" = true ]; then
    echo "🐍 API Python: http://localhost:5000/api/health"
fi
echo "📊 Test API: curl http://localhost:3000/api/predict -X POST -H 'Content-Type: application/json' -d '{\"homeTeam\":\"Barcelona\",\"awayTeam\":\"Real Madrid\"}'"

# Sugerencias según el estado
echo ""
echo -e "${BLUE}💡 RECOMENDACIONES${NC}"
echo "=================="

if [ "$STATUS" = "EXCELENTE" ]; then
    echo "• La aplicación está lista para usar"
    echo "• Prueba diferentes equipos y ligas"
    echo "• Explora las predicciones avanzadas"
elif [ "$STATUS" = "BUENO" ]; then
    echo "• La funcionalidad básica está disponible"
    if [ "$PYTHON_OK" = false ]; then
        echo "• Considera iniciar el servicio Python para ML avanzado"
    fi
elif [ "$STATUS" = "REGULAR" ]; then
    echo "• Revisa los logs: logs/node.log y logs/python.log"
    echo "• Verifica que los puertos 3000 y 5000 estén libres"
    echo "• Reinstala dependencias si es necesario"
else
    echo "• Detén y reinicia todos los servicios"
    echo "• Ejecuta ./launch_app.sh desde el directorio raíz"
    echo "• Verifica que Node.js y Python estén instalados"
fi

echo ""
echo -e "${GREEN}✨ ¡Pruebas completadas!${NC}"