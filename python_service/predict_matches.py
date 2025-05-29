#!/usr/bin/env python3
import pandas as pd
import numpy as np
import joblib
import logging
from datetime import datetime
import json

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('match_predictor')

class MatchPredictor:
    def __init__(self, model_path='models/saved/football_predictor.joblib'):
        """Inicializa el predictor con el modelo entrenado"""
        self.model_data = joblib.load(model_path)
        self.model = self.model_data['model']
        self.home_encoder = self.model_data['home_encoder']
        self.away_encoder = self.model_data['away_encoder']
        self.league_encoder = self.model_data['league_encoder']
        self.feature_names = self.model_data['feature_names']
        
        # Umbrales optimizados (valores por defecto)
        self.thresholds = {
            'H': 0.35,  # Victoria Local
            'D': 0.33,  # Empate
            'A': 0.32   # Victoria Visitante
        }
    
    def predict_single_match(self, home_team, away_team, league='Premier League', 
                           stats=None, use_thresholds=True):
        """Predice el resultado de un partido individual"""
        
        # Valores por defecto para estadísticas si no se proporcionan
        if stats is None:
            stats = {
                'home_shots_on_target': 5,
                'away_shots_on_target': 4,
                'home_corners': 5,
                'away_corners': 4,
                'home_fouls': 12,
                'away_fouls': 13,
                'home_yellow_cards': 2,
                'away_yellow_cards': 2,
                'home_red_cards': 0,
                'away_red_cards': 0
            }
        
        # Preparar datos
        match_data = pd.DataFrame([{
            'home_team': home_team,
            'away_team': away_team,
            'league': league,
            **stats
        }])
        
        # Preparar características
        features = []
        
        # Codificar equipos
        if home_team in self.home_encoder.classes_:
            features.append(self.home_encoder.transform([home_team])[0])
        else:
            features.append(-1)
            logger.warning(f"⚠️ Equipo local '{home_team}' no encontrado en datos de entrenamiento")
        
        if away_team in self.away_encoder.classes_:
            features.append(self.away_encoder.transform([away_team])[0])
        else:
            features.append(-1)
            logger.warning(f"⚠️ Equipo visitante '{away_team}' no encontrado en datos de entrenamiento")
        
        if league in self.league_encoder.classes_:
            features.append(self.league_encoder.transform([league])[0])
        else:
            features.append(-1)
            logger.warning(f"⚠️ Liga '{league}' no encontrada en datos de entrenamiento")
        
        # Agregar estadísticas
        for key in ['home_shots_on_target', 'away_shots_on_target', 'home_corners', 
                    'away_corners', 'home_fouls', 'away_fouls', 'home_yellow_cards', 
                    'away_yellow_cards', 'home_red_cards', 'away_red_cards']:
            features.append(stats.get(key, 0))
        
        # Características derivadas
        features.append(stats.get('home_shots_on_target', 0) - stats.get('away_shots_on_target', 0))
        features.append(stats.get('home_corners', 0) - stats.get('away_corners', 0))
        features.append(stats.get('home_fouls', 0) - stats.get('away_fouls', 0))
        
        # Estadísticas históricas (simplificadas)
        features.extend([0.4, 0.3, 0.3, 0.3, 0.1])  # Valores por defecto
        
        # Hacer predicción
        X = np.array(features).reshape(1, -1)
        probabilities = self.model.predict_proba(X)[0]
        
        # Obtener clases y sus probabilidades
        classes = self.model.classes_
        prob_dict = {cls: prob for cls, prob in zip(classes, probabilities)}
        
        # Aplicar umbrales si está habilitado
        if use_thresholds:
            prediction = self._apply_thresholds(prob_dict)
        else:
            prediction = max(prob_dict, key=prob_dict.get)
        
        # Preparar resultado
        result = {
            'match': f"{home_team} vs {away_team}",
            'league': league,
            'prediction': prediction,
            'prediction_name': self._get_result_name(prediction),
            'probabilities': prob_dict,
            'confidence': max(probabilities),
            'timestamp': datetime.now().isoformat()
        }
        
        return result
    
    def _apply_thresholds(self, prob_dict):
        """Aplica umbrales optimizados a las probabilidades"""
        qualified = {}
        
        for cls, prob in prob_dict.items():
            if prob >= self.thresholds.get(cls, 0.33):
                qualified[cls] = prob
        
        if qualified:
            return max(qualified, key=qualified.get)
        else:
            return max(prob_dict, key=prob_dict.get)
    
    def _get_result_name(self, result):
        """Convierte código de resultado a nombre legible"""
        names = {
            'H': 'Victoria Local',
            'D': 'Empate',
            'A': 'Victoria Visitante'
        }
        return names.get(result, result)
    
    def predict_multiple_matches(self, matches_file):
        """Predice múltiples partidos desde un archivo CSV"""
        logger.info(f"📂 Cargando partidos desde: {matches_file}")
        
        df = pd.read_csv(matches_file)
        results = []
        
        for idx, row in df.iterrows():
            stats = {col: row[col] for col in row.index 
                    if col not in ['home_team', 'away_team', 'league', 'date']}
            
            result = self.predict_single_match(
                home_team=row['home_team'],
                away_team=row['away_team'],
                league=row.get('league', 'Premier League'),
                stats=stats if stats else None
            )
            
            results.append(result)
        
        return results
    
    def save_predictions(self, predictions, output_file='predictions.json'):
        """Guarda las predicciones en un archivo JSON"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(predictions, f, indent=2, ensure_ascii=False)
        logger.info(f"💾 Predicciones guardadas en: {output_file}")

def interactive_prediction():
    """Modo interactivo para hacer predicciones"""
    predictor = MatchPredictor()
    
    print("\n" + "="*60)
    print("🏆 PREDICTOR DE PARTIDOS DE FÚTBOL - MODO INTERACTIVO")
    print("="*60)
    
    while True:
        print("\n¿Qué deseas hacer?")
        print("1. Predecir un partido individual")
        print("2. Predecir múltiples partidos desde archivo")
        print("3. Salir")
        
        choice = input("\nSelecciona una opción (1-3): ")
        
        if choice == '1':
            # Predicción individual
            print("\n📝 Ingresa los datos del partido:")
            home_team = input("Equipo local: ")
            away_team = input("Equipo visitante: ")
            league = input("Liga (Premier League/La Liga) [Premier League]: ") or "Premier League"
            
            print("\n¿Deseas ingresar estadísticas del partido? (s/n): ", end="")
            if input().lower() == 's':
                stats = {}
                stats['home_shots_on_target'] = int(input("Tiros a puerta local [5]: ") or 5)
                stats['away_shots_on_target'] = int(input("Tiros a puerta visitante [4]: ") or 4)
                stats['home_corners'] = int(input("Córners local [5]: ") or 5)
                stats['away_corners'] = int(input("Córners visitante [4]: ") or 4)
                stats['home_fouls'] = int(input("Faltas local [12]: ") or 12)
                stats['away_fouls'] = int(input("Faltas visitante [13]: ") or 13)
                stats['home_yellow_cards'] = int(input("Tarjetas amarillas local [2]: ") or 2)
                stats['away_yellow_cards'] = int(input("Tarjetas amarillas visitante [2]: ") or 2)
                stats['home_red_cards'] = int(input("Tarjetas rojas local [0]: ") or 0)
                stats['away_red_cards'] = int(input("Tarjetas rojas visitante [0]: ") or 0)
            else:
                stats = None
            
            # Hacer predicción
            result = predictor.predict_single_match(home_team, away_team, league, stats)
            
            # Mostrar resultado
            print("\n" + "="*60)
            print("🎯 PREDICCIÓN:")
            print(f"Partido: {result['match']}")
            print(f"Liga: {result['league']}")
            print(f"Resultado predicho: {result['prediction_name']}")
            print(f"Confianza: {result['confidence']:.1%}")
            print("\nProbabilidades:")
            for cls, prob in result['probabilities'].items():
                name = predictor._get_result_name(cls)
                print(f"  {name}: {prob:.1%}")
            print("="*60)
            
        elif choice == '2':
            # Predicción múltiple
            file_path = input("\nRuta del archivo CSV con partidos: ")
            try:
                results = predictor.predict_multiple_matches(file_path)
                
                print(f"\n📊 Predicciones para {len(results)} partidos:")
                print("-"*80)
                
                for result in results:
                    print(f"\n{result['match']} ({result['league']})")
                    print(f"Predicción: {result['prediction_name']} (Confianza: {result['confidence']:.1%})")
                    probs_str = ", ".join([f"{predictor._get_result_name(k)}: {v:.1%}" 
                                         for k, v in result['probabilities'].items()])
                    print(f"Probabilidades: {probs_str}")
                
                # Guardar resultados
                save = input("\n¿Deseas guardar las predicciones? (s/n): ")
                if save.lower() == 's':
                    output_file = input("Nombre del archivo de salida [predictions.json]: ") or "predictions.json"
                    predictor.save_predictions(results, output_file)
                    
            except Exception as e:
                print(f"\n❌ Error: {e}")
                
        elif choice == '3':
            print("\n👋 ¡Hasta luego!")
            break
        else:
            print("\n❌ Opción no válida. Por favor, selecciona 1, 2 o 3.")

def main():
    """Función principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Predictor de partidos de fútbol')
    parser.add_argument('--interactive', '-i', action='store_true', 
                       help='Modo interactivo')
    parser.add_argument('--home', '-h1', type=str, help='Equipo local')
    parser.add_argument('--away', '-a', type=str, help='Equipo visitante')
    parser.add_argument('--league', '-l', type=str, default='Premier League',
                       help='Liga del partido')
    parser.add_argument('--file', '-f', type=str, help='Archivo CSV con múltiples partidos')
    parser.add_argument('--output', '-o', type=str, default='predictions.json',
                       help='Archivo de salida para predicciones')
    
    args = parser.parse_args()
    
    if args.interactive:
        interactive_prediction()
    elif args.home and args.away:
        # Predicción individual desde línea de comandos
        predictor = MatchPredictor()
        result = predictor.predict_single_match(args.home, args.away, args.league)
        
        print("\n" + "="*60)
        print("🎯 PREDICCIÓN:")
        print(f"Partido: {result['match']}")
        print(f"Liga: {result['league']}")
        print(f"Resultado predicho: {result['prediction_name']}")
        print(f"Confianza: {result['confidence']:.1%}")
        print("\nProbabilidades:")
        for cls, prob in result['probabilities'].items():
            name = predictor._get_result_name(cls)
            print(f"  {name}: {prob:.1%}")
        print("="*60)
        
    elif args.file:
        # Predicción múltiple desde archivo
        predictor = MatchPredictor()
        results = predictor.predict_multiple_matches(args.file)
        predictor.save_predictions(results, args.output)
        
        print(f"\n✅ {len(results)} predicciones guardadas en: {args.output}")
    else:
        parser.print_help()

if __name__ == '__main__':
    main()