#!/usr/bin/env python3
import pandas as pd
import numpy as np
import joblib
import logging
from datetime import datetime, timedelta
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.metrics import classification_report, roc_curve, auc
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('model_validator')

class FootballPredictorValidator:
    def __init__(self, model_path='models/saved/football_predictor.joblib'):
        """Inicializa el validador con el modelo entrenado"""
        logger.info("📂 Cargando modelo...")
        self.model_data = joblib.load(model_path)
        self.model = self.model_data['model']
        self.home_encoder = self.model_data['home_encoder']
        self.away_encoder = self.model_data['away_encoder']
        self.league_encoder = self.model_data['league_encoder']
        self.feature_names = self.model_data['feature_names']
        self.metrics = self.model_data['metrics']
        logger.info("✅ Modelo cargado exitosamente")
        
    def prepare_features(self, df):
        """Prepara las características para predicción"""
        features = []
        
        # Codificar equipos (manejar equipos nuevos)
        home_encoded = []
        away_encoded = []
        league_encoded = []
        
        for idx, row in df.iterrows():
            # Home team
            if row['home_team'] in self.home_encoder.classes_:
                home_encoded.append(self.home_encoder.transform([row['home_team']])[0])
            else:
                home_encoded.append(-1)  # Equipo desconocido
            
            # Away team
            if row['away_team'] in self.away_encoder.classes_:
                away_encoded.append(self.away_encoder.transform([row['away_team']])[0])
            else:
                away_encoded.append(-1)
            
            # League
            if row['league'] in self.league_encoder.classes_:
                league_encoded.append(self.league_encoder.transform([row['league']])[0])
            else:
                league_encoded.append(-1)
        
        features.append(home_encoded)
        features.append(away_encoded)
        features.append(league_encoded)
        
        # Agregar otras características según el modelo
        stat_cols = ['home_shots_on_target', 'away_shots_on_target', 
                     'home_corners', 'away_corners', 'home_fouls', 'away_fouls',
                     'home_yellow_cards', 'away_yellow_cards', 
                     'home_red_cards', 'away_red_cards']
        
        for col in stat_cols:
            if col in df.columns:
                features.append(df[col].values)
        
        # Características derivadas
        if 'home_shots_on_target' in df.columns and 'away_shots_on_target' in df.columns:
            features.append(df['home_shots_on_target'] - df['away_shots_on_target'])
        
        if 'home_corners' in df.columns and 'away_corners' in df.columns:
            features.append(df['home_corners'] - df['away_corners'])
        
        if 'home_fouls' in df.columns and 'away_fouls' in df.columns:
            features.append(df['home_fouls'] - df['away_fouls'])
        
        # Agregar características históricas (simplificado para este ejemplo)
        # En producción, deberías calcular esto basado en datos históricos reales
        n_rows = len(df)
        features.extend([
            np.full(n_rows, 0.4),  # home_win_rate
            np.full(n_rows, 0.3),  # home_draw_rate
            np.full(n_rows, 0.3),  # away_win_rate
            np.full(n_rows, 0.3),  # away_draw_rate
            np.full(n_rows, 0.1)   # win_rate_difference
        ])
        
        return np.column_stack(features)
    
    def validate_future_matches(self, future_matches_path=None):
        """Valida el modelo con partidos futuros"""
        logger.info("🔮 Validando con partidos futuros...")
        
        if future_matches_path:
            # Cargar partidos futuros desde archivo
            df_future = pd.read_csv(future_matches_path)
        else:
            # Crear datos de ejemplo para demostración
            logger.info("⚠️ No se proporcionó archivo de partidos futuros. Creando datos de ejemplo...")
            df_future = pd.DataFrame({
                'date': pd.date_range(start='2025-06-01', periods=10, freq='D'),
                'home_team': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Manchester United', 
                             'Liverpool', 'Chelsea', 'Manchester City', 'Arsenal', 'Tottenham', 'Leicester'],
                'away_team': ['Valencia', 'Real Sociedad', 'Villarreal', 'Leeds', 
                             'Everton', 'West Ham', 'Brighton', 'Newcastle', 'Crystal Palace', 'Wolves'],
                'league': ['La Liga', 'La Liga', 'La Liga', 'Premier League', 
                          'Premier League', 'Premier League', 'Premier League', 'Premier League', 
                          'Premier League', 'Premier League'],
                'home_shots_on_target': np.random.randint(2, 10, 10),
                'away_shots_on_target': np.random.randint(1, 8, 10),
                'home_corners': np.random.randint(2, 12, 10),
                'away_corners': np.random.randint(1, 10, 10),
                'home_fouls': np.random.randint(8, 16, 10),
                'away_fouls': np.random.randint(8, 16, 10),
                'home_yellow_cards': np.random.randint(0, 4, 10),
                'away_yellow_cards': np.random.randint(0, 4, 10),
                'home_red_cards': np.random.randint(0, 2, 10),
                'away_red_cards': np.random.randint(0, 2, 10)
            })
        
        # Preparar características
        X_future = self.prepare_features(df_future)
        
        # Hacer predicciones
        predictions = self.model.predict(X_future)
        probabilities = self.model.predict_proba(X_future)
        
        # Crear DataFrame con resultados
        results = df_future[['date', 'home_team', 'away_team', 'league']].copy()
        results['predicted'] = predictions
        
        # Mapear predicciones a nombres legibles
        result_map = {'H': 'Victoria Local', 'D': 'Empate', 'A': 'Victoria Visitante'}
        results['predicted_name'] = results['predicted'].map(result_map)
        
        # Agregar probabilidades
        classes = self.model.classes_
        for i, cls in enumerate(classes):
            results[f'prob_{cls}'] = probabilities[:, i]
        
        # Agregar confianza de la predicción
        results['confidence'] = probabilities.max(axis=1)
        
        # Mostrar resultados
        logger.info("\n📊 Predicciones para partidos futuros:")
        for idx, row in results.iterrows():
            logger.info(f"\n🏆 {row['date'].strftime('%Y-%m-%d')} - {row['league']}")
            logger.info(f"   {row['home_team']} vs {row['away_team']}")
            logger.info(f"   Predicción: {row['predicted_name']} (Confianza: {row['confidence']:.1%})")
            logger.info(f"   Probabilidades: H={row.get('prob_H', 0):.1%}, D={row.get('prob_D', 0):.1%}, A={row.get('prob_A', 0):.1%}")
        
        return results
    
    def optimize_thresholds(self, X_val, y_val):
        """Optimiza los umbrales de decisión para cada clase"""
        logger.info("🎯 Optimizando umbrales de decisión...")
        
        # Obtener probabilidades
        y_proba = self.model.predict_proba(X_val)
        classes = self.model.classes_
        
        # Diccionario para guardar mejores umbrales
        best_thresholds = {}
        
        # Para cada clase, encontrar el mejor umbral
        for i, cls in enumerate(classes):
            logger.info(f"\n  Optimizando para clase: {cls}")
            
            # Probabilidades para esta clase
            proba_cls = y_proba[:, i]
            
            # Crear etiquetas binarias
            y_binary = (y_val == cls).astype(int)
            
            # Probar diferentes umbrales
            thresholds = np.linspace(0.1, 0.9, 50)
            best_f1 = 0
            best_threshold = 0.5
            
            for threshold in thresholds:
                # Hacer predicciones con este umbral
                y_pred_binary = (proba_cls >= threshold).astype(int)
                
                # Calcular F1 score
                if y_pred_binary.sum() > 0:  # Evitar división por cero
                    f1 = f1_score(y_binary, y_pred_binary)
                    
                    if f1 > best_f1:
                        best_f1 = f1
                        best_threshold = threshold
            
            best_thresholds[cls] = best_threshold
            logger.info(f"    Mejor umbral: {best_threshold:.3f} (F1: {best_f1:.3f})")
        
        # Aplicar umbrales optimizados para hacer predicciones
        def predict_with_thresholds(probas):
            predictions = []
            for proba in probas:
                # Aplicar umbrales específicos por clase
                adjusted_scores = {}
                for i, cls in enumerate(classes):
                    if proba[i] >= best_thresholds[cls]:
                        adjusted_scores[cls] = proba[i]
                
                # Si hay múltiples clases que superan su umbral, elegir la de mayor probabilidad
                if adjusted_scores:
                    predictions.append(max(adjusted_scores, key=adjusted_scores.get))
                else:
                    # Si ninguna supera su umbral, elegir la de mayor probabilidad original
                    predictions.append(classes[np.argmax(proba)])
            
            return np.array(predictions)
        
        # Comparar predicciones originales vs optimizadas
        y_pred_original = self.model.predict(X_val)
        y_pred_optimized = predict_with_thresholds(y_proba)
        
        # Métricas originales
        acc_original = accuracy_score(y_val, y_pred_original)
        f1_original = f1_score(y_val, y_pred_original, average='weighted')
        
        # Métricas optimizadas
        acc_optimized = accuracy_score(y_val, y_pred_optimized)
        f1_optimized = f1_score(y_val, y_pred_optimized, average='weighted')
        
        logger.info(f"\n📊 Comparación de rendimiento:")
        logger.info(f"  Original  - Accuracy: {acc_original:.3f}, F1: {f1_original:.3f}")
        logger.info(f"  Optimizado - Accuracy: {acc_optimized:.3f}, F1: {f1_optimized:.3f}")
        
        # Guardar umbrales optimizados
        self.best_thresholds = best_thresholds
        
        return best_thresholds, y_pred_optimized
    
    def cross_validation(self, X, y, cv_folds=5):
        """Implementa validación cruzada k-fold"""
        logger.info(f"🔄 Ejecutando validación cruzada con {cv_folds} folds...")
        
        # Configurar StratifiedKFold
        skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
        
        # Métricas a evaluar
        scoring_metrics = ['accuracy', 'precision_weighted', 'recall_weighted', 'f1_weighted']
        
        # Almacenar resultados
        cv_results = {}
        
        for metric in scoring_metrics:
            logger.info(f"\n  Evaluando {metric}...")
            scores = cross_val_score(self.model, X, y, cv=skf, scoring=metric, n_jobs=-1)
            cv_results[metric] = scores
            logger.info(f"    Scores por fold: {scores.round(3)}")
            logger.info(f"    Media: {scores.mean():.3f} (+/- {scores.std() * 2:.3f})")
        
        # Validación manual para obtener matrices de confusión
        logger.info("\n📊 Matrices de confusión por fold:")
        confusion_matrices = []
        
        for fold, (train_idx, val_idx) in enumerate(skf.split(X, y)):
            X_train_fold, X_val_fold = X[train_idx], X[val_idx]
            y_train_fold, y_val_fold = y[train_idx], y[val_idx]
            
            # Entrenar modelo en este fold
            self.model.fit(X_train_fold, y_train_fold)
            y_pred_fold = self.model.predict(X_val_fold)
            
            # Calcular matriz de confusión
            cm = confusion_matrix(y_val_fold, y_pred_fold)
            confusion_matrices.append(cm)
            
            logger.info(f"\n  Fold {fold + 1}:")
            logger.info(f"    Accuracy: {accuracy_score(y_val_fold, y_pred_fold):.3f}")
        
        # Matriz de confusión promedio
        avg_cm = np.mean(confusion_matrices, axis=0).astype(int)
        
        # Visualizar matriz de confusión promedio
        plt.figure(figsize=(8, 6))
        sns.heatmap(avg_cm, annot=True, fmt='d', cmap='Blues')
        plt.title('Matriz de Confusión Promedio (Validación Cruzada)')
        plt.ylabel('Valor Real')
        plt.xlabel('Predicción')
        plt.tight_layout()
        plt.savefig('confusion_matrix_cv.png')
        logger.info(f"\n💾 Matriz de confusión guardada en: confusion_matrix_cv.png")
        
        # Resumen de resultados
        logger.info("\n📈 Resumen de Validación Cruzada:")
        for metric, scores in cv_results.items():
            logger.info(f"  {metric}: {scores.mean():.3f} ± {scores.std() * 2:.3f}")
        
        return cv_results
    
    def generate_report(self, output_path='validation_report.txt'):
        """Genera un informe completo de validación"""
        logger.info("📝 Generando informe de validación...")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("INFORME DE VALIDACIÓN DEL MODELO DE PREDICCIÓN DE FÚTBOL\n")
            f.write("=" * 80 + "\n\n")
            
            f.write(f"Fecha de generación: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("MÉTRICAS DEL MODELO ORIGINAL:\n")
            f.write("-" * 40 + "\n")
            for metric, value in self.metrics.items():
                f.write(f"{metric.capitalize()}: {value:.4f}\n")
            
            f.write("\n\nCARACTERÍSTICAS UTILIZADAS:\n")
            f.write("-" * 40 + "\n")
            for i, feature in enumerate(self.feature_names, 1):
                f.write(f"{i}. {feature}\n")
            
            f.write("\n\nRECOMENDACIONES PARA MEJORA:\n")
            f.write("-" * 40 + "\n")
            f.write("1. Agregar más datos históricos (3+ temporadas)\n")
            f.write("2. Incluir estadísticas de forma reciente\n")
            f.write("3. Considerar factores externos (lesiones, clima)\n")
            f.write("4. Implementar ensemble de modelos\n")
            f.write("5. Ajustar hiperparámetros con búsqueda bayesiana\n")
        
        logger.info(f"✅ Informe guardado en: {output_path}")

def main():
    """Función principal para validación y optimización"""
    # Cargar datos
    logger.info("📂 Cargando datos de validación...")
    df = pd.read_csv('data/partidos_historicos.csv')
    
    # Crear instancia del validador
    validator = FootballPredictorValidator()
    
    # 1. Validar con partidos futuros
    logger.info("\n" + "="*80)
    logger.info("1. VALIDACIÓN CON PARTIDOS FUTUROS")
    logger.info("="*80)
    future_results = validator.validate_future_matches()
    
    # 2. Optimizar umbrales
    logger.info("\n" + "="*80)
    logger.info("2. OPTIMIZACIÓN DE UMBRALES")
    logger.info("="*80)
    
    # Preparar datos de validación (últimos 20% de los datos históricos)
    n_val = int(len(df) * 0.2)
    df_val = df.tail(n_val)
    X_val = validator.prepare_features(df_val)
    y_val = df_val['result'].values
    
    best_thresholds, y_pred_optimized = validator.optimize_thresholds(X_val, y_val)
    
    # 3. Validación cruzada
    logger.info("\n" + "="*80)
    logger.info("3. VALIDACIÓN CRUZADA K-FOLD")
    logger.info("="*80)
    
    # Usar todos los datos para validación cruzada
    X_all = validator.prepare_features(df)
    y_all = df['result'].values
    
    cv_results = validator.cross_validation(X_all, y_all, cv_folds=5)
    
    # 4. Generar informe
    logger.info("\n" + "="*80)
    logger.info("4. GENERANDO INFORME FINAL")
    logger.info("="*80)
    validator.generate_report()
    
    logger.info("\n🎉 ¡Validación y optimización completadas!")
    logger.info("📊 Revisa los archivos generados:")
    logger.info("   - confusion_matrix_cv.png")
    logger.info("   - validation_report.txt")

if __name__ == '__main__':
    main()