import pandas as pd
import numpy as np
import requests
import os
import json
import logging
import time
from datetime import datetime, timedelta
import sqlite3
import traceback

# Configurar logging
logger = logging.getLogger('predictor_futbol_premium.data_manager')

class DataManager:
    """
    Gestor de datos para el Predictor de Fútbol Premium.
    Se encarga de obtener, procesar y almacenar datos de partidos y equipos.
    """
    
    def __init__(self, db_path=None, api_key=None):
        """
        Inicializa el gestor de datos.
        
        Args:
            db_path (str, opcional): Ruta a la base de datos SQLite. Por defecto usa memoria.
            api_key (str, opcional): Clave de API para servicios externos.
        """
        # Configuración básica
        self.db_path = db_path or ':memory:'
        self.api_key = api_key or os.environ.get('API_FOOTBALL_KEY', '')
        self.cache = {}
        self.cache_ttl = {}  # Time-to-live para cada entrada en caché
        self.default_ttl = 3600  # 1 hora en segundos
        
        # Base URLs para APIs
        self.api_football_url = "https://api-football-v1.p.rapidapi.com/v3"
        self.headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
        }
        
        # Inicializar base de datos
        self._init_database()
        
        logger.info("DataManager inicializado correctamente")
    
    def _init_database(self):
        """Inicializa la base de datos SQLite para almacenamiento local"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            
            # Crear tablas si no existen
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                country TEXT,
                league_id INTEGER,
                stats TEXT,
                last_updated TIMESTAMP
            )
            ''')
            
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY,
                date TEXT NOT NULL,
                home_team_id INTEGER,
                away_team_id INTEGER,
                league_id INTEGER,
                status TEXT,
                score TEXT,
                stats TEXT,
                last_updated TIMESTAMP,
                FOREIGN KEY (home_team_id) REFERENCES teams (id),
                FOREIGN KEY (away_team_id) REFERENCES teams (id)
            )
            ''')
            
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                match_id INTEGER,
                prediction TEXT,
                probabilities TEXT,
                confidence REAL,
                created_at TIMESTAMP,
                result TEXT,
                FOREIGN KEY (match_id) REFERENCES matches (id)
            )
            ''')
            
            self.conn.commit()
            logger.info("Base de datos inicializada correctamente")
            
        except Exception as e:
            logger.error(f"Error inicializando base de datos: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Fallback a modo sin persistencia
            self.conn = None
            self.cursor = None
    
    def get_team_stats(self, team_id):
        """
        Obtiene estadísticas de un equipo por ID.
        
        Args:
            team_id (int): ID del equipo
            
        Returns:
            dict: Estadísticas del equipo
        """
        # Verificar caché primero
        cache_key = f"team_stats_{team_id}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        # Verificar base de datos local
        if self.conn:
            try:
                self.cursor.execute("SELECT stats FROM teams WHERE id=?", (team_id,))
                result = self.cursor.fetchone()
                if result and result[0]:
                    stats = json.loads(result[0])
                    # Solo usar datos no caducados (< 7 días)
                    if 'last_updated' in stats:
                        last_updated = datetime.fromisoformat(stats['last_updated'])
                        if (datetime.now() - last_updated) < timedelta(days=7):
                            # Guardar en caché antes de devolver
                            self._add_to_cache(cache_key, {'status': 'success', 'data': stats})
                            return {'status': 'success', 'data': stats}
            except Exception as e:
                logger.error(f"Error consultando estadísticas de equipo en BD: {str(e)}")
        
        # Si no hay datos en caché o base de datos, intentar API
        try:
            if not self.api_key:
                logger.warning("No hay API key configurada")
                return {'status': 'error', 'message': 'API key no configurada'}
            
            # Consultar datos básicos del equipo
            url = f"{self.api_football_url}/teams"
            response = requests.get(url, headers=self.headers, params={'id': team_id})
            
            if response.status_code != 200:
                logger.error(f"Error API: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f"Error de API: {response.status_code}"}
            
            team_data = response.json()
            
            if 'response' not in team_data or len(team_data['response']) == 0:
                logger.warning(f"No se encontraron datos para el equipo {team_id}")
                return {'status': 'error', 'message': 'Equipo no encontrado'}
            
            team_info = team_data['response'][0]
            
            # Obtener estadísticas adicionales (último año)
            current_year = datetime.now().year
            stats_url = f"{self.api_football_url}/teams/statistics"
            stats_params = {
                'team': team_id,
                'season': current_year
            }
            
            # Esperar antes de hacer otra solicitud para evitar límites de API
            time.sleep(0.5)
            
            stats_response = requests.get(
                stats_url, 
                headers=self.headers, 
                params=stats_params
            )
            
            # Procesar estadísticas y combinar con información del equipo
            team_stats = {}
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                if 'response' in stats_data:
                    raw_stats = stats_data['response']
                    # Extraer estadísticas relevantes
                    team_stats = self._process_team_stats(raw_stats, team_info)
            
            # Guardar en base de datos
            if self.conn:
                try:
                    stats_json = json.dumps(team_stats)
                    self.cursor.execute(
                        """
                        INSERT OR REPLACE INTO teams 
                        (id, name, country, league_id, stats, last_updated) 
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, 
                        (
                            team_id, 
                            team_info['team']['name'], 
                            team_info['team'].get('country', ''), 
                            team_stats.get('league_id', None),
                            stats_json,
                            datetime.now().isoformat()
                        )
                    )
                    self.conn.commit()
                except Exception as e:
                    logger.error(f"Error guardando estadísticas en BD: {str(e)}")
            
            # Guardar en caché
            result = {'status': 'success', 'data': team_stats}
            self._add_to_cache(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo estadísticas del equipo: {str(e)}")
            logger.error(traceback.format_exc())
            return {'status': 'error', 'message': str(e)}
    
    def get_match_data(self, match_id=None, home_team_id=None, away_team_id=None, date=None):
        """
        Obtiene datos de un partido por ID o por equipos y fecha.
        
        Args:
            match_id (int, opcional): ID del partido
            home_team_id (int, opcional): ID del equipo local
            away_team_id (int, opcional): ID del equipo visitante
            date (str, opcional): Fecha del partido (YYYY-MM-DD)
            
        Returns:
            dict: Datos completos del partido
        """
        # Verificar si tenemos ID de partido
        if match_id:
            cache_key = f"match_{match_id}"
            # Verificar caché
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data
            
            # Verificar base de datos
            if self.conn:
                try:
                    self.cursor.execute("SELECT * FROM matches WHERE id=?", (match_id,))
                    match_row = self.cursor.fetchone()
                    if match_row:
                        match_data = self._process_match_row(match_row)
                        # Verificar si los datos son recientes (< 1 día)
                        if 'last_updated' in match_data:
                            last_updated = datetime.fromisoformat(match_data['last_updated'])
                            if (datetime.now() - last_updated) < timedelta(days=1):
                                # Guardar en caché antes de devolver
                                self._add_to_cache(cache_key, {'status': 'success', 'data': match_data})
                                return {'status': 'success', 'data': match_data}
                except Exception as e:
                    logger.error(f"Error consultando partido en BD: {str(e)}")
            
            # Consultar API
            try:
                if not self.api_key:
                    logger.warning("No hay API key configurada")
                    return {'status': 'error', 'message': 'API key no configurada'}
                
                url = f"{self.api_football_url}/fixtures"
                response = requests.get(
                    url, 
                    headers=self.headers, 
                    params={'id': match_id}
                )
                
                if response.status_code != 200:
                    logger.error(f"Error API: {response.status_code} - {response.text}")
                    return {'status': 'error', 'message': f"Error de API: {response.status_code}"}
                
                match_data = response.json()
                
                if 'response' not in match_data or len(match_data['response']) == 0:
                    logger.warning(f"No se encontraron datos para el partido {match_id}")
                    return {'status': 'error', 'message': 'Partido no encontrado'}
                
                # Procesar datos del partido
                processed_match = self._process_match_data(match_data['response'][0])
                
                # Guardar en base de datos
                self._save_match_to_db(processed_match)
                
                # Guardar en caché
                result = {'status': 'success', 'data': processed_match}
                self._add_to_cache(cache_key, result)
                
                return result
                
            except Exception as e:
                logger.error(f"Error obteniendo datos del partido: {str(e)}")
                logger.error(traceback.format_exc())
                return {'status': 'error', 'message': str(e)}
                
        # Si no tenemos ID, pero sí equipos y fecha
        elif home_team_id and away_team_id and date:
            cache_key = f"match_{home_team_id}_{away_team_id}_{date}"
            # Verificar caché
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                return cached_data
            
            # Verificar base de datos
            if self.conn:
                try:
                    self.cursor.execute(
                        """
                        SELECT * FROM matches 
                        WHERE home_team_id=? AND away_team_id=? AND date LIKE ?
                        """, 
                        (home_team_id, away_team_id, f"{date}%")
                    )
                    match_row = self.cursor.fetchone()
                    if match_row:
                        match_data = self._process_match_row(match_row)
                        # Verificar si los datos son recientes (< 1 día)
                        if 'last_updated' in match_data:
                            last_updated = datetime.fromisoformat(match_data['last_updated'])
                            if (datetime.now() - last_updated) < timedelta(days=1):
                                # Guardar en caché antes de devolver
                                self._add_to_cache(cache_key, {'status': 'success', 'data': match_data})
                                return {'status': 'success', 'data': match_data}
                except Exception as e:
                    logger.error(f"Error consultando partido en BD: {str(e)}")
            
            # Consultar API
            try:
                if not self.api_key:
                    logger.warning("No hay API key configurada")
                    return {'status': 'error', 'message': 'API key no configurada'}
                
                url = f"{self.api_football_url}/fixtures"
                params = {
                    'team': home_team_id,
                    'date': date
                }
                response = requests.get(url, headers=self.headers, params=params)
                
                if response.status_code != 200:
                    logger.error(f"Error API: {response.status_code} - {response.text}")
                    return {'status': 'error', 'message': f"Error de API: {response.status_code}"}
                
                fixtures_data = response.json()
                
                if 'response' not in fixtures_data or len(fixtures_data['response']) == 0:
                    logger.warning(f"No se encontraron partidos para {home_team_id} vs {away_team_id} el {date}")
                    return {'status': 'error', 'message': 'Partido no encontrado'}
                
                # Buscar partido específico entre los equipos
                match_data = None
                for fixture in fixtures_data['response']:
                    if (fixture['teams']['home']['id'] == home_team_id and 
                        fixture['teams']['away']['id'] == away_team_id):
                        match_data = fixture
                        break
                
                if not match_data:
                    logger.warning(f"No se encontró el partido específico {home_team_id} vs {away_team_id}")
                    return {'status': 'error', 'message': 'Partido específico no encontrado'}
                
                # Procesar datos del partido
                processed_match = self._process_match_data(match_data)
                
                # Guardar en base de datos
                self._save_match_to_db(processed_match)
                
                # Guardar en caché
                result = {'status': 'success', 'data': processed_match}
                self._add_to_cache(cache_key, result)
                
                return result
                
            except Exception as e:
                logger.error(f"Error obteniendo datos del partido por equipos: {str(e)}")
                logger.error(traceback.format_exc())
                return {'status': 'error', 'message': str(e)}
        
        else:
            return {'status': 'error', 'message': 'Se requiere ID de partido o IDs de equipos y fecha'}
    
    def get_h2h_data(self, team1_id, team2_id, limit=10):
        """
        Obtiene historial de enfrentamientos entre dos equipos.
        
        Args:
            team1_id (int): ID del primer equipo
            team2_id (int): ID del segundo equipo
            limit (int): Número máximo de partidos a obtener
            
        Returns:
            dict: Historial de enfrentamientos
        """
        cache_key = f"h2h_{team1_id}_{team2_id}_{limit}"
        
        # Verificar caché
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        # Consultar API
        try:
            if not self.api_key:
                logger.warning("No hay API key configurada")
                return {'status': 'error', 'message': 'API key no configurada'}
            
            url = f"{self.api_football_url}/fixtures/headtohead"
            params = {
                'h2h': f"{team1_id}-{team2_id}",
                'last': limit
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"Error API: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f"Error de API: {response.status_code}"}
            
            h2h_data = response.json()
            
            if 'response' not in h2h_data:
                logger.warning(f"Formato inesperado en respuesta H2H")
                return {'status': 'error', 'message': 'Formato inesperado en respuesta'}
            
            # Procesar datos h2h
            matches = []
            for fixture in h2h_data['response']:
                # Extraer información relevante del partido
                match_info = {
                    'id': fixture['fixture']['id'],
                    'date': fixture['fixture']['date'],
                    'home_team': {
                        'id': fixture['teams']['home']['id'],
                        'name': fixture['teams']['home']['name'],
                        'winner': fixture['teams']['home'].get('winner', None)
                    },
                    'away_team': {
                        'id': fixture['teams']['away']['id'],
                        'name': fixture['teams']['away']['name'],
                        'winner': fixture['teams']['away'].get('winner', None)
                    },
                    'score': {
                        'home': fixture['goals']['home'],
                        'away': fixture['goals']['away']
                    },
                    'league': {
                        'id': fixture['league']['id'],
                        'name': fixture['league']['name'],
                        'country': fixture['league']['country']
                    }
                }
                matches.append(match_info)
            
            # Calcular estadísticas h2h
            stats = self._calculate_h2h_stats(matches, team1_id, team2_id)
            
            # Estructura de respuesta
            result = {
                'status': 'success',
                'data': {
                    'matches': matches,
                    'stats': stats,
                    'team1_id': team1_id,
                    'team2_id': team2_id
                }
            }
            
            # Guardar en caché
            self._add_to_cache(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo datos H2H: {str(e)}")
            logger.error(traceback.format_exc())
            return {'status': 'error', 'message': str(e)}
    
    def get_league_standings(self, league_id, season=None):
        """
        Obtiene clasificación actual de una liga.
        
        Args:
            league_id (int): ID de la liga
            season (int, opcional): Temporada (año)
            
        Returns:
            dict: Clasificación de la liga
        """
        # Si no se especifica temporada, usar año actual
        if not season:
            season = datetime.now().year
        
        cache_key = f"standings_{league_id}_{season}"
        
        # Verificar caché
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        # Consultar API
        try:
            if not self.api_key:
                logger.warning("No hay API key configurada")
                return {'status': 'error', 'message': 'API key no configurada'}
            
            url = f"{self.api_football_url}/standings"
            params = {
                'league': league_id,
                'season': season
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code != 200:
                logger.error(f"Error API: {response.status_code} - {response.text}")
                return {'status': 'error', 'message': f"Error de API: {response.status_code}"}
            
            standings_data = response.json()
            
            if ('response' not in standings_data or 
                len(standings_data['response']) == 0 or 
                'league' not in standings_data['response'][0]):
                logger.warning(f"Formato inesperado en respuesta de clasificación")
                return {'status': 'error', 'message': 'Formato inesperado en respuesta'}
            
            # Extraer datos de clasificación
            league_data = standings_data['response'][0]['league']
            
            # Estructura de respuesta
            result = {
                'status': 'success',
                'data': {
                    'league': {
                        'id': league_data['id'],
                        'name': league_data['name'],
                        'country': league_data['country'],
                        'logo': league_data.get('logo', None),
                        'season': season
                    },
                    'standings': league_data['standings']
                }
            }
            
            # Guardar en caché (1 día)
            self._add_to_cache(cache_key, result, ttl=86400)
            
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo clasificación: {str(e)}")
            logger.error(traceback.format_exc())
            return {'status': 'error', 'message': str(e)}
    
    def save_prediction(self, match_id, prediction_data):
        """
        Guarda una predicción en la base de datos.
        
        Args:
            match_id (int): ID del partido
            prediction_data (dict): Datos de la predicción
            
        Returns:
            dict: Estado de la operación
        """
        if not self.conn:
            logger.warning("Base de datos no disponible para guardar predicción")
            return {'status': 'error', 'message': 'Base de datos no disponible'}
        
        try:
            # Verificar si el partido existe
            self.cursor.execute("SELECT id FROM matches WHERE id=?", (match_id,))
            match_exists = self.cursor.fetchone()
            
            if not match_exists:
                logger.warning(f"Intento de guardar predicción para partido inexistente: {match_id}")
                return {'status': 'error', 'message': 'Partido no encontrado'}
            
            # Convertir campos a JSON si es necesario
            if 'probabilities' in prediction_data and isinstance(prediction_data['probabilities'], dict):
                probabilities_json = json.dumps(prediction_data['probabilities'])
            else:
                probabilities_json = '{}'
            
            # Insertar predicción
            self.cursor.execute(
                """
                INSERT INTO predictions 
                (match_id, prediction, probabilities, confidence, created_at) 
                VALUES (?, ?, ?, ?, ?)
                """, 
                (
                    match_id,
                    prediction_data.get('prediction', ''),
                    probabilities_json,
                    prediction_data.get('confidence', 0.0),
                    datetime.now().isoformat()
                )
            )
            
            self.conn.commit()
            
            return {
                'status': 'success',
                'message': 'Predicción guardada correctamente',
                'prediction_id': self.cursor.lastrowid
            }
            
        except Exception as e:
            logger.error(f"Error guardando predicción: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def get_predictions_history(self, limit=50, offset=0):
        """
        Obtiene historial de predicciones realizadas.
        
        Args:
            limit (int): Límite de resultados
            offset (int): Desplazamiento para paginación
            
        Returns:
            dict: Historial de predicciones
        """
        if not self.conn:
            logger.warning("Base de datos no disponible para consultar historial")
            return {'status': 'error', 'message': 'Base de datos no disponible'}
        
        try:
            # Consultar predicciones con información de partidos
            self.cursor.execute(
                """
                SELECT p.id, p.match_id, p.prediction, p.probabilities, p.confidence, 
                       p.created_at, p.result, m.date, m.home_team_id, m.away_team_id, 
                       t1.name as home_team_name, t2.name as away_team_name, m.score
                FROM predictions p
                JOIN matches m ON p.match_id = m.id
                JOIN teams t1 ON m.home_team_id = t1.id
                JOIN teams t2 ON m.away_team_id = t2.id
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
                """, 
                (limit, offset)
            )
            
            rows = self.cursor.fetchall()
            
            predictions = []
            for row in rows:
                # Obtener nombres de columnas
                columns = [desc[0] for desc in self.cursor.description]
                prediction_data = dict(zip(columns, row))
                
                # Convertir JSON a diccionario
                if 'probabilities' in prediction_data:
                    try:
                        prediction_data['probabilities'] = json.loads(prediction_data['probabilities'])
                    except:
                        prediction_data['probabilities'] = {}
                
                if 'score' in prediction_data:
                    try:
                        prediction_data['score'] = json.loads(prediction_data['score'])
                    except:
                        prediction_data['score'] = {}
                
                predictions.append(prediction_data)
            
            # Contar total para paginación
            self.cursor.execute("SELECT COUNT(*) FROM predictions")
            total = self.cursor.fetchone()[0]
            
            return {
                'status': 'success',
                'data': {
                    'predictions': predictions,
                    'pagination': {
                        'total': total,
                        'limit': limit,
                        'offset': offset,
                        'has_more': (offset + limit) < total
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error consultando historial de predicciones: {str(e)}")
            logger.error(traceback.format_exc())
            return {'status': 'error', 'message': str(e)}
    
    def _process_team_stats(self, raw_stats, team_info):
        """Procesa estadísticas de equipo en formato útil para el modelo"""
        team_stats = {
            'team_id': team_info['team']['id'],
            'team_name': team_info['team']['name'],
            'country': team_info['team'].get('country', ''),
            'last_updated': datetime.now().isoformat()
        }
        
        # Si hay estadísticas de liga
        if 'league' in raw_stats:
            team_stats['league_id'] = raw_stats['league']['id']
            team_stats['league_name'] = raw_stats['league']['name']
            team_stats['season'] = raw_stats['league'].get('season', datetime.now().year)
        
        # Estadísticas de partidos
        if 'fixtures' in raw_stats:
            team_stats['matches_played'] = {
                'total': raw_stats['fixtures']['played'].get('total', 0),
                'home': raw_stats['fixtures']['played'].get('home', 0),
                'away': raw_stats['fixtures']['played'].get('away', 0)
            }
            team_stats['wins'] = {
                'total': raw_stats['fixtures']['wins'].get('total', 0),
                'home': raw_stats['fixtures']['wins'].get('home', 0),
                'away': raw_stats['fixtures']['wins'].get('away', 0)
            }
            team_stats['draws'] = {
                'total': raw_stats['fixtures']['draws'].get('total', 0),
                'home': raw_stats['fixtures']['draws'].get('home', 0),
                'away': raw_stats['fixtures']['draws'].get('away', 0)
            }
            team_stats['losses'] = {
                'total': raw_stats['fixtures']['loses'].get('total', 0),
                'home': raw_stats['fixtures']['loses'].get('home', 0),
                'away': raw_stats['fixtures']['loses'].get('away', 0)
            }
        
        # Estadísticas de goles
        if 'goals' in raw_stats:
            team_stats['goals_for'] = {
                'total': raw_stats['goals']['for']['total'].get('total', 0),
                'home': raw_stats['goals']['for']['total'].get('home', 0),
                'away': raw_stats['goals']['for']['total'].get('away', 0),
                'average': raw_stats['goals']['for']['average'].get('total', 0)
            }
            team_stats['goals_against'] = {
                'total': raw_stats['goals']['against']['total'].get('total', 0),
                'home': raw_stats['goals']['against']['total'].get('home', 0),
                'away': raw_stats['goals']['against']['total'].get('away', 0),
                'average': raw_stats['goals']['against']['average'].get('total', 0)
            }
        
        # Forma reciente
        if 'form' in raw_stats:
            team_stats['form'] = raw_stats['form']
            # Calcular puntos de forma (W=3, D=1, L=0)
            form_points = 0
            if isinstance(raw_stats['form'], str):
                for result in raw_stats['form']:
                    if result == 'W':
                        form_points += 3
                    elif result == 'D':
                        form_points += 1
                team_stats['form_points'] = form_points
        
        # Clean sheets (portería a cero)
        if 'clean_sheet' in raw_stats:
            team_stats['clean_sheets'] = {
                'total': raw_stats['clean_sheet'].get('total', 0),
                'home': raw_stats['clean_sheet'].get('home', 0),
                'away': raw_stats['clean_sheet'].get('away', 0)
            }
        
        # Fallos en marcar
        if 'failed_to_score' in raw_stats:
            team_stats['failed_to_score'] = {
                'total': raw_stats['failed_to_score'].get('total', 0),
                'home': raw_stats['failed_to_score'].get('home', 0),
                'away': raw_stats['failed_to_score'].get('away', 0)
            }
        
        # Calcular métricas derivadas
        # Puntos por partido
        matches_played = team_stats.get('matches_played', {}).get('total', 0)
        if matches_played > 0:
            wins = team_stats.get('wins', {}).get('total', 0)
            draws = team_stats.get('draws', {}).get('total', 0)
            points = (wins * 3) + draws
            team_stats['points'] = points
            team_stats['points_per_game'] = round(points / matches_played, 2)
            
            # Porcentaje de victorias
            team_stats['win_percentage'] = round((wins / matches_played) * 100, 2)
            
            # Porcentaje de clean sheets
            clean_sheets = team_stats.get('clean_sheets', {}).get('total', 0)
            team_stats['clean_sheet_percentage'] = round((clean_sheets / matches_played) * 100, 2)
            
            # Promedio de goles marcados y recibidos
            goals_for = team_stats.get('goals_for', {}).get('total', 0)
            goals_against = team_stats.get('goals_against', {}).get('total', 0)
            team_stats['goals_scored_per_game'] = round(goals_for / matches_played, 2)
            team_stats['goals_conceded_per_game'] = round(goals_against / matches_played, 2)
        
        return team_stats
    
    def _process_match_data(self, match_data):
        """Procesa datos de un partido en formato útil para el modelo"""
        processed_match = {
            'id': match_data['fixture']['id'],
            'date': match_data['fixture']['date'],
            'timestamp': match_data['fixture']['timestamp'],
            'venue': {
                'name': match_data['fixture']['venue'].get('name', ''),
                'city': match_data['fixture']['venue'].get('city', '')
            },
            'referee': match_data['fixture'].get('referee', ''),
            'home_team': {
                'id': match_data['teams']['home']['id'],
                'name': match_data['teams']['home']['name'],
                'logo': match_data['teams']['home'].get('logo', '')
            },
            'away_team': {
                'id': match_data['teams']['away']['id'],
                'name': match_data['teams']['away']['name'],
                'logo': match_data['teams']['away'].get('logo', '')
            },
            'league': {
                'id': match_data['league']['id'],
                'name': match_data['league']['name'],
                'country': match_data['league']['country'],
                'logo': match_data['league'].get('logo', ''),
                'season': match_data['league'].get('season', '')
            },
            'status': {
                'short': match_data['fixture']['status']['short'],
                'long': match_data['fixture']['status']['long']
            },
            'last_updated': datetime.now().isoformat()
        }
        
        # Añadir resultado si está disponible
        if 'goals' in match_data:
            processed_match['score'] = {
                'home': match_data['goals'].get('home', None),
                'away': match_data['goals'].get('away', None)
            }
        
        # Añadir estadísticas si están disponibles
        if 'statistics' in match_data and match_data['statistics']:
            processed_match['statistics'] = match_data['statistics']
        
        # Añadir alineaciones si están disponibles
        if 'lineups' in match_data and match_data['lineups']:
            processed_match['lineups'] = match_data['lineups']
        
        # Añadir eventos si están disponibles (goles, tarjetas, etc.)
        if 'events' in match_data and match_data['events']:
            processed_match['events'] = match_data['events']
        
        return processed_match
    
    def _process_match_row(self, match_row):
        """Convierte una fila de la base de datos en un diccionario de partido"""
        # Obtener nombres de columnas
        columns = ['id', 'date', 'home_team_id', 'away_team_id', 'league_id', 
                   'status', 'score', 'stats', 'last_updated']
        
        match_dict = dict(zip(columns, match_row))
        
        # Convertir JSON a diccionario
        if match_dict['score'] and isinstance(match_dict['score'], str):
            match_dict['score'] = json.loads(match_dict['score'])
        
        if match_dict['stats'] and isinstance(match_dict['stats'], str):
            match_dict['stats'] = json.loads(match_dict['stats'])
        
        return match_dict
    
    def _save_match_to_db(self, match_data):
        """Guarda datos de un partido en la base de datos"""
        if not self.conn:
            logger.warning("Base de datos no disponible para guardar partido")
            return False
        
        try:
            # Convertir estructuras complejas a JSON
            score_json = json.dumps(match_data.get('score', {}))
            stats_json = json.dumps(match_data.get('statistics', {}))
            
            # Insertar o actualizar partido
            self.cursor.execute(
                """
                INSERT OR REPLACE INTO matches 
                (id, date, home_team_id, away_team_id, league_id, status, score, stats, last_updated) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, 
                (
                    match_data['id'],
                    match_data['date'],
                    match_data['home_team']['id'],
                    match_data['away_team']['id'],
                    match_data['league']['id'],
                    json.dumps(match_data['status']),
                    score_json,
                    stats_json,
                    datetime.now().isoformat()
                )
            )
            
            self.conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error guardando partido en BD: {str(e)}")
            return False
    
    def _calculate_h2h_stats(self, matches, team1_id, team2_id):
        """Calcula estadísticas de enfrentamientos directos"""
        stats = {
            'total_matches': len(matches),
            'team1_wins': 0,
            'team2_wins': 0,
            'draws': 0,
            'team1_goals': 0,
            'team2_goals': 0,
            'average_goals': 0,
            'btts_count': 0,
            'clean_sheets_team1': 0,
            'clean_sheets_team2': 0
        }
        
        for match in matches:
            home_id = match['home_team']['id']
            away_id = match['away_team']['id']
            home_goals = match['score']['home']
            away_goals = match['score']['away']
            
            # Solo contar partidos con resultado
            if home_goals is None or away_goals is None:
                continue
            
            # Identificar equipos según su posición en el partido
            team1_home = home_id == team1_id
            team1_goals = home_goals if team1_home else away_goals
            team2_goals = away_goals if team1_home else home_goals
            
            # Actualizar contadores
            stats['team1_goals'] += team1_goals
            stats['team2_goals'] += team2_goals
            
            # Determinar resultado
            if team1_goals > team2_goals:
                stats['team1_wins'] += 1
            elif team2_goals > team1_goals:
                stats['team2_wins'] += 1
            else:
                stats['draws'] += 1
            
            # Ambos equipos marcan
            if team1_goals > 0 and team2_goals > 0:
                stats['btts_count'] += 1
            
            # Clean sheets
            if team2_goals == 0:
                stats['clean_sheets_team1'] += 1
            if team1_goals == 0:
                stats['clean_sheets_team2'] += 1
        
        # Calcular promedios y porcentajes
        total_valid_matches = stats['team1_wins'] + stats['team2_wins'] + stats['draws']
        if total_valid_matches > 0:
            total_goals = stats['team1_goals'] + stats['team2_goals']
            stats['average_goals'] = round(total_goals / total_valid_matches, 2)
            stats['btts_percentage'] = round((stats['btts_count'] / total_valid_matches) * 100, 2)
            stats['team1_win_percentage'] = round((stats['team1_wins'] / total_valid_matches) * 100, 2)
            stats['team2_win_percentage'] = round((stats['team2_wins'] / total_valid_matches) * 100, 2)
            stats['draw_percentage'] = round((stats['draws'] / total_valid_matches) * 100, 2)
        
        return stats
    
    def _add_to_cache(self, key, value, ttl=None):
        """Añade un valor a la caché con tiempo de expiración"""
        self.cache[key] = value
        self.cache_ttl[key] = time.time() + (ttl or self.default_ttl)
    
    def _get_from_cache(self, key):
        """Obtiene un valor de la caché si existe y no ha expirado"""
        if key in self.cache and time.time() < self.cache_ttl.get(key, 0):
            return self.cache[key]
        return None
    
    def clear_cache(self):
        """Limpia la caché por completo"""
        self.cache = {}
        self.cache_ttl = {}
        return {'status': 'success', 'message': 'Caché limpiada correctamente'}
    
    def close(self):
        """Cierra la conexión a la base de datos"""
        if self.conn:
            self.conn.close()
            self.conn = None
            self.cursor = None
            logger.info("Conexión a base de datos cerrada")

# Ejemplo de uso
if __name__ == "__main__":
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    
    # Crear gestor de datos
    data_manager = DataManager()
    
    # Ejemplo: obtener estadísticas de un equipo
    team_id = 33  # Barcelona
    team_stats = data_manager.get_team_stats(team_id)
    print(f"Estadísticas del equipo {team_id}: {team_stats}")
    
    # Ejemplo: obtener enfrentamientos directos
    h2h = data_manager.get_h2h_data(33, 34)  # Barcelona vs Real Madrid
    print(f"Enfrentamientos directos: {h2h}")
    
    # Cerrar conexión al finalizar
    data_manager.close()