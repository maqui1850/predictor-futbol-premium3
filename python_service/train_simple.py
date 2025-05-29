#!/usr/bin/env python3
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
import os
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('simple_trainer')

def main():
    logger.info("🚀 Iniciando entrenamiento del modelo de fútbol")
    
    # Cargar datos
    logger.info("📊 Cargando datos...")
    df = pd.read_csv('data/partidos_historicos.csv')
    logger.info(f"✅ Datos cargados: {len(df)} partidos, {len(df.columns)} columnas")
    
    # Mostrar información de los datos
    logger.info(f"📅 Rango de fechas: {df['date'].min()} a {df['date'].max()}")
    logger.info(f"🏆 Ligas: {', '.join(df['league'].unique())}")
    logger.info(f"📈 Distribución de resultados:")
    result_counts = df['result'].value_counts()
    for result, count in result_counts.items():
        pct = (count / len(df)) * 100
        result_name = {'H': 'Victoria Local', 'D': 'Empate', 'A': 'Victoria Visitante'}.get(result, result)
        logger.info(f"     {result_name}: {count} ({pct:.1f}%)")
    
    # Preparar características
    logger.info("🔧 Preparando características...")
    
    # Encoders para equipos
    home_encoder = LabelEncoder()
    away_encoder = LabelEncoder()
    league_encoder = LabelEncoder()
    
    # Features numéricas disponibles
    features = []
    feature_names = []
    
    # Codificar equipos
    features.append(home_encoder.fit_transform(df['home_team']))
    feature_names.append('home_team_encoded')
    
    features.append(away_encoder.fit_transform(df['away_team']))
    feature_names.append('away_team_encoded')
    
    features.append(league_encoder.fit_transform(df['league']))
    feature_names.append('league_encoded')
    
    # IMPORTANTE: NO usar características que contengan el resultado del partido
    # Solo usar estadísticas del partido que NO incluyan goles
    pre_match_cols = ['home_shots_on_target', 'away_shots_on_target', 
                      'home_corners', 'away_corners', 
                      'home_fouls', 'away_fouls', 
                      'home_yellow_cards', 'away_yellow_cards', 
                      'home_red_cards', 'away_red_cards']
    
    # Verificar qué columnas están disponibles
    available_cols = []
    for col in pre_match_cols:
        if col in df.columns:
            available_cols.append(col)
    
    if not available_cols:
        logger.warning("⚠️ No se encontraron estadísticas del partido. Usando solo equipos y liga.")
        logger.info("📝 Para mejores predicciones, considera agregar estadísticas históricas de los equipos.")
    else:
        logger.info(f"📊 Usando estadísticas del partido: {', '.join(available_cols)}")
        for col in available_cols:
            features.append(df[col].values)
            feature_names.append(col)
        
        # Crear características derivadas (sin usar goles)
        if 'home_shots_on_target' in df.columns and 'away_shots_on_target' in df.columns:
            features.append(df['home_shots_on_target'] - df['away_shots_on_target'])
            feature_names.append('shots_difference')
        
        if 'home_corners' in df.columns and 'away_corners' in df.columns:
            features.append(df['home_corners'] - df['away_corners'])
            feature_names.append('corners_difference')
        
        if 'home_fouls' in df.columns and 'away_fouls' in df.columns:
            features.append(df['home_fouls'] - df['away_fouls'])
            feature_names.append('fouls_difference')
    
    # Crear características adicionales basadas en estadísticas históricas
    logger.info("📈 Calculando estadísticas históricas de equipos...")
    
    # Ordenar por fecha para calcular estadísticas correctamente
    df_sorted = df.sort_values('date').reset_index(drop=True)
    
    # Calcular estadísticas móviles para cada equipo (últimos 5 partidos)
    window_size = 5
    home_stats = []
    away_stats = []
    
    for idx in range(len(df_sorted)):
        current_date = df_sorted.loc[idx, 'date']
        home_team = df_sorted.loc[idx, 'home_team']
        away_team = df_sorted.loc[idx, 'away_team']
        
        # Partidos anteriores del equipo local
        home_prev = df_sorted[(df_sorted['date'] < current_date) & 
                              ((df_sorted['home_team'] == home_team) | 
                               (df_sorted['away_team'] == home_team))].tail(window_size)
        
        # Partidos anteriores del equipo visitante
        away_prev = df_sorted[(df_sorted['date'] < current_date) & 
                              ((df_sorted['home_team'] == away_team) | 
                               (df_sorted['away_team'] == away_team))].tail(window_size)
        
        # Calcular estadísticas del equipo local
        if len(home_prev) > 0:
            home_wins = 0
            home_draws = 0
            for _, match in home_prev.iterrows():
                if match['home_team'] == home_team:
                    if match['result'] == 'H':
                        home_wins += 1
                    elif match['result'] == 'D':
                        home_draws += 1
                else:  # Jugando como visitante
                    if match['result'] == 'A':
                        home_wins += 1
                    elif match['result'] == 'D':
                        home_draws += 1
            
            home_win_rate = home_wins / len(home_prev)
            home_draw_rate = home_draws / len(home_prev)
        else:
            home_win_rate = 0.33  # Valor por defecto
            home_draw_rate = 0.33
        
        # Calcular estadísticas del equipo visitante
        if len(away_prev) > 0:
            away_wins = 0
            away_draws = 0
            for _, match in away_prev.iterrows():
                if match['home_team'] == away_team:
                    if match['result'] == 'H':
                        away_wins += 1
                    elif match['result'] == 'D':
                        away_draws += 1
                else:  # Jugando como visitante
                    if match['result'] == 'A':
                        away_wins += 1
                    elif match['result'] == 'D':
                        away_draws += 1
            
            away_win_rate = away_wins / len(away_prev)
            away_draw_rate = away_draws / len(away_prev)
        else:
            away_win_rate = 0.33
            away_draw_rate = 0.33
        
        home_stats.append([home_win_rate, home_draw_rate])
        away_stats.append([away_win_rate, away_draw_rate])
    
    # Agregar estadísticas históricas como características
    home_stats_array = np.array(home_stats)
    away_stats_array = np.array(away_stats)
    
    features.append(home_stats_array[:, 0])  # Tasa de victorias local
    feature_names.append('home_win_rate')
    
    features.append(home_stats_array[:, 1])  # Tasa de empates local
    feature_names.append('home_draw_rate')
    
    features.append(away_stats_array[:, 0])  # Tasa de victorias visitante
    feature_names.append('away_win_rate')
    
    features.append(away_stats_array[:, 1])  # Tasa de empates visitante
    feature_names.append('away_draw_rate')
    
    # Diferencia en tasas de victoria
    features.append(home_stats_array[:, 0] - away_stats_array[:, 0])
    feature_names.append('win_rate_difference')
    
    # Combinar todas las características
    X = np.column_stack(features)
    y = df_sorted['result'].values
    
    logger.info(f"✅ Características preparadas: {X.shape[1]} features")
    logger.info(f"📋 Features: {', '.join(feature_names)}")
    
    # Dividir datos
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    logger.info(f"📊 Datos divididos: {len(X_train)} entrenamiento, {len(X_test)} prueba")
    
    # Entrenar modelo
    logger.info("🤖 Entrenando modelo Gradient Boosting...")
    
    model = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    logger.info("✅ Modelo entrenado")
    
    # Evaluar modelo
    logger.info("📈 Evaluando modelo...")
    y_pred = model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    logger.info("🎯 Métricas del modelo:")
    logger.info(f"  Accuracy:  {accuracy:.4f} ({accuracy*100:.1f}%)")
    logger.info(f"  Precision: {precision:.4f} ({precision*100:.1f}%)")
    logger.info(f"  Recall:    {recall:.4f} ({recall*100:.1f}%)")
    logger.info(f"  F1-Score:  {f1:.4f} ({f1*100:.1f}%)")
    
    # Informe detallado
    logger.info("\n📊 Informe de clasificación:")
    print(classification_report(y_test, y_pred, 
                              target_names=['Victoria Local', 'Empate', 'Victoria Visitante']))
    
    # Importancia de características
    logger.info("🔍 Top 10 características más importantes:")
    feature_importance = model.feature_importances_
    importance_pairs = list(zip(feature_names, feature_importance))
    importance_pairs.sort(key=lambda x: x[1], reverse=True)
    
    for i, (name, importance) in enumerate(importance_pairs[:10]):
        logger.info(f"  {i+1:2d}. {name:20s}: {importance:.4f}")
    
    # Guardar modelo
    logger.info("💾 Guardando modelo...")
    os.makedirs('models/saved', exist_ok=True)
    
    model_data = {
        'model': model,
        'home_encoder': home_encoder,
        'away_encoder': away_encoder,
        'league_encoder': league_encoder,
        'feature_names': feature_names,
        'metrics': {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
    }
    
    joblib.dump(model_data, 'models/saved/football_predictor.joblib')
    logger.info("✅ Modelo guardado en models/saved/football_predictor.joblib")
    
    # Ejemplo de predicción
    logger.info("🧪 Probando predicción de ejemplo...")
    sample_idx = 0
    sample_features = X_test[sample_idx:sample_idx+1]
    prediction = model.predict(sample_features)[0]
    probabilities = model.predict_proba(sample_features)[0]
    actual = y_test[sample_idx]
    
    result_names = {'H': 'Victoria Local', 'D': 'Empate', 'A': 'Victoria Visitante'}
    logger.info(f"  Predicción: {result_names[prediction]} (Real: {result_names[actual]})")
    logger.info(f"  Probabilidades:")
    
    # Mapear las clases correctamente
    classes = model.classes_
    for i, cls in enumerate(classes):
        prob = probabilities[i]
        logger.info(f"    {result_names[cls]:15s}: {prob:.3f} ({prob*100:.1f}%)")
    
    logger.info("🎉 ¡Entrenamiento completado exitosamente!")
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1
    }

if __name__ == '__main__':
    main()