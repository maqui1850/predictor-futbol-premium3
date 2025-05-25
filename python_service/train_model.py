#!/usr/bin/env python3
# python_service/train_model.py

import os
import sys
import argparse
import logging
import yaml
import pandas as pd
import numpy as np
import pickle
import joblib
import json
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error
from sklearn.preprocessing import StandardScaler

# Configurar logging básico
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger('model_trainer')

# Obtener directorio base
BASE_DIR = Path(__file__).resolve().parent

def load_config(env='development'):
    """Carga la configuración basada en el entorno"""
    try:
        config_path = BASE_DIR / 'config' / 'deployment.yaml'
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        # Obtener configuración para el entorno específico
        env_config = config['environments'][env]
        
        # Obtener configuración del modelo
        model_config = config['model']
        
        # Combinar configuraciones
        return {
            'env': env_config,
            'model': model_config
        }
    except Exception as e:
        logger.error(f"Error cargando configuración: {e}")
        sys.exit(1)

def load_data(data_path, format='csv'):
    """Carga datos de entrenamiento desde un archivo"""
    try:
        logger.info(f"Cargando datos desde: {data_path}")
        
        if format.lower() == 'csv':
            data = pd.read_csv(data_path)
        elif format.lower() == 'excel':
            data = pd.read_excel(data_path)
        elif format.lower() == 'json':
            data = pd.read_json(data_path)
        else:
            raise ValueError(f"Formato no soportado: {format}")
        
        logger.info(f"Datos cargados correctamente. Forma: {data.shape}")
        return data
    except Exception as e:
        logger.error(f"Error cargando datos: {e}")
        sys.exit(1)

def preprocess_data(data, model_config):
    """Preprocesa los datos para entrenamiento"""
    try:
        logger.info("Preprocesando datos...")
        
        # Obtener lista de características
        features = model_config.get('features', [])
        if not features:
            raise ValueError("No se encontraron características en la configuración")
        
        # Convertir nombres de características a columnas
        feature_columns = []
        for feature in features:
            # Buscar columnas que coincidan con el patrón de la característica
            matching_columns = [col for col in data.columns if feature.lower() in col.lower()]
            feature_columns.extend(matching_columns)
        
        # Eliminar duplicados
        feature_columns = list(set(feature_columns))
        
        if not feature_columns:
            raise ValueError("No se encontraron columnas que coincidan con las características configuradas")
        
        # Obtener columnas de objetivos (target)
        target_columns = [
            'result',      # 1 (home), 0 (draw), -1 (away)
            'home_win',    # Binario para victoria local
            'draw',        # Binario para empate
            'away_win',    # Binario para victoria visitante
            'btts',        # Ambos equipos marcan
            'over_2_5',    # Más de 2.5 goles
            'total_goals'  # Total de goles
        ]
        
        target_columns = [col for col in target_columns if col in data.columns]
        
        if not target_columns:
            raise ValueError("No se encontraron columnas objetivo en los datos")
        
        logger.info(f"Características seleccionadas: {len(feature_columns)} columnas")
        logger.info(f"Objetivos seleccionados: {target_columns}")
        
        # Verificar valores faltantes
        missing_values = data[feature_columns].isnull().sum().sum()
        if missing_values > 0:
            logger.warning(f"Se encontraron {missing_values} valores faltantes en las características")
            
            # Estrategia simple: llenar con la media
            data[feature_columns] = data[feature_columns].fillna(data[feature_columns].mean())
            
            logger.info("Valores faltantes rellenados con la media")
        
        # Normalizar características
        scaler = StandardScaler()
        data[feature_columns] = scaler.fit_transform(data[feature_columns])
        
        # Guardar scaler para uso posterior
        models_dir = BASE_DIR / 'models' / 'saved'
        os.makedirs(models_dir, exist_ok=True)
        
        with open(models_dir / 'scaler.pkl', 'wb') as f:
            pickle.dump(scaler, f)
        
        logger.info("Datos normalizados y scaler guardado")
        
        # Dividir en conjuntos de entrenamiento y prueba
        train_size = 1.0 - model_config.get('training', {}).get('test_size', 0.2)
        random_state = model_config.get('training', {}).get('random_state', 42)
        
        train_indices, test_indices = train_test_split(
            range(len(data)), 
            train_size=train_size, 
            random_state=random_state
        )
        
        train_data = data.iloc[train_indices]
        test_data = data.iloc[test_indices]
        
        logger.info(f"Datos divididos en entrenamiento ({len(train_data)} muestras) y prueba ({len(test_data)} muestras)")
        
        return {
            'feature_columns': feature_columns,
            'target_columns': target_columns,
            'train_data': train_data,
            'test_data': test_data,
            'scaler': scaler
        }
    except Exception as e:
        logger.error(f"Error preprocesando datos: {e}")
        raise

def train_models(preprocessed_data, model_config):
    """Entrena modelos para cada objetivo"""
    try:
        logger.info("Iniciando entrenamiento de modelos...")
        
        feature_columns = preprocessed_data['feature_columns']
        target_columns = preprocessed_data['target_columns']
        train_data = preprocessed_data['train_data']
        test_data = preprocessed_data['test_data']
        
        # Modelos entrenados
        trained_models = {}
        model_metrics = {}
        
        # Directorio para guardar modelos
        models_dir = BASE_DIR / 'models' / 'saved'
        os.makedirs(models_dir, exist_ok=True)
        
        # Parámetros de entrenamiento
        params = model_config.get('params', {})
        
        # Usar hiperparámetros por defecto si no se especifican
        default_params = {
            'n_estimators': 200,
            'learning_rate': 0.1,
            'max_depth': 5,
            'min_samples_split': 10,
            'min_samples_leaf': 4,
            'subsample': 0.8,
            'random_state': 42
        }
        
        # Completar parámetros faltantes
        for key, value in default_params.items():
            if key not in params:
                params[key] = value
        
        # Entrenar modelo para cada objetivo
        for target in target_columns:
            logger.info(f"Entrenando modelo para: {target}")
            
            # Seleccionar tipo de modelo según el objetivo
            if target in ['total_goals']:
                # Regresión para objetivos continuos
                model = GradientBoostingRegressor(**params)
                metrics_func = mean_squared_error
            else:
                # Clasificación para objetivos categóricos
                model = GradientBoostingClassifier(**params)
                metrics_func = accuracy_score
            
            # Datos de entrenamiento
            X_train = train_data[feature_columns]
            y_train = train_data[target]
            
            # Datos de prueba
            X_test = test_data[feature_columns]
            y_test = test_data[target]
            
            # Entrenar modelo
            model.fit(X_train, y_train)
            
            # Evaluar modelo
            y_pred = model.predict(X_test)
            
            # Calcular métricas
            if target in ['total_goals']:
                # Métricas de regresión
                rmse = np.sqrt(metrics_func(y_test, y_pred))
                mae = np.mean(np.abs(y_test - y_pred))
                r2 = model.score(X_test, y_test)
                
                metrics = {
                    'rmse': float(rmse),
                    'mae': float(mae),
                    'r2': float(r2)
                }
                
                logger.info(f"  RMSE: {rmse:.4f}, MAE: {mae:.4f}, R²: {r2:.4f}")
            else:
                # Métricas de clasificación
                accuracy = accuracy_score(y_test, y_pred)
                precision = precision_score(y_test, y_pred, average='weighted')
                recall = recall_score(y_test, y_pred, average='weighted')
                f1 = f1_score(y_test, y_pred, average='weighted')
                
                metrics = {
                    'accuracy': float(accuracy),
                    'precision': float(precision),
                    'recall': float(recall),
                    'f1': float(f1)
                }
                
                logger.info(f"  Accuracy: {accuracy:.4f}, Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")
            
            # Guardar modelo
            model_path = models_dir / f"model_{target}.joblib"
            joblib.dump(model, model_path)
            
            # Almacenar modelo y métricas
            trained_models[target] = model
            model_metrics[target] = metrics
            
            logger.info(f"  Modelo guardado en: {model_path}")
        
        # Guardar metadatos del modelo
        metadata = {
            'name': model_config.get('name', 'gradient_boosting'),
            'version': model_config.get('version', '1.0'),
            'features': feature_columns,
            'targets': target_columns,
            'parameters': params,
            'metrics': model_metrics,
            'training_date': datetime.now().isoformat(),
            'samples': {
                'train': len(train_data),
                'test': len(test_data)
            }
        }
        
        with open(models_dir / 'metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Metadatos del modelo guardados en: {models_dir / 'metadata.json'}")
        
        return {
            'models': trained_models,
            'metrics': model_metrics,
            'metadata': metadata,
            'feature_columns': feature_columns
        }
    except Exception as e:
        logger.error(f"Error entrenando modelos: {e}")
        raise

def optimize_hyperparameters(preprocessed_data, model_config):
    """Optimiza hiperparámetros usando GridSearchCV"""
    try:
        # Verificar si la optimización está habilitada
        hyperopt_config = model_config.get('hyperopt', {})
        if not hyperopt_config.get('enabled', False):
            logger.info("Optimización de hiperparámetros deshabilitada")
            return None
        
        logger.info("Iniciando optimización de hiperparámetros...")
        
        feature_columns = preprocessed_data['feature_columns']
        train_data = preprocessed_data['train_data']
        
        # Usar el objetivo principal para optimización
        target = 'result' if 'result' in preprocessed_data['target_columns'] else preprocessed_data['target_columns'][0]
        
        logger.info(f"Optimizando para objetivo: {target}")
        
        # Datos de entrenamiento
        X = train_data[feature_columns]
        y = train_data[target]
        
        # Espacio de parámetros
        param_grid = hyperopt_config.get('space', {})
        
        if not param_grid:
            logger.warning("No se encontró espacio de parámetros para optimización")
            return None
        
        # Seleccionar tipo de modelo según el objetivo
        if target in ['total_goals']:
            model = GradientBoostingRegressor()
        else:
            model = GradientBoostingClassifier()
        
        # Configurar GridSearchCV
        cv = model_config.get('training', {}).get('cv_folds', 5)
        
        grid_search = GridSearchCV(
            estimator=model,
            param_grid=param_grid,
            cv=cv,
            n_jobs=-1,
            verbose=1,
            scoring='neg_mean_squared_error' if target in ['total_goals'] else 'accuracy'
        )
        
        # Ejecutar búsqueda
        logger.info(f"Iniciando GridSearchCV con {cv} folds...")
        grid_search.fit(X, y)
        
        # Mejores parámetros
        best_params = grid_search.best_params_
        best_score = grid_search.best_score_
        
        logger.info(f"Mejor puntuación: {best_score:.4f}")
        logger.info(f"Mejores parámetros: {best_params}")
        
        # Guardar resultados
        results_dir = BASE_DIR / 'models' / 'results'
        os.makedirs(results_dir, exist_ok=True)
        
        results = {
            'best_params': best_params,
            'best_score': float(best_score),
            'cv_results': {
                'mean_test_score': grid_search.cv_results_['mean_test_score'].tolist(),
                'params': [dict(p) for p in grid_search.cv_results_['params']]
            },
            'timestamp': datetime.now().isoformat()
        }
        
        with open(results_dir / 'hyperopt_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Resultados de optimización guardados en: {results_dir / 'hyperopt_results.json'}")
        
        return best_params
    except Exception as e:
        logger.error(f"Error en optimización de hiperparámetros: {e}")
        logger.warning("Continuando con parámetros por defecto")
        return None

def main():
    """Función principal para entrenamiento de modelos"""
    parser = argparse.ArgumentParser(description='Entrenamiento de modelos para predicción de fútbol')
    parser.add_argument('--data', '-d', required=True, help='Ruta al archivo de datos')
    parser.add_argument('--format', '-f', default='csv', choices=['csv', 'excel', 'json'],
                      help='Formato del archivo de datos')
    parser.add_argument('--env', '-e', default='development', choices=['development', 'production'],
                      help='Entorno de ejecución')
    parser.add_argument('--optimize', '-o', action='store_true', help='Optimizar hiperparámetros')
    
    args = parser.parse_args()
    
    try:
        # Cargar configuración
        logger.info(f"Cargando configuración para entorno: {args.env}")
        config = load_config(args.env)
        
        # Cargar datos
        data = load_data(args.data, args.format)
        
        # Preprocesar datos
        preprocessed_data = preprocess_data(data, config['model'])
        
        # Optimizar hiperparámetros si se solicita
        if args.optimize:
            best_params = optimize_hyperparameters(preprocessed_data, config['model'])
            
            if best_params:
                # Actualizar parámetros del modelo
                config['model']['params'] = best_params
        
        # Entrenar modelos
        result = train_models(preprocessed_data, config['model'])
        
        logger.info(f"Entrenamiento completado para {len(result['models'])} modelos.")
        logger.info(f"Modelos guardados en: {BASE_DIR / 'models' / 'saved'}")
        
        # Mostrar resumen de métricas
        logger.info("Resumen de métricas:")
        for target, metrics in result['metrics'].items():
            metrics_str = ", ".join([f"{k}: {v:.4f}" for k, v in metrics.items()])
            logger.info(f"  {target}: {metrics_str}")
        
    except Exception as e:
        logger.error(f"Error en entrenamiento: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
