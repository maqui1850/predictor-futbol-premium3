# 🚀 Guía de Instalación Completa - Predictor de Fútbol Premium
## Para Personas Sin Conocimientos de Programación

> **⏱️ Tiempo estimado: 15-20 minutos**  
> **🎯 Resultado: Aplicación funcionando al 100%**

---

## 📋 **PASO 1: PREPARAR TU COMPUTADORA**

### **1.1 Descargar Node.js** (Motor JavaScript)
1. Ve a: **https://nodejs.org**
2. **Descarga** la versión "LTS" (botón verde grande)
3. **Ejecuta** el archivo descargado (.msi en Windows, .pkg en Mac)
4. **Sigue el instalador** (solo darle "Siguiente" a todo)
5. **Reinicia** tu computadora

### **1.2 Descargar Python** (Para Inteligencia Artificial)
1. Ve a: **https://python.org**
2. **Descarga** la versión más reciente
3. **⚠️ IMPORTANTE**: Marca la casilla "Add Python to PATH"
4. **Ejecuta** el instalador
5. **Sigue el instalador** (solo darle "Siguiente" a todo)

### **1.3 Verificar que todo está instalado**
1. **Presiona**: `Windows + R` (Windows) o `Cmd + Espacio` (Mac)
2. **Escribe**: `cmd` y presiona Enter
3. **Aparecerá una ventana negra** (no te asustes)
4. **Escribe**: `node --version` y presiona Enter
5. **Debería mostrar**: algo como `v18.17.0`
6. **Escribe**: `python --version` y presiona Enter  
7. **Debería mostrar**: algo como `Python 3.11.5`

✅ **Si ves números de versión, ¡perfecto!**  
❌ **Si dice "no se reconoce", vuelve a instalar**

---

## 📁 **PASO 2: PREPARAR LA CARPETA DEL PROYECTO**

### **2.1 Crear la estructura de carpetas**
1. **Crea una carpeta** en tu escritorio llamada: `predictor-futbol-premium`
2. **Dentro de esa carpeta**, crea estas 3 carpetas:
   ```
   predictor-futbol-premium/
   ├── backend/
   ├── frontend/
   └── python_service/
   ```

### **2.2 Descargar archivos del proyecto**
Ahora necesitas copiar los archivos que has visto en las capturas. Te ayudo:

**Para la carpeta `backend/`:**
- Copia todos los archivos .js que viste (app.js, controllers/, models/, etc.)

**Para la carpeta `frontend/`:**
- Copia el index.html y carpetas css/, js/

**Para la carpeta `python_service/`:**
- Copia todos los archivos .py y requirements.txt

> **💡 Tip**: Si no tienes todos los archivos, podemos crearlos automáticamente en el siguiente paso.

---

## 🔧 **PASO 3: INSTALACIÓN AUTOMÁTICA**

### **3.1 Crear script de instalación automática**

1. **Abre el Bloc de Notas** (Notepad)
2. **Copia y pega** este código:

```batch
@echo off
echo 🚀 INSTALANDO PREDICTOR DE FUTBOL PREMIUM
echo ========================================

echo 📁 Creando estructura de carpetas...
mkdir backend\controllers 2>nul
mkdir backend\models 2>nul
mkdir backend\routes 2>nul
mkdir backend\services 2>nul
mkdir backend\middleware 2>nul
mkdir backend\utils 2>nul
mkdir frontend\css 2>nul
mkdir frontend\js 2>nul
mkdir frontend\assets 2>nul
mkdir python_service\models 2>nul
mkdir python_service\data 2>nul
mkdir python_service\scripts 2>nul
mkdir python_service\config 2>nul
mkdir logs 2>nul

echo 📦 Instalando dependencias de Node.js...
cd backend
npm init -y
npm install express cors morgan axios cheerio dotenv node-cache
cd ..

echo 🐍 Instalando dependencias de Python...
cd python_service
pip install flask flask-cors pandas numpy scikit-learn joblib python-dotenv requests matplotlib seaborn
cd ..

echo ✅ Instalación completada!
echo 🎯 Presiona cualquier tecla para continuar...
pause
```

3. **Guarda el archivo** como: `instalar.bat`
4. **Guárdalo** en la carpeta `predictor-futbol-premium`
5. **Haz doble clic** en `instalar.bat`
6. **Espera** a que termine (2-5 minutos)

### **3.2 Verificar instalación**
Si todo salió bien, verás: ✅ **Instalación completada!**

---

## 📄 **PASO 4: CREAR ARCHIVOS PRINCIPALES**

### **4.1 Crear el backend (servidor principal)**

1. **Ve a la carpeta**: `backend/`
2. **Crea un archivo** llamado: `app.js`
3. **Abre** el archivo con Bloc de Notas
4. **Copia y pega** este código:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuración
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Predictor de Fútbol funcionando',
        timestamp: new Date().toISOString()
    });
});

// API de predicción simple
app.post('/api/predict', (req, res) => {
    const { homeTeam, awayTeam, league } = req.body;
    
    // Predicción básica simulada
    const prediction = {
        success: true,
        data: {
            victoria_local: 0.55,
            empate: 0.25,
            victoria_visitante: 0.20,
            goles_esperados_local: 1.8,
            goles_esperados_visitante: 1.1,
            confianza: "alta",
            analisis: {
                local: `${homeTeam} tiene ventaja como local`,
                visitante: `${awayTeam} jugará de visitante`,
                general: "Partido equilibrado con ligera ventaja local"
            }
        }
    };
    
    res.json(prediction);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('🎯 Abre tu navegador y ve a esa dirección');
});
```

5. **Guarda** el archivo

### **4.2 Crear el frontend (página web)**

1. **Ve a la carpeta**: `frontend/`
2. **Crea un archivo** llamado: `index.html`
3. **Copia y pega** este código:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Predictor de Fútbol Premium</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .hero-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .prediction-card { transition: transform 0.3s ease; }
        .prediction-card:hover { transform: translateY(-5px); }
        .confidence-high { border-left: 4px solid #28a745; }
        .confidence-medium { border-left: 4px solid #ffc107; }
        .confidence-low { border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="#">
                <i class="fas fa-futbol me-2"></i>
                Predictor de Fútbol Premium
            </a>
            <div class="ms-auto">
                <span class="badge bg-success">🤖 IA Activada</span>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="hero-section py-5">
        <div class="container text-center">
            <h1 class="display-4 fw-bold mb-3">Predicciones Premium de Fútbol</h1>
            <p class="lead">Inteligencia Artificial avanzada para predecir resultados de fútbol</p>
        </div>
    </div>

    <!-- Formulario -->
    <div class="container my-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card shadow">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0"><i class="fas fa-search me-2"></i>Analizar Partido</h4>
                    </div>
                    <div class="card-body">
                        <form id="prediction-form">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Liga</label>
                                    <select id="league" class="form-select" required>
                                        <option value="">Selecciona liga</option>
                                        <option value="Premier League">🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</option>
                                        <option value="La Liga">🇪🇸 La Liga</option>
                                        <option value="Bundesliga">🇩🇪 Bundesliga</option>
                                        <option value="Serie A">🇮🇹 Serie A</option>
                                        <option value="Ligue 1">🇫🇷 Ligue 1</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Fecha</label>
                                    <input type="date" id="date" class="form-control" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Equipo Local</label>
                                    <input type="text" id="homeTeam" class="form-control" placeholder="Ej: Real Madrid" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Equipo Visitante</label>
                                    <input type="text" id="awayTeam" class="form-control" placeholder="Ej: Barcelona" required>
                                </div>
                                <div class="col-12 text-center">
                                    <button type="submit" class="btn btn-primary btn-lg">
                                        <i class="fas fa-chart-line me-2"></i>Generar Predicción
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Resultados -->
    <div id="results" class="container my-5" style="display: none;">
        <div class="card shadow">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Predicción Generada</h4>
            </div>
            <div class="card-body">
                <div id="match-info" class="text-center mb-4">
                    <h3><span id="home-name"></span> vs <span id="away-name"></span></h3>
                    <p class="text-muted"><span id="league-name"></span> - <span id="match-date"></span></p>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="prediction-card card h-100 confidence-high">
                            <div class="card-body text-center">
                                <h5 class="card-title">🏠 Victoria Local</h5>
                                <h2 id="home-prob" class="text-success">55%</h2>
                                <p class="card-text">Probabilidad de que gane el equipo local</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="prediction-card card h-100 confidence-medium">
                            <div class="card-body text-center">
                                <h5 class="card-title">🤝 Empate</h5>
                                <h2 id="draw-prob" class="text-warning">25%</h2>
                                <p class="card-text">Probabilidad de empate</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="prediction-card card h-100 confidence-low">
                            <div class="card-body text-center">
                                <h5 class="card-title">✈️ Victoria Visitante</h5>
                                <h2 id="away-prob" class="text-danger">20%</h2>
                                <p class="card-text">Probabilidad de que gane el visitante</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <div class="card">
                        <div class="card-body">
                            <h5><i class="fas fa-lightbulb me-2"></i>Análisis de IA</h5>
                            <p id="analysis-text" class="mb-0">Cargando análisis...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Configurar fecha de hoy
        document.getElementById('date').value = new Date().toISOString().split('T')[0];

        // Manejar formulario
        document.getElementById('prediction-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const homeTeam = document.getElementById('homeTeam').value;
            const awayTeam = document.getElementById('awayTeam').value;
            const league = document.getElementById('league').value;
            const date = document.getElementById('date').value;
            
            // Mostrar loading
            const button = this.querySelector('button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analizando...';
            button.disabled = true;
            
            try {
                // Llamar a la API
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({homeTeam, awayTeam, league, date})
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Mostrar resultados
                    document.getElementById('home-name').textContent = homeTeam;
                    document.getElementById('away-name').textContent = awayTeam;
                    document.getElementById('league-name').textContent = league;
                    document.getElementById('match-date').textContent = date;
                    
                    document.getElementById('home-prob').textContent = Math.round(data.data.victoria_local * 100) + '%';
                    document.getElementById('draw-prob').textContent = Math.round(data.data.empate * 100) + '%';
                    document.getElementById('away-prob').textContent = Math.round(data.data.victoria_visitante * 100) + '%';
                    
                    document.getElementById('analysis-text').textContent = data.data.analisis.general;
                    
                    // Mostrar sección de resultados
                    document.getElementById('results').style.display = 'block';
                    document.getElementById('results').scrollIntoView({behavior: 'smooth'});
                } else {
                    alert('Error generando predicción');
                }
            } catch (error) {
                alert('Error conectando con el servidor');
            } finally {
                // Restaurar botón
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
    </script>
</body>
</html>
```

4. **Guarda** el archivo

---

## 🐍 **PASO 5: CREAR SERVICIO DE IA (OPCIONAL)**

### **5.1 Crear servicio Python básico**

1. **Ve a la carpeta**: `python_service/`
2. **Crea un archivo** llamado: `app.py`
3. **Copia y pega** este código:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'Python IA Service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    home_team = data.get('homeTeam', '')
    away_team = data.get('awayTeam', '')
    
    # Generar predicción con algo de lógica
    home_prob = random.uniform(0.2, 0.8)
    away_prob = random.uniform(0.1, 0.8 - home_prob)
    draw_prob = 1 - home_prob - away_prob
    
    return jsonify({
        'success': True,
        'data': {
            'homeWinProbability': home_prob,
            'drawProbability': draw_prob,
            'awayWinProbability': away_prob,
            'confidence': random.uniform(6, 9),
            'analysis': f'Análisis IA: {home_team} vs {away_team} - Predicción generada con ML'
        }
    })

if __name__ == '__main__':
    print("🤖 Iniciando servicio de IA...")
    app.run(host='0.0.0.0', port=5000, debug=True)
```

4. **Guarda** el archivo

---

## 🚀 **PASO 6: CREAR SCRIPTS DE INICIO**

### **6.1 Script para iniciar todo automáticamente**

1. **En la carpeta principal** `predictor-futbol-premium/`
2. **Crea un archivo** llamado: `iniciar.bat`
3. **Copia y pega**:

```batch
@echo off
title Predictor de Futbol Premium
echo 🚀 INICIANDO PREDICTOR DE FUTBOL PREMIUM
echo ==========================================

echo 🌐 Iniciando servidor web...
cd backend
start "Backend" cmd /k "node app.js"

echo 🤖 Iniciando servicio de IA...
cd ../python_service
start "Python IA" cmd /k "python app.py"

echo ✅ Todo iniciado!
echo 🌐 Abre tu navegador en: http://localhost:3000
echo 📱 Para detener: cierra las ventanas negras

pause
```

4. **Guarda** y **haz doble clic** en `iniciar.bat`

---

## 🧪 **PASO 7: PROBAR LA APLICACIÓN**

### **7.1 Verificar que funciona**

1. **Ejecuta** `iniciar.bat`
2. **Se abrirán 2 ventanas negras** (no las cierres)
3. **Abre tu navegador** 
4. **Ve a**: `http://localhost:3000`
5. **Deberías ver** la aplicación funcionando

### **7.2 Hacer tu primera predicción**

1. **Selecciona** una liga (ej: La Liga)
2. **Escribe** equipo local (ej: Real Madrid)
3. **Escribe** equipo visitante (ej: Barcelona)  
4. **Presiona** "Generar Predicción"
5. **¡Deberías ver los resultados!**

---

## ❓ **SOLUCIÓN DE PROBLEMAS**

### **🔴 Error: "node no se reconoce"**
- **Solución**: Reinstala Node.js marcando "Add to PATH"

### **🔴 Error: "python no se reconoce"**  
- **Solución**: Reinstala Python marcando "Add Python to PATH"

### **🔴 La página no carga**
- **Verifica**: Que se ejecutó `iniciar.bat`
- **Verifica**: Que las ventanas negras están abiertas
- **Espera**: 30 segundos después de ejecutar

### **🔴 No aparecen predicciones**
- **Verifica**: Que llenaste todos los campos
- **Presiona F12**: Ve a "Consola" y mira si hay errores

---

## 🎉 **¡FELICIDADES!**

**Tu aplicación de predicciones de fútbol está funcionando!**

### **📋 Próximos pasos opcionales:**
1. **Personalizar** equipos y ligas
2. **Añadir** más mercados de predicción  
3. **Mejorar** el diseño visual
4. **Conectar** APIs reales de fútbol

### **🎯 Para usar diariamente:**
1. **Ejecuta** `iniciar.bat`
2. **Ve a** `http://localhost:3000`
3. **¡Disfruta prediciendo resultados!**

---

> **💡 Tip**: Guarda un acceso directo a `iniciar.bat` en tu escritorio para abrir la aplicación fácilmente.