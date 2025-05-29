#!/usr/bin/env python3
# python_service/scripts/fetch_historical_data.py

import os
import sys
import pandas as pd
import numpy as np
import requests
import time
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
import argparse
from typing import List, Dict, Optional

# Añadir directorio padre al path
sys.path.append(str(Path(__file__).parent.parent))

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('data_fetcher')

# Crear directorio de datos si no existe
DATA_DIR = Path(__file__).parent.parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

class HistoricalDataFetcher:
    """
    Clase para obtener datos históricos de fútbol desde múltiples fuentes.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Inicializar el fetcher de datos.
        
        Args:
            api_key: Clave de API para servicios premium (API-Football)
        """
        self.api_key = api_key or os.environ.get('API_FOOTBALL_KEY')
        self.data_dir = DATA_DIR
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Headers para API-Football si tenemos clave
        if self.api_key:
            self.api_headers = {
                'x-rapidapi-key': self.api_key,
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
            }
        
        # URLs base
        self.api_football_url = "https://api-football-v1.p.rapidapi.com/v3"
        self.football_data_url = "https://www.football-data.co.uk"
        
        # Configuración de ligas principales
        self.leagues_config = {
            'Premier League': {
                'api_football_id': 39,
                'football_data_code': 'E0',
                'country': 'England'
            },
            'La Liga': {
                'api_football_id': 140,
                'football_data_code': 'SP1',
                'country': 'Spain'
            },
            'Bundesliga': {
                'api_football_id': 78,
                'football_data_code': 'D1',
                'country': 'Germany'
            },
            'Serie A': {
                'api_football_id': 135,
                'football_data_code': 'I1',
                'country': 'Italy'
            },
            'Ligue 1': {
                'api_football_id': 61,
                'football_data_code': 'F1',
                'country': 'France'
            },
            'Champions League': {
                'api_football_id': 2,
                'football_data_code': None,
                'country': 'Europe'
            }
        }
    
    def fetch_from_api_football(self, leagues: List[str], seasons: List[int]) -> pd.DataFrame:
        """
        Obtener datos desde API-Football (requiere clave de API).
        
        Args:
            leagues: Lista de nombres de ligas
            seasons: Lista de temporadas (años)
            
        Returns:
            DataFrame con datos de partidos
        """
        if not self.api_key:
            raise ValueError("Se requiere API key para usar API-Football")
        
        logger.info("Obteniendo datos desde API-Football...")
        all_matches = []
        
        for league_name in leagues:
            if league_name not in self.leagues_config:
                logger.warning(f"Liga {league_name} no configurada")
                continue
                
            league_id = self.leagues_config[league_name]['api_football_id']
            logger.info(f"Procesando {league_name} (ID: {league_id})")
            
            for season in seasons:
                logger.info(f"Temporada {season}")
                
                try:
                    # Obtener partidos de la temporada
                    url = f"{self.api_football_url}/fixtures"
                    params = {
                        'league': league_id,
                        'season': season
                    }
                    
                    response = requests.get(url, headers=self.api_headers, params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if 'response' in data:
                            matches = self._process_api_football_matches(
                                data['response'], league_name, season
                            )
                            all_matches.extend(matches)
                            logger.info(f"Obtenidos {len(matches)} partidos")
                        
                        # Esperar para respetar límites de API
                        time.sleep(1)
                    else:
                        logger.error(f"Error API: {response.status_code} - {response.text}")
                        
                except Exception as e:
                    logger.error(f"Error obteniendo datos para {league_name} {season}: {e}")
                    continue
        
        if all_matches:
            df = pd.DataFrame(all_matches)
            logger.info(f"Total de partidos obtenidos desde API-Football: {len(df)}")
            return df
        else:
            return pd.DataFrame()
    
    def fetch_from_football_data(self, leagues: List[str], seasons: List[int]) -> pd.DataFrame:
        """
        Obtener datos desde Football-Data.co.uk (gratuito).
        
        Args:
            leagues: Lista de nombres de ligas
            seasons: Lista de temporadas
            
        Returns:
            DataFrame con datos de partidos
        """
        logger.info("Obteniendo datos desde Football-Data.co.uk...")
        all_matches = []
        
        for league_name in leagues:
            if league_name not in self.leagues_config:
                logger.warning(f"Liga {league_name} no configurada")
                continue
                
            league_code = self.leagues_config[league_name]['football_data_code']
            if not league_code:
                logger.warning(f"Liga {league_name} no disponible en Football-Data")
                continue
                
            logger.info(f"Procesando {league_name} ({league_code})")
            
            for season in seasons:
                # Formato de temporada para Football-Data
                season_str = f"{season-1}{str(season)[2:]}"  # 2324 para 2023-24
                
                try:
                    # URL del archivo CSV
                    if season >= 2020:
                        url = f"{self.football_data_url}/mmz4281/{season_str}/{league_code}.csv"
                    else:
                        url = f"{self.football_data_url}/mmz4281/{season_str}/{league_code}.csv"
                    
                    logger.info(f"Descargando: {url}")
                    
                    # Intentar descargar el archivo
                    response = requests.get(url, headers=self.headers)
                    
                    if response.status_code == 200:
                        # Leer CSV desde el contenido
                        from io import StringIO
                        csv_data = StringIO(response.text)
                        df = pd.read_csv(csv_data)
                        
                        # Procesar datos
                        matches = self._process_football_data_matches(
                            df, league_name, season
                        )
                        all_matches.extend(matches)
                        logger.info(f"Obtenidos {len(matches)} partidos")
                        
                        # Pequeña pausa entre requests
                        time.sleep(0.5)
                    else:
                        logger.warning(f"No se pudo descargar {url}: {response.status_code}")
                        
                except Exception as e:
                    logger.error(f"Error obteniendo datos para {league_name} {season}: {e}")
                    continue
        
        if all_matches:
            df = pd.DataFrame(all_matches)
            logger.info(f"Total de partidos obtenidos desde Football-Data: {len(df)}")
            return df
        else:
            return pd.DataFrame()
    
    def fetch_from_kaggle_sample(self) -> pd.DataFrame:
        """
        Generar datos de muestra basados en patrones realistas.
        Útil para testing cuando no hay acceso a APIs.
        
        Returns:
            DataFrame con datos de muestra
        """
        logger.info("Generando datos de muestra...")
        
        # Equipos de ejemplo por liga
        teams_data = {
            'Premier League': [
                'Manchester City', 'Manchester United', 'Liverpool', 'Chelsea', 
                'Arsenal', 'Tottenham', 'Newcastle', 'Brighton',
                'West Ham', 'Aston Villa', 'Crystal Palace', 'Brentford',
                'Fulham', 'Wolves', 'Everton', 'Nottingham Forest',
                'Burnley', 'Sheffield United', 'Luton Town', 'Bournemouth'
            ],
            'La Liga': [
                'Real Madrid', 'Barcelona', 'Atlético Madrid', 'Sevilla',
                'Real Sociedad', 'Real Betis', 'Villarreal', 'Valencia',
                'Athletic Bilbao', 'Getafe', 'Osasuna', 'Las Palmas',
                'Girona', 'Rayo Vallecano', 'Mallorca', 'Celta Vigo',
                'Cadiz', 'Granada', 'Almeria', 'Alaves'
            ]
        }
        
        all_matches = []
        match_id = 1
        
        # Generar 2 temporadas de datos
        for season in [2023, 2024]:
            for league_name, teams in teams_data.items():
                logger.info(f"Generando datos para {league_name} {season}")
                
                # Generar partidos de ida y vuelta
                for i, home_team in enumerate(teams):
                    for j, away_team in enumerate(teams):
                        if i != j:  # No jugar contra sí mismo
                            # Generar resultado realista
                            match_data = self._generate_realistic_match(
                                match_id, home_team, away_team, league_name, season
                            )
                            all_matches.append(match_data)
                            match_id += 1
        
        df = pd.DataFrame(all_matches)
        logger.info(f"Generados {len(df)} partidos de muestra")
        return df
    
    def _process_api_football_matches(self, matches: List[Dict], league_name: str, season: int) -> List[Dict]:
        """Procesar partidos desde API-Football"""
        processed_matches = []
        
        for match in matches:
            # Solo procesar partidos finalizados
            if match['fixture']['status']['short'] != 'FT':
                continue
                
            # Extraer información básica
            match_data = {
                'match_id': match['fixture']['id'],
                'date': match['fixture']['date'][:10],  # Solo fecha
                'season': season,
                'league': league_name,
                'home_team': match['teams']['home']['name'],
                'away_team': match['teams']['away']['name'],
                'home_team_id': match['teams']['home']['id'],
                'away_team_id': match['teams']['away']['id'],
                'home_goals': match['goals']['home'],
                'away_goals': match['goals']['away'],
                'result': self._determine_result(match['goals']['home'], match['goals']['away']),
                'total_goals': match['goals']['home'] + match['goals']['away']
            }
            
            # Añadir datos de estadísticas si están disponibles
            if 'statistics' in match and match['statistics']:
                stats = self._extract_match_statistics(match['statistics'])
                match_data.update(stats)
            
            processed_matches.append(match_data)
        
        return processed_matches
    
    def _process_football_data_matches(self, df: pd.DataFrame, league_name: str, season: int) -> List[Dict]:
        """Procesar partidos desde Football-Data.co.uk"""
        processed_matches = []
        
        for _, row in df.iterrows():
            try:
                # Mapear columnas (pueden variar según la fuente)
                home_goals = int(row.get('FTHG', 0))  # Full Time Home Goals
                away_goals = int(row.get('FTAG', 0))  # Full Time Away Goals
                
                match_data = {
                    'match_id': f"{league_name}_{season}_{len(processed_matches)}",
                    'date': pd.to_datetime(row['Date']).strftime('%Y-%m-%d'),
                    'season': season,
                    'league': league_name,
                    'home_team': row['HomeTeam'],
                    'away_team': row['AwayTeam'],
                    'home_team_id': None,  # No disponible en Football-Data
                    'away_team_id': None,
                    'home_goals': home_goals,
                    'away_goals': away_goals,
                    'result': self._determine_result(home_goals, away_goals),
                    'total_goals': home_goals + away_goals
                }
                
                # Añadir estadísticas adicionales si están disponibles
                additional_stats = {}
                
                # Tiros
                if 'HST' in row:  # Home Shots on Target
                    additional_stats['home_shots_on_target'] = int(row.get('HST', 0))
                if 'AST' in row:  # Away Shots on Target
                    additional_stats['away_shots_on_target'] = int(row.get('AST', 0))
                
                # Corners
                if 'HC' in row:  # Home Corners
                    additional_stats['home_corners'] = int(row.get('HC', 0))
                if 'AC' in row:  # Away Corners
                    additional_stats['away_corners'] = int(row.get('AC', 0))
                
                # Tarjetas
                if 'HY' in row:  # Home Yellow Cards
                    additional_stats['home_yellow_cards'] = int(row.get('HY', 0))
                if 'AY' in row:  # Away Yellow Cards
                    additional_stats['away_yellow_cards'] = int(row.get('AY', 0))
                
                if 'HR' in row:  # Home Red Cards
                    additional_stats['home_red_cards'] = int(row.get('HR', 0))
                if 'AR' in row:  # Away Red Cards
                    additional_stats['away_red_cards'] = int(row.get('AR', 0))
                
                # Faltas
                if 'HF' in row:  # Home Fouls
                    additional_stats['home_fouls'] = int(row.get('HF', 0))
                if 'AF' in row:  # Away Fouls
                    additional_stats['away_fouls'] = int(row.get('AF', 0))
                
                match_data.update(additional_stats)
                processed_matches.append(match_data)
                
            except Exception as e:
                logger.warning(f"Error procesando fila: {e}")
                continue
        
        return processed_matches
    
    def _generate_realistic_match(self, match_id: int, home_team: str, away_team: str, 
                                league_name: str, season: int) -> Dict:
        """Generar un partido con datos realistas"""
        
        # Simular fortaleza de equipos (basado en nombres conocidos)
        home_strength = self._estimate_team_strength(home_team)
        away_strength = self._estimate_team_strength(away_team)
        
        # Ventaja de local
        home_advantage = 0.15
        adjusted_home_strength = min(1.0, home_strength + home_advantage)
        
        # Generar goles usando distribución de Poisson ajustada
        lambda_home = adjusted_home_strength * 2.0
        lambda_away = away_strength * 1.5
        
        home_goals = max(0, int(np.random.poisson(lambda_home)))
        away_goals = max(0, int(np.random.poisson(lambda_away)))
        
        # Generar fecha aleatoria en la temporada
        start_date = datetime(season, 8, 1)  # Agosto
        end_date = datetime(season + 1, 5, 31)  # Mayo siguiente
        random_days = np.random.randint(0, (end_date - start_date).days)
        match_date = start_date + timedelta(days=random_days)
        
        # Generar estadísticas adicionales
        base_stats = {
            'home_shots_on_target': max(1, int(np.random.normal(4 + home_goals, 2))),
            'away_shots_on_target': max(1, int(np.random.normal(3 + away_goals, 2))),
            'home_corners': max(0, int(np.random.normal(5, 2))),
            'away_corners': max(0, int(np.random.normal(4, 2))),
            'home_fouls': max(0, int(np.random.normal(12, 3))),
            'away_fouls': max(0, int(np.random.normal(13, 3))),
            'home_yellow_cards': max(0, int(np.random.poisson(2))),
            'away_yellow_cards': max(0, int(np.random.poisson(2))),
            'home_red_cards': 1 if np.random.random() < 0.05 else 0,
            'away_red_cards': 1 if np.random.random() < 0.05 else 0
        }
        
        return {
            'match_id': match_id,
            'date': match_date.strftime('%Y-%m-%d'),
            'season': season,
            'league': league_name,
            'home_team': home_team,
            'away_team': away_team,
            'home_team_id': hash(home_team) % 10000,  # ID simulado
            'away_team_id': hash(away_team) % 10000,
            'home_goals': home_goals,
            'away_goals': away_goals,
            'result': self._determine_result(home_goals, away_goals),
            'total_goals': home_goals + away_goals,
            **base_stats
        }
    
    def _estimate_team_strength(self, team_name: str) -> float:
        """Estimar fortaleza de equipo basado en el nombre (para datos sintéticos)"""
        # Equipos top-tier
        top_teams = [
            'Manchester City', 'Real Madrid', 'Barcelona', 'Bayern Munich',
            'Liverpool', 'Manchester United', 'Chelsea', 'Arsenal'
        ]
        
        # Equipos mid-tier
        mid_teams = [
            'Tottenham', 'Atlético Madrid', 'Sevilla', 'Borussia Dortmund',
            'Inter Milan', 'AC Milan', 'Napoli', 'Paris Saint-Germain'
        ]
        
        if team_name in top_teams:
            return np.random.uniform(0.75, 0.95)
        elif team_name in mid_teams:
            return np.random.uniform(0.55, 0.75)
        else:
            return np.random.uniform(0.35, 0.65)
    
    def _determine_result(self, home_goals: int, away_goals: int) -> str:
        """Determinar resultado del partido"""
        if home_goals > away_goals:
            return 'H'  # Home win
        elif away_goals > home_goals:
            return 'A'  # Away win
        else:
            return 'D'  # Draw
    
    def _extract_match_statistics(self, statistics: List[Dict]) -> Dict:
        """Extraer estadísticas útiles desde API-Football"""
        stats = {}
        
        for team_stats in statistics:
            team_name = 'home' if team_stats['team']['name'] else 'away'
            
            for stat in team_stats['statistics']:
                stat_type = stat['type'].lower().replace(' ', '_')
                value = stat['value']
                
                # Convertir valores a numéricos cuando sea posible
                if isinstance(value, str):
                    if value.isdigit():
                        value = int(value)
                    elif '%' in value:
                        value = float(value.replace('%', ''))
                
                stats[f"{team_name}_{stat_type}"] = value
        
        return stats
    
    def save_data(self, df: pd.DataFrame, filename: str = 'partidos_historicos.csv'):
        """
        Guardar datos en archivo CSV.
        
        Args:
            df: DataFrame con los datos
            filename: Nombre del archivo
        """
        filepath = self.data_dir / filename
        
        # Asegurar que las columnas estén en orden lógico
        column_order = [
            'match_id', 'date', 'season', 'league',
            'home_team', 'away_team', 'home_team_id', 'away_team_id',
            'home_goals', 'away_goals', 'total_goals', 'result'
        ]
        
        # Añadir columnas adicionales que puedan existir
        additional_columns = [col for col in df.columns if col not in column_order]
        column_order.extend(additional_columns)
        
        # Reordenar columnas
        df = df.reindex(columns=[col for col in column_order if col in df.columns])
        
        # Guardar archivo
        df.to_csv(filepath, index=False)
        logger.info(f"Datos guardados en: {filepath}")
        logger.info(f"Total de registros: {len(df)}")
        
        # Mostrar resumen
        self._print_data_summary(df)
    
    def _print_data_summary(self, df: pd.DataFrame):
        """Mostrar resumen de los datos obtenidos"""
        logger.info("\n" + "="*50)
        logger.info("RESUMEN DE DATOS OBTENIDOS")
        logger.info("="*50)
        
        logger.info(f"Total de partidos: {len(df)}")
        logger.info(f"Rango de fechas: {df['date'].min()} a {df['date'].max()}")
        
        if 'league' in df.columns:
            logger.info("\nPartidos por liga:")
            for league, count in df['league'].value_counts().items():
                logger.info(f"  {league}: {count}")
        
        if 'season' in df.columns:
            logger.info("\nPartidos por temporada:")
            for season, count in df['season'].value_counts().items():
                logger.info(f"  {season}: {count}")
        
        if 'result' in df.columns:
            logger.info("\nDistribución de resultados:")
            results = df['result'].value_counts()
            total = len(df)
            for result, count in results.items():
                pct = (count / total) * 100
                result_name = {'H': 'Victoria Local', 'D': 'Empate', 'A': 'Victoria Visitante'}.get(result, result)
                logger.info(f"  {result_name}: {count} ({pct:.1f}%)")
        
        logger.info("="*50)

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Obtener datos históricos de fútbol')
    parser.add_argument('--source', choices=['api', 'free', 'sample'], default='free',
                      help='Fuente de datos: api (API-Football), free (Football-Data), sample (datos de muestra)')
    parser.add_argument('--leagues', nargs='+', 
                      default=['Premier League', 'La Liga'],
                      help='Ligas a procesar')
    parser.add_argument('--seasons', nargs='+', type=int,
                      default=[2022, 2023, 2024],
                      help='Temporadas a procesar')
    parser.add_argument('--api-key', help='Clave de API para API-Football')
    parser.add_argument('--output', default='partidos_historicos.csv',
                      help='Nombre del archivo de salida')
    
    args = parser.parse_args()
    
    # Crear fetcher
    fetcher = HistoricalDataFetcher(api_key=args.api_key)
    
    try:
        # Obtener datos según la fuente seleccionada
        if args.source == 'api':
            if not fetcher.api_key:
                logger.error("Se requiere API key para usar API-Football")
                logger.info("Obtén tu API key en: https://rapidapi.com/api-sports/api/api-football")
                sys.exit(1)
            df = fetcher.fetch_from_api_football(args.leagues, args.seasons)
            
        elif args.source == 'free':
            df = fetcher.fetch_from_football_data(args.leagues, args.seasons)
            
        elif args.source == 'sample':
            df = fetcher.fetch_from_kaggle_sample()
        
        # Verificar que se obtuvieron datos
        if df.empty:
            logger.error("No se obtuvieron datos")
            sys.exit(1)
        
        # Guardar datos
        fetcher.save_data(df, args.output)
        
        logger.info("✅ Proceso completado exitosamente")
        
    except Exception as e:
        logger.error(f"❌ Error durante la ejecución: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()