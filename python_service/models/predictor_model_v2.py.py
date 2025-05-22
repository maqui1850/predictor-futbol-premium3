# models/predictor_model_v2.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
import logging
from datetime import datetime

# Configuración del sistema de logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='logs/model_training.log'
)
logger = logging.getLogger('predictor_model_v2')

class PredictorFutbolPremium:
    """
    Modelo de predicción de resultados de fútbol con características premium.
    Versión 2.0: Incorpora nuevas características y modelos de ensemble mejorados.
    """
    
    def __init__(self, model_path=None):
        """
        Inicializa el modelo de predicción.
        
        Args:
            model_path (str, optional): Ruta al modelo guardado previamente. Default: None
        """
        self.model = None
        self.encoder = None
        self.scaler = None
        self.feature_names = None
        self.categorical_features = [
            'local_team', 'away_team', 'competition', 
            'local_formation', 'away_formation', 'weather_condition',
            'match_importance'
        ]
        self.numerical_features = [
            # Estadísticas de equipo local
            'local_form_points_last5', 'local_goals_scored_last5', 'local_goals_conceded_last5',
            'local_home_win_rate', 'local_possession_avg', 'local_shots_on_target_avg',
            'local_cards_avg', 'local_corners_avg', 'local_fouls_avg',
            # Estadísticas de equipo visitante
            'away_form_points_last5', 'away_goals_scored_last5', 'away_goals_conceded_last5',
            'away_away_win_rate', 'away_possession_avg', 'away_shots_on_target_avg',
            'away_cards_avg', 'away_corners_avg', 'away_fouls_avg',
            # Head-to-head
            'h2h_local_wins', 'h2h_away_wins', 'h2h_draws',
            'h2h_local_goals_avg', 'h2h_away_goals_avg',
            # Nuevas características premium
            'local_key_players_missing', 'away_key_players_missing',
            'local_days_since_last_match', 'away_days_since_last_match',
            'local_travel_distance', 'away_travel_distance',
            'local_season_goals_per_match', 'away_season_goals_per_match',
            'local_expected_goals_avg', 'away_expected_goals_avg',
            'local_expected_goals_against_avg', 'away_expected_goals_against_avg',
            'local_clean_sheets_ratio', 'away_clean_sheets_ratio',
            'temperature', 'humidity', 'wind_speed',
            'local_coach_experience', 'away_coach_experience'
        ]
        
        if model_path:
            self.load_model(model_path)
    
    def preprocess_data(self, X):
        """
        Realiza el preprocesamiento de los datos de entrada.
        
        Args:
            X (pandas.DataFrame): DataFrame con los datos a preprocesar
            
        Returns:
            pandas.DataFrame: Datos preprocesados
        """
        # Verificar que estén todas las columnas necesarias
        missing_cols = set(self.categorical_features + self.numerical_features) - set(X.columns)
        if missing_cols:
            logger.error(f"Faltan columnas en los datos: {missing_cols}")
            raise ValueError(f"Faltan columnas en los datos: {missing_cols}")
        
        # Preprocesamiento de datos
        X_processed = X.copy()
        
        # Manejo de valores nulos
        for col in self.numerical_features:
            if col in X_processed.columns:
                X_processed[col].fillna(X_processed[col].median(), inplace=True)
        
        for col in self.categorical_features:
            if col in X_processed.columns:
                X_processed[col].fillna('Unknown', inplace=True)
        
        # Creación de nuevas características
        X_processed['form_difference'] = X_processed['local_form_points_last5'] - X_processed['away_form_points_last5']
        X_processed['goal_diff_last5'] = (X_processed['local_goals_scored_last5'] - X_processed['local_goals_conceded_last5']) - \
                                        (X_processed['away_goals_scored_last5'] - X_processed['away_goals_conceded_last5'])
        X_processed['h2h_win_ratio_local'] = X_processed['h2h_local_wins'] / (X_processed['h2h_local_wins'] + X_processed['h2h_away_wins'] + X_processed['h2h_draws']).replace(0, 1)
        X_processed['expected_goals_diff'] = X_processed['local_expected_goals_avg'] - X_processed['away_expected_goals_avg']
        X_processed['expected_goals_against_diff'] = X_processed['away_expected_goals_against_avg'] - X_processed['local_expected_goals_against_avg']
        X_processed['fatigue_diff'] = X_processed['away_days_since_last_match'] - X_processed['local_days_since_last_match']
        X_processed['key_players_diff'] = X_processed['away_key_players_missing'] - X_processed['local_key_players_missing']
        
        # Actualizar la lista de características numéricas
        self.numerical_features.extend([
            'form_difference', 'goal_diff_last5', 'h2h_win_ratio_local', 
            'expected_goals_diff', 'expected_goals_against_diff',
            'fatigue_diff', 'key_players_diff'
        ])
        
        return X_processed

    def build_pipeline(self):
        """
        Construye el pipeline de preprocesamiento y modelado.
        
        Returns:
            sklearn.pipeline.Pipeline: Pipeline de preprocesamiento y modelo
        """
        # Preprocesadores
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        numerical_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])
        
        # Columnas para el preprocesamiento
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, self.numerical_features),
                ('cat', categorical_transformer, self.categorical_features)
            ]
        )
        
        # Modelo principal: Ensamble de RandomForest y GradientBoosting
        gb_model = GradientBoostingClassifier(
            n_estimators=200, 
            learning_rate=0.05,
            max_depth=5,
            random_state=42
        )
        
        # Pipeline completo
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', gb_model)
        ])
        
        return pipeline
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """
        Entrena el modelo con los datos proporcionados.
        
        Args:
            X (pandas.DataFrame): Datos de características
            y (pandas.Series): Etiquetas (resultados de partidos)
            test_size (float): Proporción de datos para test
            random_state (int): Semilla para reproducibilidad
            
        Returns:
            dict: Métricas de rendimiento del modelo
        """
        logger.info(f"Iniciando entrenamiento del modelo con {X.shape[0]} muestras")
        
        # Preprocesamiento de datos
        X_processed = self.preprocess_data(X)
        self.feature_names = X_processed.columns.tolist()
        
        # División en train/test
        X_train, X_test, y_train, y_test = train_test_split(
            X_processed, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        logger.info(f"Datos divididos: {X_train.shape[0]} muestras de entrenamiento, {X_test.shape[0]} muestras de prueba")
        
        # Construcción y entrenamiento del modelo
        pipeline = self.build_pipeline()
        self.model = pipeline
        
        # Hiperparámetros para optimización
        param_grid = {
            'classifier__n_estimators': [100, 200, 300],
            'classifier__learning_rate': [0.01, 0.05, 0.1],
            'classifier__max_depth': [3, 5, 7]
        }
        
        # Optimización de hiperparámetros mediante validación cruzada
        logger.info("Iniciando optimización de hiperparámetros con GridSearchCV")
        grid_search = GridSearchCV(
            pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1, verbose=1
        )
        grid_search.fit(X_train, y_train)
        
        # Guardar el mejor modelo
        self.model = grid_search.best_estimator_
        logger.info(f"Mejores hiperparámetros: {grid_search.best_params_}")
        
        # Evaluación en conjunto de prueba
        y_pred = self.model.predict(X_test)
        
        # Métricas de rendimiento
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted')
        recall = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
        
        logger.info(f"Entrenamiento completado. Métricas: {metrics}")
        logger.info(f"Informe de clasificación:\n{classification_report(y_test, y_pred)}")
        
        return metrics
    
    def predict(self, X):
        """
        Realiza predicciones con el modelo entrenado.
        
        Args:
            X (pandas.DataFrame): Datos para predicción
            
        Returns:
            numpy.ndarray: Predicciones (local_win, draw, away_win)
        """
        if self.model is None:
            logger.error("El modelo no ha sido entrenado o cargado")
            raise ValueError("El modelo no ha sido entrenado o cargado")
        
        # Preprocesamiento de datos
        X_processed = self.preprocess_data(X)
        
        # Predicción de clases
        y_pred = self.model.predict(X_processed)
        
        # Probabilidades de cada clase
        probabilities = self.model.predict_proba(X_processed)
        
        return y_pred, probabilities
    
    def predict_match(self, match_data):
        """
        Predice el resultado de un partido específico.
        
        Args:
            match_data (dict): Datos del partido
            
        Returns:
            dict: Resultado predicho y probabilidades
        """
        # Convertir los datos del partido a DataFrame
        X = pd.DataFrame([match_data])
        
        # Realizar predicción
        prediction, probabilities = self.predict(X)
        
        # Definir las etiquetas de clases
        class_labels = ['local_win', 'draw', 'away_win']
        
        # Crear resultado
        result = {
            'prediction': class_labels[prediction[0]],
            'probabilities': {
                class_labels[i]: float(probabilities[0][i]) for i in range(len(class_labels))
            },
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return result
    
    def save_model(self, filepath):
        """
        Guarda el modelo entrenado en disco.
        
        Args:
            filepath (str): Ruta donde guardar el modelo
        """
        if self.model is None:
            logger.error("No hay modelo para guardar")
            raise ValueError("No hay modelo para guardar")
        
        model_data = {
            'model': self.model,
            'feature_names': self.feature_names,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features,
            'version': '2.0',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Modelo guardado en {filepath}")
    
    def load_model(self, filepath):
        """
        Carga un modelo previamente guardado.
        
        Args:
            filepath (str): Ruta del modelo a cargar
        """
        try:
            model_data = joblib.load(filepath)
            self.model = model_data['model']
            self.feature_names = model_data['feature_names']
            self.categorical_features = model_data['categorical_features']
            self.numerical_features = model_data['numerical_features']
            logger.info(f"Modelo v{model_data.get('version', 'unknown')} cargado desde {filepath}")
        except Exception as e:
            logger.error(f"Error al cargar el modelo: {str(e)}")
            raise
    
    def get_feature_importance(self, top_n=20):
        """
        Obtiene la importancia de las características del modelo.
        
        Args:
            top_n (int): Número de características más importantes a mostrar
            
        Returns:
            pandas.DataFrame: DataFrame con las características y su importancia
        """
        if self.model is None:
            logger.error("El modelo no ha sido entrenado o cargado")
            raise ValueError("El modelo no ha sido entrenado o cargado")
        
        # Obtener la importancia de características
        feature_names = self.model.named_steps['preprocessor'].get_feature_names_out()
        feature_importance = self.model.named_steps['classifier'].feature_importances_
        
        # Crear DataFrame
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': feature_importance
        }).sort_values('importance', ascending=False)
        
        # Devolver las N características más importantes
        return importance_df.head(top_n)

# Ejemplo de uso del modelo
if __name__ == '__main__':
    # Cargar datos
    data = pd.read_csv('../data/partidos_historicos.csv')
    
    # Preparar características y etiquetas
    X = data.drop(['match_id', 'date', 'result'], axis=1)
    y = data['result']  # 0: victoria local, 1: empate, 2: victoria visitante
    
    # Crear y entrenar modelo
    model = PredictorFutbolPremium()
    metrics = model.train(X, y)
    
    print(f"Métricas del modelo: {metrics}")
    
    # Guardar modelo
    model.save_model('models/predictor_model_v2.joblib')
    
    # Ejemplo de predicción
    sample_match = X.iloc[0].to_dict()
    prediction = model.predict_match(sample_match)
    print(f"Predicción: {prediction}")
    
    # Mostrar importancia de características
    importance = model.get_feature_importance(top_n=15)
    print("Importancia de características:")
    print(importance)
