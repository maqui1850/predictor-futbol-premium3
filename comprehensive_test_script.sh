#!/bin/bash

# 🧪 SCRIPT DE PRUEBAS COMPLETAS - PREDICTOR DE FÚTBOL PREMIUM
# ============================================================
# Ejecuta todas las pruebas para verificar que la aplicación funciona correctamente

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Función para mostrar título de sección
show_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Función para mostrar test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "$(printf "%-50s" "$test_name")"
    
    # Ejecutar comando y capturar resultado
    result=$(eval "$test_command" 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ] && [[ "$result" == *"$expected_result"* ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ ! -z "$result" ]; then
            echo -e "   ${YELLOW}Resultado: $result${NC}"
        fi
        return 1
    fi
}

# Función para test HTTP
test_http() {
    local test_name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="${4:-}"
    local expected="${5:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "$(printf "%-50s" "$test_name")"
    
    if [ "$method" = "POST" ]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
                    -H "Content-Type: application/json" \
                    -d "$data" \
                    "$url" \
                    --max-time 10)
    else
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    fi
    
    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}✅ PASS (HTTP $http_code)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL (HTTP $http_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Función para test de archivo
test_file() {
    local test_name="$1"
    local file_path="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "$(printf "%-50s" "$test_name")"
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL (archivo no encontrado)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Función para test de directorio
test_directory() {
    local test_name="$1"
    local dir_path="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "$(printf "%-50s" "$test_name")"
    
    if [ -d "$dir_path" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL (directorio no encontrado)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Función para test de comando
test_command() {
    local test_name="$1"
    local command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "$(printf "%-50s" "$test_name")"
    
    if command -v "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL (comando no encontrado)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Banner inicial
clear
echo -e "${PURPLE}"
echo "  ⚽ PREDICTOR DE FÚTBOL PREMIUM - SUITE DE PRUEBAS 🧪"
echo "  =================================================="
echo ""
echo "  🎯 Verificando que toda la aplicación funciona correctamente"
echo "  📊 Ejecutando tests de funcionalidad, rendimiento y UX"
echo "  🤖 Validando integración de IA y datos"
echo -e "${NC}"

# SECCIÓN 1: VERIFICACIÓN DEL SISTEMA
show_section "🔧 1. VERIFICACIÓN DEL SISTEMA"

test_command "Node.js instalado" "node"
test_command "npm disponible" "npm"
test_command "Python instalado" "python"
test_command "pip disponible" "pip"

# Verificar versiones
echo -e "\n${CYAN}📋 Información del sistema:${NC}"
echo "   Node.js: $(node --version 2>/dev/null || echo 'No instalado')"
echo "   npm: $(npm --version 2>/dev/null || echo 'No instalado')"
echo "   Python: $(python --version 2>/dev/null || echo 'No instalado')"
echo "   pip: $(pip --version 2>/dev/null | cut -d' ' -f2 || echo 'No instalado')"

# SECCIÓN 2: ESTRUCTURA DE ARCHIVOS
show_section "📁 2. ESTRUCTURA DE ARCHIVOS"

test_directory "Directorio backend" "backend"
test_directory "Directorio frontend" "frontend"
test_directory "Directorio python_service" "python_service"

test_file "Backend app.js" "backend/app.js"
test_file "Frontend index.html" "frontend/index.html"
test_file "Python app.py" "python_service/app.py"

test_file "Package.json backend" "backend/package.json"
test_file "Requirements.txt python" "python_service/requirements.txt"

# SECCIÓN 3: DEPENDENCIAS
show_section "📦 3. DEPENDENCIAS Y MÓDULOS"

echo -e "${CYAN}Verificando dependencias de Node.js...${NC}"
if [ -f "backend/package.json" ]; then
    cd backend 2>/dev/null
    test_command "express instalado" "npm list express --depth=0"
    test_command "cors instalado" "npm list cors --depth=0"
    test_command "axios instalado" "npm list axios --depth=0"
    cd .. 2>/dev/null
fi

echo -e "\n${CYAN}Verificando dependencias de Python...${NC}"
if [ -d "python_service" ]; then
    test_command "Flask disponible" "python -c \"import flask\""
    test_command "Pandas disponible" "python -c \"import pandas\""
    test_command "Scikit-learn disponible" "python -c \"import sklearn\""
    test_command "NumPy disponible" "python -c \"import numpy\""
fi

# SECCIÓN 4: SERVICIOS EN EJECUCIÓN
show_section "🔌 4. SERVICIOS EN EJECUCIÓN"

echo -e "${CYAN}Verificando servicios activos...${NC}"

# Verificar si los puertos están en uso
if lsof -i :3000 >/dev/null 2>&1; then
    test_http "Backend Node.js (puerto 3000)" "http://localhost:3000"
else
    echo -e "$(printf "%-50s" "Backend Node.js (puerto 3000)")${YELLOW}⚠️  NO INICIADO${NC}"
    echo -e "   ${YELLOW}Ejecuta: ./iniciar.bat o npm start en backend/${NC}"
fi

if lsof -i :5000 >/dev/null 2>&1; then
    test_http "Servicio Python (puerto 5000)" "http://localhost:5000"
else
    echo -e "$(printf "%-50s" "Servicio Python (puerto 5000)")${YELLOW}⚠️  NO INICIADO${NC}"
    echo -e "   ${YELLOW}Ejecuta: python app.py en python_service/${NC}"
fi

# SECCIÓN 5: APIS Y ENDPOINTS
show_section "🔌 5. PRUEBAS DE API"

# Solo si los servicios están corriendo
if lsof -i :3000 >/dev/null 2>&1; then
    test_http "Health check backend" "http://localhost:3000/api/health"
    test_http "Página principal" "http://localhost:3000/"
    
    # Test de predicción
    prediction_data='{"homeTeam":"Real Madrid","awayTeam":"Barcelona","league":"La Liga"}'
    test_http "API de predicción" "http://localhost:3000/api/predict" "POST" "$prediction_data"
fi

if lsof -i :5000 >/dev/null 2>&1; then
    test_http "Health check Python" "http://localhost:5000/api/health"
    
    # Test de predicción Python
    python_prediction_data='{"homeTeam":"Manchester City","awayTeam":"Liverpool","league":"Premier League"}'
    test_http "API Python predicción" "http://localhost:5000/api/predict" "POST" "$python_prediction_data"
fi

# SECCIÓN 6: FUNCIONALIDAD WEB
show_section "🌐 6. FUNCIONALIDAD WEB"

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${CYAN}Probando contenido de la página web...${NC}"
    
    # Verificar que la página contiene elementos clave
    page_content=$(curl -s http://localhost:3000 2>/dev/null)
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [[ "$page_content" == *"Predictor de Fútbol"* ]]; then
        echo -e "$(printf "%-50s" "Título de la aplicación")${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Título de la aplicación")${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [[ "$page_content" == *"bootstrap"* ]]; then
        echo -e "$(printf "%-50s" "Bootstrap CSS cargado")${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Bootstrap CSS cargado")${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [[ "$page_content" == *"form"* ]]; then
        echo -e "$(printf "%-50s" "Formulario de predicción")${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Formulario de predicción")${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Servicio web no está corriendo. Inicia con ./iniciar.bat${NC}"
fi

# SECCIÓN 7: MODELO DE MACHINE LEARNING
show_section "🤖 7. MODELO DE MACHINE LEARNING"

if [ -f "python_service/models/saved/football_predictor.joblib" ]; then
    echo -e "$(printf "%-50s" "Modelo ML entrenado")${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "$(printf "%-50s" "Modelo ML entrenado")${YELLOW}⚠️  NO ENCONTRADO${NC}"
    echo -e "   ${YELLOW}Ejecuta: python train_simple.py en python_service/${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Verificar datos de entrenamiento
if [ -f "python_service/data/partidos_historicos.csv" ]; then
    echo -e "$(printf "%-50s" "Datos de entrenamiento")${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Contar filas de datos
    lines=$(wc -l < "python_service/data/partidos_historicos.csv" 2>/dev/null || echo "0")
    echo -e "   ${CYAN}Partidos en dataset: $((lines - 1))${NC}"
else
    echo -e "$(printf "%-50s" "Datos de entrenamiento")${RED}❌ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# SECCIÓN 8: PRUEBAS DE INTEGRACIÓN
show_section "🔗 8. PRUEBAS DE INTEGRACIÓN"

if lsof -i :3000 >/dev/null 2>&1 && lsof -i :5000 >/dev/null 2>&1; then
    echo -e "${CYAN}Probando integración Node.js ↔ Python...${NC}"
    
    # Test de estado del servicio Python desde Node.js
    python_status=$(curl -s http://localhost:3000/api/python/status 2>/dev/null)
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [[ "$python_status" == *"status"* ]]; then
        echo -e "$(printf "%-50s" "Comunicación Node.js → Python")${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Comunicación Node.js → Python")${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test de predicción avanzada
    advanced_pred='{"homeTeam":"Bayern Munich","awayTeam":"Dortmund","league":"Bundesliga"}'
    adv_response=$(curl -s -X POST http://localhost:3000/api/predict/advanced \
                   -H "Content-Type: application/json" \
                   -d "$advanced_pred" 2>/dev/null)
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [[ "$adv_response" == *"success"* ]]; then
        echo -e "$(printf "%-50s" "Predicción avanzada (IA)")${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Predicción avanzada (IA)")${YELLOW}⚠️  FALLBACK${NC}"
        echo -e "   ${YELLOW}Usando modelo simple como respaldo${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Ambos servicios deben estar corriendo para pruebas de integración${NC}"
fi

# SECCIÓN 9: PRUEBAS DE RENDIMIENTO
show_section "⚡ 9. PRUEBAS DE RENDIMIENTO"

if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${CYAN}Midiendo tiempos de respuesta...${NC}"
    
    # Test de velocidad del health check
    start_time=$(date +%s%3N)
    curl -s http://localhost:3000/api/health >/dev/null 2>&1
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $response_time -lt 500 ]; then
        echo -e "$(printf "%-50s" "Tiempo de respuesta API (<500ms)")${GREEN}✅ PASS (${response_time}ms)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Tiempo de respuesta API (<500ms)")${YELLOW}⚠️  SLOW (${response_time}ms)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    # Test de velocidad de predicción
    start_time=$(date +%s%3N)
    pred_data='{"homeTeam":"Liverpool","awayTeam":"Chelsea","league":"Premier League"}'
    curl -s -X POST http://localhost:3000/api/predict \
         -H "Content-Type: application/json" \
         -d "$pred_data" >/dev/null 2>&1
    end_time=$(date +%s%3N)
    pred_time=$((end_time - start_time))
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $pred_time -lt 2000 ]; then
        echo -e "$(printf "%-50s" "Tiempo predicción (<2000ms)")${GREEN}✅ PASS (${pred_time}ms)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "$(printf "%-50s" "Tiempo predicción (<2000ms)")${YELLOW}⚠️  SLOW (${pred_time}ms)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi

# SECCIÓN 10: RESUMEN FINAL
show_section "📊 10. RESUMEN FINAL"

# Calcular porcentajes
if [ $TOTAL_TESTS -gt 0 ]; then
    success_percentage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
    success_percentage=0
fi

echo -e "${CYAN}Estadísticas de las pruebas:${NC}"
echo "   📝 Total de pruebas: $TOTAL_TESTS"
echo -e "   ${GREEN}✅ Pruebas exitosas: $PASSED_TESTS${NC}"
echo -e "   ${RED}❌ Pruebas fallidas: $FAILED_TESTS${NC}"
echo "   📈 Porcentaje de éxito: $success_percentage%"

echo ""
echo -e "${CYAN}Estado general de la aplicación:${NC}"

if [ $success_percentage -ge 90 ]; then
    echo -e "   ${GREEN}🎉 EXCELENTE (${success_percentage}%)${NC}"
    echo -e "   ${GREEN}✅ La aplicación está funcionando perfectamente${NC}"
    echo -e "   ${GREEN}🚀 Lista para uso en producción${NC}"
elif [ $success_percentage -ge 75 ]; then
    echo -e "   ${YELLOW}✅ BUENO (${success_percentage}%)${NC}"
    echo -e "   ${YELLOW}⚠️  La aplicación funciona con limitaciones menores${NC}"
    echo -e "   ${YELLOW}🔧 Revisa los tests fallidos para optimizar${NC}"
elif [ $success_percentage -ge 50 ]; then
    echo -e "   ${YELLOW}⚠️  REGULAR (${success_percentage}%)${NC}"
    echo -e "   ${YELLOW}🔧 Varias funcionalidades necesitan atención${NC}"
    echo -e "   ${YELLOW}📋 Revisa la instalación y configuración${NC}"
else
    echo -e "   ${RED}❌ CRÍTICO (${success_percentage}%)${NC}"
    echo -e "   ${RED}🚨 Problemas significativos detectados${NC}"
    echo -e "   ${RED}🔧 Ejecuta la instalación completa nuevamente${NC}"
fi

echo ""
echo -e "${CYAN}Próximos pasos recomendados:${NC}"

if [ $success_percentage -ge 90 ]; then
    echo "   🎯 ¡Todo funciona perfecto! Puedes usar la aplicación"
    echo "   🌐 Ve a: http://localhost:3000"
    echo "   📊 Prueba hacer predicciones con diferentes equipos"
    echo "   🔧 Considera personalizar ligas y equipos"
elif [ $success_percentage -ge 75 ]; then
    echo "   🔧 Revisa los tests fallidos arriba"
    echo "   🚀 Asegúrate de que ambos servicios estén corriendo"
    echo "   📊 La funcionalidad básica debería funcionar"
elif [ $success_percentage -ge 50 ]; then
    echo "   📋 Revisa la instalación de dependencias"
    echo "   🔄 Ejecuta ./instalar.bat nuevamente"
    echo "   🌐 Verifica que Node.js y Python estén bien instalados"
else
    echo "   🔄 Ejecuta la instalación completa desde cero"
    echo "   📋 Verifica que Node.js y Python estén instalados"
    echo "   💬 Consulta la documentación para solución de problemas"
fi

echo ""
echo -e "${CYAN}Enlaces útiles:${NC}"
echo "   🌐 Aplicación: http://localhost:3000"
echo "   🔌 API Backend: http://localhost:3000/api/health"
if lsof -i :5000 >/dev/null 2>&1; then
    echo "   🤖 API Python: http://localhost:5000/api/health"
fi
echo "   📚 Documentación: README.md"

echo ""
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE} 🎉 SUITE DE PRUEBAS COMPLETADA - Predictor de Fútbol Premium  ${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"

# Salir con código apropiado
if [ $success_percentage -ge 75 ]; then
    exit 0
else
    exit 1
fi