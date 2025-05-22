import pandas as pd
import numpy as np
import joblib
import os
import logging
from datetime import datetime
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# Configurar logging
logger = logging.getLogger('predictor_futbol_premium.modelo')

class PredictorModel:
    """
    Modelo de predicción de resultados de fútbol basado en machine learning.
    Integra múltiples características y algoritmos para generar predicciones precisas.
    """
    
    def __init__(self, model_path=None):
        """
        Inicializa el modelo de predicción.
        
        Args:
            model_path (str, opcional): Ruta al modelo guardado previamente.
        """
        # Definir características que usará el modelo
        self.categorical_features = [
            'home_team', 'away_team', 'league', 
            'home_formation', 'away_formation',
            'stadium', 'weather_condition', 'referee'
        ]
        
        self.numerical_features = [
            # Estadísticas del equipo local
            'home_points_avg', 'home_goals_scored_avg', 'home_goals_conceded_avg',
            'home_shots_avg', 'home_shots_on_target_avg', 'home_possession_avg',
            'home_corners_avg', 'home_fouls_avg', 'home_yellow_cards_avg',
            'home_red_cards_avg', 'home_form_points', 'home_clean_sheets_pct',
            
            # Estadísticas del equipo visitante
            'away_points_avg', 'away_goals_scored_avg', 'away_goals_conceded_avg',
            'away_shots_avg', 'away_shots_on_target_avg', 'away_possession_avg',
            'away_corners_avg', 'away_fouls_avg', 'away_yellow_cards_avg',
            'away_red_cards_avg', 'away_form_points', 'away_clean_sheets_pct',
            
            # Estadísticas head-to-head
            'h2h_home_wins', 'h2h_away_wins', 'h2h_draws',
            'h2h_home_goals_avg', 'h2h_away_goals_avg', 'h2h_total_goals_avg',
            
            # Factores contextuales
            'days_since_last_home_match', 'days_since_last_away_match',
            'home_injured_players', 'away_injured_players',
            'home_suspended_players', 'away_suspended_players',
            'match_importance_home', 'match_importance_away',
            
            # Métricas avanzadas
            'home_xg_avg', 'away_xg_avg',
            'home_xga_avg', 'away_xga_avg',
            'home_ppda', 'away_ppda',
            'home_oppda', 'away_oppda'
        ]
        
        # Variables de control
        self.model = None
        self.scaler = None
        self.encoder = None
        self.pipeline = None
        self.model_info = {
            'version': '1.0.0',
            'name': 'PredictorFutbolPremium',
            'algorithm': 'GradientBoosting',
            'training_date': None,
            'accuracy': None,
            'features': {
                'categorical': self.categorical_features,
                'numerical': self.numerical_features
            }
        }
        
        # Cargar modelo si se proporciona ruta
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            # Inicializar modelo base si no hay uno guardado
            self._initialize_base_model()
            logger.info("Modelo base inicializado (sin entrenamiento)")
    
    def _initialize_base_model(self):
        """Inicializa un modelo base sin entrenar"""
        try:
            # Preprocesadores para características categóricas y numéricas
            categorical_transformer = Pipeline(steps=[
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            
            numerical_transformer = Pipeline(steps=[
                ('scaler', StandardScaler())
            ])
            
            # Combinar preprocesadores
            preprocessor = ColumnTransformer(
                transformers=[
                    ('num', numerical_transformer, self.numerical_features),
                    ('cat', categorical_transformer, self.categorical_features)
                ],
                remainder='drop'  # Ignorar columnas no especificadas
            )
            
            # Crear pipeline completo con GradientBoostingClassifier
            self.pipeline = Pipeline(steps=[
                ('preprocessor', preprocessor),
                ('classifier', GradientBoostingClassifier(random_state=42))
            ])
            
            # Asignar pipeline a modelo
            self.model = self.pipeline
            
        except Exception as e:
            logger.error(f"Error al inicializar modelo base: {str(e)}")
            raise
    
    def train(self, X, y, test_size=0.2, random_state=42, optimize=True):
        """
        Entrena el modelo con datos proporcionados.
        
        Args:
            X (pandas.DataFrame): Datos de características
            y (pandas.Series): Valores objetivo (resultados)
            test_size (float): Proporción de datos para test
            random_state (int): Semilla para reproducibilidad
            optimize (bool): Si se debe realizar optimización de hiperparámetros
            
        Returns:
            dict: Métricas de rendimiento del modelo
        """
        try:
            logger.info(f"Iniciando entrenamiento con {X.shape[0]} muestras")
            
            # Dividir datos en entrenamiento y prueba
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y
            )
            
            if optimize:
                logger.info("Iniciando optimización de hiperparámetros...")
                
                # Definir grid de hiperparámetros
                param_grid = {
                    'classifier__n_estimators': [100, 200, 300],
                    'classifier__learning_rate': [0.05, 0.1, 0.2],
                    'classifier__max_depth': [3, 5, 7]
                }
                
                # Realizar búsqueda de mejores hiperparámetros
                grid_search = GridSearchCV(
                    self.pipeline, param_grid, cv=5, 
                    scoring='accuracy', n_jobs=-1, verbose=1
                )
                
                grid_search.fit(X_train, y_train)
                
                # Guardar mejor modelo
                self.model = grid_search.best_estimator_
                
                logger.info(f"Mejores hiperparámetros: {grid_search.best_params_}")
            else:
                # Entrenar con hiperparámetros predeterminados
                self.model = self.pipeline
                self.model.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = self.model.predict(X_test)
            
            # Calcular métricas
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Mostrar informe detallado
            logger.info(f"Informe de clasificación:\n{classification_report(y_test, y_pred)}")
            
            # Actualizar información del modelo
            self.model_info.update({
                'training_date': datetime.now().isoformat(),
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1_score': float(f1),
                'samples_trained': int(X.shape[0])
            })
            
            logger.info(f"Entrenamiento completado. Accuracy: {accuracy:.4f}")
            
            return {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1
            }
            
        except Exception as e:
            logger.error(f"Error durante el entrenamiento: {str(e)}")
            raise
    
    def predict_match(self, match_data):
        """
        Realiza predicción para un partido específico.
        
        Args:
            match_data (dict): Datos del partido a predecir
            
        Returns:
            dict: Predicción con probabilidades y confianza
        """
        try:
            # Si no hay modelo entrenado, usar predicción simple
            if self.model is None:
                return self._simple_prediction(match_data)
            
            # Convertir datos a DataFrame
            match_df = pd.DataFrame([match_data])
            
            # Verificar si el modelo fue entrenado con pipeline
            if hasattr(self.model, 'predict_proba'):
                # Obtener predicción y probabilidades
                prediction = self.model.predict(match_df)[0]
                probabilities = self.model.predict_proba(match_df)[0]
            else:
                # Si es un pipeline, usar directamente
                prediction = self.model.predict(match_df)[0]
                probabilities = self.model.predict_proba(match_df)[0]
            
            # Convertir predicción numérica a etiqueta
            result_labels = ['home_win', 'draw', 'away_win']
            predicted_result = result_labels[prediction]
            
            # Calcular nivel de confianza (0-10)
            max_prob = np.max(probabilities)
            confidence = self._calculate_confidence(max_prob)
            
            # Crear respuesta
            result = {
                'prediction': predicted_result,
                'probabilities': {
                    'home_win': float(probabilities[0]),
                    'draw': float(probabilities[1]),
                    'away_win': float(probabilities[2])
                },
                'confidence': float(confidence),
                'confidence_level': self._get_confidence_level(confidence),
                'home_team': match_data.get('home_team', ''),
                'away_team': match_data.get('away_team', ''),
                'league': match_data.get('league', '')
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error en predicción: {str(e)}")
            # Usar predicción simple como fallback
            return self._simple_prediction(match_data)
    
    def _simple_prediction(self, match_data):
        """
        Genera una predicción simple basada en reglas cuando no hay modelo disponible.
        
        Args:
            match_data (dict): Datos del partido
            
        Returns:
            dict: Predicción básica
        """
        # Variables para calcular predicción simple
        home_advantage = 0.2  # Ventaja por jugar en casa
        
        # Obtener estadísticas básicas o usar valores por defecto
        home_strength = match_data.get('home_points_avg', 1.5) / 3.0  # Normalizar a 0-1
        away_strength = match_data.get('away_points_avg', 1.3) / 3.0
        
        # Añadir ventaja de local
        home_strength += home_advantage
        
        # Normalizar para que sumen 1
        total = home_strength + away_strength + 0.3  # 0.3 para el empate
        home_win_prob = home_strength / total
        away_win_prob = away_strength / total
        draw_prob = 1 - home_win_prob - away_win_prob
        
        # Determinar resultado más probable
        probs = [home_win_prob, draw_prob, away_win_prob]
        result_index = np.argmax(probs)
        result_labels = ['home_win', 'draw', 'away_win']
        predicted_result = result_labels[result_index]
        
        # Calcular confianza (0-10)
        max_prob = max(probs)
        confidence = self._calculate_confidence(max_prob)
        
        return {
            'prediction': predicted_result,
            'probabilities': {
                'home_win': float(home_win_prob),
                'draw': float(draw_prob),
                'away_win': float(away_win_prob)
            },
            'confidence': float(confidence),
            'confidence_level': self._get_confidence_level(confidence),
            'home_team': match_data.get('home_team', ''),
            'away_team': match_data.get('away_team', ''),
            'league': match_data.get('league', ''),
            'model_type': 'simple_rules'
        }
    
    def _calculate_confidence(self, probability):
        """
        Calcula nivel de confianza en escala 0-10 basado en probabilidad
        
        Args:
            probability (float): Probabilidad máxima (0-1)
            
        Returns:
            float: Nivel de confianza (0-10)
        """
        # Mapeo no lineal para resaltar diferencias en el rango medio
        base_confidence = probability * 10
        
        # Ajuste: valores muy bajos o muy altos son más significativos
        if probability > 0.6:
            # Aumentar confianza para probabilidades altas
            confidence = 6 + (probability - 0.6) * 15
        elif probability < 0.4:
            # Disminuir confianza para probabilidades bajas
            confidence = probability * 8
        else:
            # Rango medio
            confidence = 3 + (probability - 0.4) * 15
        
        # Limitar a rango 0-10
        return min(10, max(0, confidence))
    
    def _get_confidence_level(self, confidence):
        """
        Convierte nivel numérico de confianza a categoría textual
        
        Args:
            confidence (float): Nivel de confianza (0-10)
            
        Returns:
            str: Categoría de confianza
        """
        if confidence >= 8.0:
            return "Muy Alta"
        elif confidence >= 6.5:
            return "Alta"
        elif confidence >= 5.0:
            return "Media"
        elif confidence >= 3.5:
            return "Baja"
        else:
            return "Muy Baja"
    
    def save_model(self, filepath):
        """
        Guarda el modelo entrenado en disco
        
        Args:
            filepath (str): Ruta donde guardar el modelo
        """
        if self.model is None:
            logger.error("No hay modelo para guardar")
            raise ValueError("No hay modelo entrenado para guardar")
        
        # Crear directorio si no existe
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Preparar datos para guardar
        model_data = {
            'model': self.model,
            'model_info': self.model_info,
            'categorical_features': self.categorical_features,
            'numerical_features': self.numerical_features
        }
        
        # Guardar modelo
        joblib.dump(model_data, filepath)
        logger.info(f"Modelo guardado en {filepath}")
        
        return True
    
    def load_model(self, filepath):
        """
        Carga un modelo previamente guardado
        
        Args:
            filepath (str): Ruta del modelo a cargar
        """
        try:
            # Cargar modelo desde archivo
            model_data = joblib.load(filepath)
            
            # Extraer componentes
            self.model = model_data['model']
            self.model_info = model_data.get('model_info', self.model_info)
            self.categorical_features = model_data.get('categorical_features', self.categorical_features)
            self.numerical_features = model_data.get('numerical_features', self.numerical_features)
            
            logger.info(f"Modelo cargado desde {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"Error al cargar modelo: {str(e)}")
            # Inicializar modelo base como fallback
            self._initialize_base_model()
            raise
    
    def get_model_info(self):
        """
        Devuelve información sobre el modelo actual
        
        Returns:
            dict: Información del modelo
        """
        # Añadir información dinámica
        model_info = self.model_info.copy()
        model_info['timestamp'] = datetime.now().isoformat()
        
        # Añadir información de características si no existe
        if 'features' not in model_info:
            model_info['features'] = {
                'categorical': self.categorical_features,
                'numerical': self.numerical_features,
                'total_features': len(self.categorical_features) + len(self.numerical_features)
            }
        
        # Añadir tipo de modelo actual
        if self.model is not None:
            model_type = type(self.model).__name__
            if hasattr(self.model, 'named_steps') and 'classifier' in self.model.named_steps:
                classifier = self.model.named_steps['classifier']
                model_type = type(classifier).__name__
            
            model_info['model_type'] = model_type
        
        return model_info
    
    def get_feature_importance(self, top_n=20):
        """
        Obtiene la importancia de las características
        
        Args:
            top_n (int): Número de características principales a mostrar
            
        Returns:
            dict: Características ordenadas por importancia
        """
        if self.model is None:
            logger.error("No hay modelo para extraer importancia de características")
            return {"error": "Modelo no disponible"}
        
        try:
            # Verificar si es un pipeline con preprocesador
            if hasattr(self.model, 'named_steps') and 'preprocessor' in self.model.named_steps:
                # Obtener clasificador
                classifier = self.model.named_steps['classifier']
                
                # Verificar si el clasificador soporta feature_importances_
                if hasattr(classifier, 'feature_importances_'):
                    # Obtener nombres de características procesadas
                    feature_names = self.model.named_steps['preprocessor'].get_feature_names_out()
                    
                    # Obtener importancias
                    importances = classifier.feature_importances_
                    
                    # Crear lista ordenada
                    features_importance = [
                        {'feature': feature_names[i], 'importance': float(importances[i])}
                        for i in range(len(feature_names))
                    ]
                    
                    # Ordenar por importancia descendente
                    features_importance.sort(key=lambda x: x['importance'], reverse=True)
                    
                    # Devolver las top_n características
                    return {
                        'features': features_importance[:top_n],
                        'top_n': top_n,
                        'total_features': len(feature_names)
                    }
            
            # Si no es un pipeline o no tiene feature_importances_
            return {"error": "El modelo no soporta cálculo de importancia de características"}
            
        except Exception as e:
            logger.error(f"Error al obtener importancia de características: {str(e)}")
            return {"error": str(e)}

# Ejemplo de uso si se ejecuta como script independiente
if __name__ == "__main__":
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    
    # Crear instancia del modelo
    model = PredictorModel()
    
    # Ejemplo de datos para predicción
    match_data = {
        'home_team': 'Barcelona',
        'away_team': 'Real Madrid',
        'league': 'La Liga',
        'home_points_avg': 2.3,
        'away_points_avg': 2.4,
        'home_goals_scored_avg': 2.1,
        'away_goals_scored_avg': 1.9,
        'home_goals_conceded_avg': 0.8,
        'away_goals_conceded_avg': 0.7,
        'home_form_points': 12,
        'away_form_points': 13,
        'home_clean_sheets_pct': 0.4,
        'away_clean_sheets_pct': 0.3,
        'h2h_home_wins': 3,
        'h2h_away_wins': 2,
        'h2h_draws': 1
    }
    
    # Realizar predicción simple
    prediction = model.predict_match(match_data)
    print(f"Predicción: {prediction}")
    
    # Si hubiéramos entrenado el modelo:
    # model.save_model('models/predictor_model.joblib')
    # model_info = model.get_model_info()
    # print(f"Información del modelo: {model_info}")
