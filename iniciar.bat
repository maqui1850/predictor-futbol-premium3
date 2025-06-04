@echo off
title Predictor de Futbol Premium
color 0A

echo.
echo  ⚽ PREDICTOR DE FUTBOL PREMIUM 🤖
echo  ================================
echo.
echo  🚀 Iniciando aplicacion...
echo.

echo 🌐 Iniciando servidor backend...
cd backend
start "Backend Node.js" cmd /k "node app.js"

timeout /t 3 /nobreak >nul

echo 🤖 Iniciando servicio de IA...
cd ../python_service
start "Python IA Service" cmd /k "python app.py"

echo.
echo ✅ Servicios iniciados!
echo.
echo 🌐 Abre tu navegador en: http://localhost:3000
echo 📱 Para detener: cierra las ventanas que se abrieron
echo.
pause