# Predictor de Fútbol Premium

![Predictor de Fútbol Premium](https://via.placeholder.com/800x200?text=Predictor+de+F%C3%BAtbol+Premium)

## Descripción

Predictor de Fútbol Premium es una plataforma web que utiliza algoritmos avanzados de machine learning para generar predicciones precisas de resultados de partidos de fútbol. El sistema analiza miles de datos históricos y factores relevantes para ofrecer predicciones con diferentes niveles de confianza.

## Características Principales

- **Arquitectura híbrida**: Sistema dual Node.js + Python para combinar velocidad y precisión
- **Predicciones avanzadas**: Algoritmo de machine learning basado en Gradient Boosting
- **Análisis de múltiples factores**: Forma reciente, estadísticas head-to-head, factores meteorológicos, etc.
- **Predicciones multimercado**: 1X2, BTTS, Over/Under, xG, hándicap asiático, córners
- **Niveles de confianza**: Indicador de fiabilidad para cada predicción (escala 1-10)
- **Sistema de fallback**: Modelo alternativo cuando el servicio ML no está disponible
- **Dashboard interactivo**: Visualización detallada de estadísticas y rendimiento
- **Interfaz moderna y responsiva**: Diseño adaptado a dispositivos móviles
- **API RESTful**: Integración sencilla con otros servicios

## Tecnologías Utilizadas

- **Backend Principal**: Node.js, Express, Axios
- **Servicio ML**: Python, Flask, Scikit-learn, Pandas, NumPy
- **Base de datos**: SQLite (desarrollo), PostgreSQL (producción)
- **Cache**: In-memory (desarrollo), Redis (producción)
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Visualización**: Chart.js
- **Despliegue**: Docker, Gunicorn, Nginx