#!/bin/bash

echo "🐍 INICIANDO SERVICIO PYTHON ML"
echo "==============================="

cd python_service

# Verificar que existan los datos
if [ ! -f "data/partidos_historicos.csv" ]; then
    echo "❌ No se encontraron datos de entrenamiento"
    echo "Por favor ejecuta primero: ./quick_start.sh"
    exit 1
fi

# Entrenar el modelo si no existe
if [ ! -f "models/saved/football_predictor.joblib" ]; then
    echo "🤖 Entrenando modelo de Machine Learning..."
    echo "Esto tomará 1-2 minutos..."
    python train_simple.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Modelo entrenado exitosamente"
    else
        echo "❌ Error al entrenar el modelo"
        exit 1
    fi
else
    echo "✅ Modelo ya entrenado, omitiendo entrenamiento"
fi

# Verificar dependencias críticas
echo "🔍 Verificando dependencias..."
python -c "import pandas, numpy, sklearn, joblib, flask" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Todas las dependencias están instaladas"
else
    echo "⚠️ Instalando dependencias faltantes..."
    pip install pandas numpy scikit-learn joblib flask flask-cors python-dotenv
fi

# Mostrar información del modelo
if [ -f "models/saved/football_predictor.joblib" ]; then
    echo ""
    echo "📊 INFORMACIÓN DEL MODELO"
    echo "========================"
    python -c "
import joblib
import os
if os.path.exists('models/saved/football_predictor.joblib'):
    model_data = joblib.load('models/saved/football_predictor.joblib')
    print(f'✅ Modelo cargado correctamente')
    print(f'📈 Precision: {model_data[\"metrics\"][\"accuracy\"]:.1%}')
    print(f'🎯 Features: {len(model_data[\"feature_names\"])}')
    print(f'🏆 Equipos conocidos: {len(model_data[\"home_encoder\"].classes_)}')
else:
    print('❌ Modelo no encontrado')
"
fi

echo ""
echo "🚀 Iniciando servidor Flask en puerto 5000..."
echo "Presiona Ctrl+C para detener"
echo ""

# Iniciar el servidor Flask
python api.py