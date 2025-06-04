#!/bin/bash

echo "🌐 INICIANDO BACKEND NODE.JS"
echo "============================"

cd backend

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js 16+ desde: https://nodejs.org"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "⚠️ Se recomienda Node.js 16+, tienes $(node -v)"
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias de Node.js..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar dependencias"
        exit 1
    fi
else
    echo "✅ Dependencias ya instaladas"
fi

# Verificar que el servicio Python esté corriendo
echo "🔍 Verificando servicio Python..."
for i in {1..10}; do
    curl -s http://localhost:5000/api/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Servicio Python detectado en puerto 5000"
        PYTHON_STATUS="online"
        break
    else
        if [ $i -eq 1 ]; then
            echo "⚠️ Servicio Python no detectado, esperando..."
        fi
        sleep 2
    fi
done

if [ "$PYTHON_STATUS" != "online" ]; then
    echo "❌ Servicio Python no está corriendo en puerto 5000"
    echo "Por favor inicia primero: ./start_python.sh en otra terminal"
    echo ""
    echo "🔧 MODO SOLO NODE.JS (sin ML avanzado)"
    echo "======================================"
    echo "Continuando con modelo básico solamente..."
fi

# Verificar archivos críticos
CRITICAL_FILES=("app.js" "routes/api.js" "controllers/predictionController.js")
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Archivo crítico faltante: $file"
        exit 1
    fi
done

echo "✅ Archivos críticos verificados"

# Mostrar configuración
echo ""
echo "⚙️ CONFIGURACIÓN"
echo "==============="
echo "Puerto: ${PORT:-3000}"
echo "Entorno: ${NODE_ENV:-development}"
echo "Python Service: ${PYTHON_SERVICE_URL:-http://localhost:5000}"

# Verificar puerto disponible
PORT_TO_CHECK=${PORT:-3000}
if lsof -i :$PORT_TO_CHECK > /dev/null 2>&1; then
    echo "⚠️ Puerto $PORT_TO_CHECK ya está en uso"
    echo "Busca procesos con: lsof -i :$PORT_TO_CHECK"
    echo "Termina procesos con: kill -9 <PID>"
    exit 1
fi

echo ""
echo "🚀 Iniciando servidor Node.js..."
echo "================================"
echo "📱 Interfaz: http://localhost:${PORT:-3000}"
echo "🔌 API: http://localhost:${PORT:-3000}/api"
echo "📊 Estado: http://localhost:${PORT:-3000}/api/health"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

# Iniciar el servidor
if [ -f "server-simple.js" ]; then
    echo "🎯 Usando servidor simplificado..."
    node server-simple.js
elif [ -f "app.js" ]; then
    echo "🎯 Usando servidor completo..."
    node app.js
else
    echo "❌ No se encontró archivo de servidor"
    exit 1
fi