# Guía de Usuario: Cómo Funciona el Predictor de Fútbol Premium

Esta guía explica de manera sencilla cómo funciona el sistema de predicciones y cómo interpretar los resultados, sin necesidad de conocimientos técnicos.

## ¿Qué hace el Predictor de Fútbol Premium?

El Predictor de Fútbol Premium analiza datos de partidos de fútbol para generar predicciones sobre diferentes aspectos del juego. Utiliza estadísticas reales, resultados históricos y algoritmos matemáticos para calcular las probabilidades de diferentes eventos en un partido.

## Fuentes de Datos

El sistema obtiene información de dos fuentes principales:

1. **API-Football**: Una fuente oficial que proporciona datos precisos y estructurados sobre equipos, ligas y partidos.
2. **Web Scraping**: El sistema también extrae información adicional de sitios web especializados para complementar los datos oficiales.

Puedes alternar entre estas fuentes usando el interruptor "API/Scraping" en la parte superior de la aplicación.

## Cómo Usar el Predictor

### Paso 1: Seleccionar una Liga
Elige la competición que te interesa del menú desplegable. El sistema cargará automáticamente todos los equipos de esa liga.

### Paso 2: Seleccionar Fecha
Elige la fecha del partido que quieres analizar. Por defecto, se muestra la fecha actual.

### Paso 3: Seleccionar Equipos
Elige el equipo local y el equipo visitante de los menús desplegables.

### Paso 4: Analizar
Haz clic en "Analizar Partido" y el sistema procesará la información para generar predicciones.

## Tipos de Predicciones

El sistema genera seis tipos diferentes de predicciones:

### 1. Resultado 1X2
Predicciones sobre el resultado final del partido:
- **1**: Victoria del equipo local
- **X**: Empate
- **2**: Victoria del equipo visitante

### 2. BTTS (Ambos Equipos Marcan)
Predice si ambos equipos anotarán al menos un gol durante el partido:
- **Sí**: Ambos equipos marcarán
- **No**: Al menos uno de los equipos no marcará

### 3. Over/Under (Goles)
Predicciones sobre el número total de goles en el partido:
- **O1.5**: Más de 1.5 goles (2 o más)
- **U1.5**: Menos de 1.5 goles (0 o 1)
- **O2.5**: Más de 2.5 goles (3 o más)
- **U2.5**: Menos de 2.5 goles (0, 1 o 2)
- **O3.5**: Más de 3.5 goles (4 o más)
- **U3.5**: Menos de 3.5 goles (0, 1, 2 o 3)

### 4. Córners
Predicciones sobre el número total de saques de esquina:
- Varias líneas: 8.5, 9.5, 10.5 córners

### 5. Tarjetas
Predicciones sobre el número total de tarjetas en el partido:
- Varias líneas: 3.5, 4.5 tarjetas

### 6. Hándicap Asiático
Un sistema de apuestas que da ventaja o desventaja a un equipo para equilibrar las probabilidades:
- Por ejemplo: "-1.5" significa que el equipo local comienza con desventaja de 1.5 goles

## Cómo Interpretar los Resultados

Para cada predicción, el sistema muestra:

### Probabilidad
El porcentaje estimado de que ocurra un resultado específico. Por ejemplo, "70%" de probabilidad de victoria local.

### Cuota Implícita
La cuota teórica basada en la probabilidad calculada. Por ejemplo, una probabilidad del 50% equivale a una cuota de 2.00.

### Nivel de Confianza (0-10)
Una puntuación que indica cuánta confianza tiene el sistema en la predicción:
- **0-3.5**: Confianza muy baja (Rojo)
- **3.6-5.0**: Confianza baja (Naranja)
- **5.1-6.5**: Confianza media (Azul claro)
- **6.6-8.0**: Confianza alta (Azul)
- **8.1-10**: Confianza muy alta (Verde)

## Apuesta Recomendada

El sistema destaca automáticamente la predicción con mayor confianza entre todos los mercados analizados. Esta recomendación se muestra en un panel especial con:

- El mercado recomendado (Resultado, BTTS, etc.)
- La selección específica (1, O2.5, etc.)
- La cuota estimada
- El nivel de confianza
- Una categoría de confianza (Muy Alta, Alta, Media, Baja, Muy Baja)

## Consejos para Usuarios

1. **Presta atención al nivel de confianza**: Las predicciones con mayor confianza (verde) tienen mayor probabilidad de acertar.

2. **Compara ambas fuentes de datos**: Alterna entre API y Scraping para ver si las predicciones coinciden. Mayor coincidencia puede indicar mayor fiabilidad.

3. **Utiliza los gráficos**: Las visualizaciones pueden ayudarte a entender mejor la distribución de probabilidades.

4. **No te guíes solo por las cuotas**: Una cuota alta no siempre significa una buena apuesta. Combina la cuota con el nivel de confianza.

5. **Considera el contexto**: El sistema analiza datos históricos, pero factores como lesiones recientes o cambios de entrenador pueden no estar reflejados.

## Glosario de Términos

- **1X2**: Sistema de apuestas donde 1 = victoria local, X = empate, 2 = victoria visitante
- **BTTS**: Both Teams To Score (Ambos Equipos Marcan)
- **Over/Under**: Apuesta sobre si el total de goles será mayor o menor que un número
- **Hándicap Asiático**: Sistema que da ventaja o desventaja a un equipo
- **Cuota**: Multiplicador que indica cuánto se gana por cada unidad apostada
- **Probabilidad**: Porcentaje estimado de que ocurra un evento
- **Confianza**: Nivel de seguridad que el sistema tiene en su predicción

## Próximas Mejoras

En futuras actualizaciones, el sistema incluirá:
- Más ligas y competiciones internacionales
- Histórico de predicciones y aciertos
- Comparación con cuotas reales de casas de apuestas
- Análisis detallado de factores que influyen en cada predicción
- Personalización de ligas favoritas
- Tutoriales interactivos

## Recuerda

El Predictor de Fútbol Premium es una herramienta de análisis estadístico. Aunque utiliza algoritmos avanzados, el fútbol siempre tiene un componente impredecible. Usa estas predicciones como una guía informada, no como una garantía.
