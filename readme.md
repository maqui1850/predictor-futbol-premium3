# Predictor de Fútbol Premium

![Predictor de Fútbol Premium](https://via.placeholder.com/800x200?text=Predictor+de+F%C3%BAtbol+Premium)

## Descripción

Predictor de Fútbol Premium es una plataforma web que utiliza algoritmos avanzados de machine learning para generar predicciones precisas de resultados de partidos de fútbol. El sistema analiza miles de datos históricos y factores relevantes para ofrecer predicciones con diferentes niveles de confianza.

## Características Principales

- **Predicciones avanzadas**: Algoritmo de machine learning basado en Gradient Boosting
- **Análisis de múltiples factores**: Forma reciente, estadísticas head-to-head, factores meteorológicos, etc.
- **Diferentes niveles de suscripción**: Planes gratuito, básico y premium
- **Dashboard interactivo**: Visualización detallada de estadísticas y rendimiento
- **Sistema de usuarios completo**: Registro, inicio de sesión y gestión de perfiles
- **Interfaz moderna y responsiva**: Diseño adaptado a dispositivos móviles
- **API RESTful**: Integración sencilla con otros servicios

## Tecnologías Utilizadas

- **Backend**: Python, Flask, SQLite/PostgreSQL
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Visualización**: Chart.js
- **Otros**: Jinja2, Flask-Login, Flask-SQLAlchemy

## Estructura del Proyecto

```
predictor-futbol-premium/
├── data/                   # Datos históricos y de entrenamiento
├── models/                 # Modelos de predicción y evaluación
│   ├── predictor_model_v2.py
│   ├── model_evaluation.py
│   └── feature_engineering.py
├── web/                    # Aplicación web Flask
│   ├── app.py
│   ├── static/             # Archivos estáticos (CSS, JS)
│   └── templates/          # Plantillas HTML
├── notebooks/              # Jupyter notebooks para análisis
├── tests/                  # Pruebas unitarias y de integración
├── logs/                   # Archivos de registro
├── evaluations/            # Resultados de evaluación de modelos
├── requirements.txt        # Dependencias del proyecto
└── README.md               # Este archivo
```

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/maqui1850/predictor-futbol-premium3.git
   cd predictor-futbol-premium3
   ```

2. Crear y activar un entorno virtual:
   ```
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```

4. Inicializar la base de datos:
   ```
   cd web
   python
   >>> from app import app, db
   >>> with app.app_context():
   >>>     db.create_all()
   >>> exit()
   ```

5. Ejecutar la aplicación:
   ```
   python app.py
   ```

6. Abrir en el navegador: http://127.0.0.1:5000/

## Uso

### Generación de Predicciones

1. Navegar a la sección "Partidos"
2. Seleccionar un partido próximo
3. Hacer clic en "Realizar predicción"
4. Esperar a que el sistema genere la predicción basada en múltiples factores
5. Visualizar la predicción con sus probabilidades asociadas

### Dashboard Premium

Los usuarios con suscripción Premium tienen acceso a:

1. Dashboard interactivo con estadísticas detalladas
2. Análisis histórico de rendimiento
3. Métricas avanzadas por competición
4. Visualización de predicciones de alta confianza
5. Evolución temporal de la precisión

## API

El sistema ofrece una API RESTful con los siguientes endpoints:

- `GET /api/matches/upcoming` - Lista de próximos partidos
- `GET /api/match/{match_id}/prediction` - Obtener predicción para un partido específico
- `GET /api/user/predictions` - Obtener predicciones del usuario autenticado
- `GET /api/user/statistics` - Obtener estadísticas del usuario autenticado

## Planes de Suscripción

- **Free**: Predicciones básicas, historial limitado
- **Basic**: Predicciones estándar, estadísticas de rendimiento, historial completo
- **Premium**: Predicciones avanzadas, dashboard interactivo, análisis detallado, estadísticas premium

## Contribuir

1. Hacer fork del repositorio
2. Crear una rama para la nueva funcionalidad: `git checkout -b feature/nueva-funcionalidad`
3. Realizar los cambios y hacer commit: `git commit -m 'Añadir nueva funcionalidad'`
4. Hacer push a la rama: `git push origin feature/nueva-funcionalidad`
5. Enviar un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver archivo LICENSE para más detalles.

## Contacto

- **Desarrollador**: Maqui1850
- **GitHub**: https://github.com/maqui1850
- **Email**: maqui1850@example.com

---

© 2025 Predictor de Fútbol Premium
