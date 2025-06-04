// 🎯 COMPLETAR TODOS LOS MERCADOS DE PREDICCIÓN
// Pegar en consola del navegador (F12) para activar todas las pestañas

console.log("🚀 Activando todos los mercados de predicción...");

// Datos de ejemplo expandidos para mostrar todos los mercados
const fullPredictionData = {
    success: true,
    data: {
        // Resultado 1X2
        victoria_local: 0.55,
        empate: 0.25,
        victoria_visitante: 0.20,
        
        // BTTS (Both Teams To Score)
        btts: {
            yes: 0.68,
            no: 0.32,
            confidence: 7.2
        },
        
        // Over/Under Goles
        over_under: {
            "0.5": { over: 0.91, under: 0.09, confidence: 8.8 },
            "1.5": { over: 0.76, under: 0.24, confidence: 8.5 },
            "2.5": { over: 0.58, under: 0.42, confidence: 7.1 },
            "3.5": { over: 0.35, under: 0.65, confidence: 6.3 },
            "4.5": { over: 0.18, under: 0.82, confidence: 6.8 }
        },
        
        // Córners
        corners: {
            "8.5": { over: 0.62, under: 0.38, confidence: 6.5 },
            "9.5": { over: 0.54, under: 0.46, confidence: 6.2 },
            "10.5": { over: 0.45, under: 0.55, confidence: 6.0 },
            "11.5": { over: 0.36, under: 0.64, confidence: 5.8 }
        },
        
        // Tarjetas
        cards: {
            "2.5": { over: 0.71, under: 0.29, confidence: 7.4 },
            "3.5": { over: 0.56, under: 0.44, confidence: 6.9 },
            "4.5": { over: 0.38, under: 0.62, confidence: 6.1 },
            "5.5": { over: 0.24, under: 0.76, confidence: 6.7 }
        },
        
        // Hándicap Asiático
        handicap: {
            "-0.5": { home: 0.55, away: 0.45, confidence: 6.8 },
            "-1.0": { home: 0.41, away: 0.59, confidence: 6.2 },
            "-1.5": { home: 0.32, away: 0.68, confidence: 5.9 },
            "+0.5": { home: 0.75, away: 0.25, confidence: 7.5 }
        },
        
        // Datos adicionales
        goles_esperados_local: 1.8,
        goles_esperados_visitante: 1.1,
        total_goles_esperados: 2.9,
        confianza_general: 7.2
    }
};

// Función para renderizar BTTS
function renderBTTS() {
    const bttsContainer = document.getElementById('btts-predictions');
    if (!bttsContainer) return;
    
    const bttsData = fullPredictionData.data.btts;
    
    bttsContainer.innerHTML = `
        <div class="prediction-card">
            <div class="prediction-header">
                <h6>Ambos Equipos Marcan</h6>
                <span class="confidence-badge">Confianza: ${bttsData.confidence}/10</span>
            </div>
            <div class="prediction-bars">
                <div class="prediction-item">
                    <span class="label">Sí marcan ambos</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${bttsData.yes * 100}%"></div>
                    </div>
                    <span class="percentage">${(bttsData.yes * 100).toFixed(1)}%</span>
                    <span class="odds">Cuota: ${(1 / bttsData.yes).toFixed(2)}</span>
                </div>
                <div class="prediction-item">
                    <span class="label">No marcan ambos</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${bttsData.no * 100}%"></div>
                    </div>
                    <span class="percentage">${(bttsData.no * 100).toFixed(1)}%</span>
                    <span class="odds">Cuota: ${(1 / bttsData.no).toFixed(2)}</span>
                </div>
            </div>
            <div class="recommendation">
                <strong>Recomendación:</strong> ${bttsData.yes > 0.6 ? 'SÍ - Ambos equipos marcarán' : 'NO - Al menos un equipo no marcará'}
            </div>
        </div>
    `;
}

// Función para renderizar Over/Under
function renderOverUnder() {
    const container = document.getElementById('over-under-predictions');
    if (!container) return;
    
    const overUnderData = fullPredictionData.data.over_under;
    
    let html = '<div class="markets-grid">';
    
    Object.entries(overUnderData).forEach(([line, data]) => {
        const recommended = data.over > data.under ? 'OVER' : 'UNDER';
        const bestProb = Math.max(data.over, data.under);
        
        html += `
            <div class="market-card ${bestProb > 0.65 ? 'high-confidence' : ''}">
                <div class="market-header">
                    <h6>Goles ${line}</h6>
                    <span class="confidence">Conf: ${data.confidence}/10</span>
                </div>
                <div class="market-options">
                    <div class="option ${data.over > data.under ? 'recommended' : ''}">
                        <span class="option-label">Over ${line}</span>
                        <span class="probability">${(data.over * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.over).toFixed(2)}</span>
                    </div>
                    <div class="option ${data.under > data.over ? 'recommended' : ''}">
                        <span class="option-label">Under ${line}</span>
                        <span class="probability">${(data.under * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.under).toFixed(2)}</span>
                    </div>
                </div>
                ${bestProb > 0.65 ? `<div class="recommendation-tag">⭐ ${recommended} ${line}</div>` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Función para renderizar Córners
function renderCorners() {
    const container = document.getElementById('corners-predictions');
    if (!container) return;
    
    const cornersData = fullPredictionData.data.corners;
    
    let html = '<div class="corners-analysis"><h6>Análisis de Córners</h6>';
    html += '<div class="markets-grid">';
    
    Object.entries(cornersData).forEach(([line, data]) => {
        const recommended = data.over > data.under ? 'OVER' : 'UNDER';
        const bestProb = Math.max(data.over, data.under);
        
        html += `
            <div class="market-card">
                <div class="market-header">
                    <h6>Córners ${line}</h6>
                    <span class="confidence">Conf: ${data.confidence}/10</span>
                </div>
                <div class="market-options">
                    <div class="option ${data.over > data.under ? 'recommended' : ''}">
                        <span class="option-label">Over ${line}</span>
                        <span class="probability">${(data.over * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.over).toFixed(2)}</span>
                    </div>
                    <div class="option ${data.under > data.over ? 'recommended' : ''}">
                        <span class="option-label">Under ${line}</span>
                        <span class="probability">${(data.under * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.under).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Función para renderizar Tarjetas
function renderCards() {
    const container = document.getElementById('cards-predictions');
    if (!container) return;
    
    const cardsData = fullPredictionData.data.cards;
    
    let html = '<div class="cards-analysis"><h6>Análisis de Tarjetas</h6>';
    html += '<div class="markets-grid">';
    
    Object.entries(cardsData).forEach(([line, data]) => {
        const recommended = data.over > data.under ? 'OVER' : 'UNDER';
        
        html += `
            <div class="market-card">
                <div class="market-header">
                    <h6>Tarjetas ${line}</h6>
                    <span class="confidence">Conf: ${data.confidence}/10</span>
                </div>
                <div class="market-options">
                    <div class="option ${data.over > data.under ? 'recommended' : ''}">
                        <span class="option-label">Over ${line}</span>
                        <span class="probability">${(data.over * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.over).toFixed(2)}</span>
                    </div>
                    <div class="option ${data.under > data.over ? 'recommended' : ''}">
                        <span class="option-label">Under ${line}</span>
                        <span class="probability">${(data.under * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.under).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Función para renderizar Hándicap
function renderHandicap() {
    const container = document.getElementById('handicap-predictions');
    if (!container) return;
    
    const handicapData = fullPredictionData.data.handicap;
    
    let html = '<div class="handicap-analysis"><h6>Hándicap Asiático</h6>';
    html += '<div class="markets-grid">';
    
    Object.entries(handicapData).forEach(([line, data]) => {
        const isPositive = line.startsWith('+');
        const team = isPositive ? 'Visitante' : 'Local';
        
        html += `
            <div class="market-card">
                <div class="market-header">
                    <h6>Hándicap ${line}</h6>
                    <span class="confidence">Conf: ${data.confidence}/10</span>
                </div>
                <div class="market-options">
                    <div class="option ${data.home > data.away ? 'recommended' : ''}">
                        <span class="option-label">Bayern Munich ${line}</span>
                        <span class="probability">${(data.home * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.home).toFixed(2)}</span>
                    </div>
                    <div class="option ${data.away > data.home ? 'recommended' : ''}">
                        <span class="option-label">Borussia Dortmund ${line.replace('-', '+').replace('++', '+')}</span>
                        <span class="probability">${(data.away * 100).toFixed(1)}%</span>
                        <span class="odds">${(1 / data.away).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Añadir estilos CSS
const style = document.createElement('style');
style.textContent = `
    .markets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
    .market-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; background: white; }
    .market-card.high-confidence { border-color: #28a745; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1); }
    .market-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
    .market-header h6 { margin: 0; font-weight: 600; }
    .confidence { font-size: 11px; background: #007bff; color: white; padding: 2px 6px; border-radius: 4px; }
    .market-options { display: flex; flex-direction: column; gap: 8px; }
    .option { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-radius: 4px; background: #f8f9fa; }
    .option.recommended { background: #d4edda; border-left: 3px solid #28a745; }
    .option-label { font-weight: 500; }
    .probability { color: #007bff; font-weight: 600; }
    .odds { background: #6c757d; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .recommendation-tag { text-align: center; background: #ffc107; color: #212529; padding: 4px 8px; border-radius: 4px; font-weight: 600; margin-top: 8px; }
    .prediction-bars .prediction-item { display: flex; justify-content: space-between; align-items: center; margin: 8px 0; }
    .progress-bar { flex: 1; height: 8px; background: #e9ecef; border-radius: 4px; margin: 0 10px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #007bff, #0056b3); transition: width 0.3s ease; }
    .confidence-badge { background: #17a2b8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .recommendation { margin-top: 15px; padding: 10px; background: #e7f3ff; border-radius: 4px; font-size: 14px; }
`;
document.head.appendChild(style);

// Ejecutar todas las funciones
setTimeout(() => {
    renderBTTS();
    renderOverUnder();
    renderCorners();
    renderCards();
    renderHandicap();
    
    console.log("✅ Todos los mercados activados:");
    console.log("   🎯 Resultado 1X2");
    console.log("   ⚽ BTTS (Ambos equipos marcan)");
    console.log("   📊 Over/Under goles");
    console.log("   🚩 Córners");
    console.log("   🟨 Tarjetas");
    console.log("   ⚖️ Hándicap asiático");
}, 500);

console.log("🎉 ¡Mercados completos activados! Prueba las otras pestañas ahora.");