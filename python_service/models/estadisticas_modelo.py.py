import pandas as pd
import numpy as np
import logging
import json
from datetime import datetime, timedelta
import math

# Configurar logging
logger = logging.getLogger('predictor_futbol_premium.estadisticas_modelo')

class EstadisticasModel:
    """
    Modelo para procesar estadísticas y generar características avanzadas para el modelo predictivo.
    """
    
    def __init__(self):
        """
        Inicializa el modelo de estadísticas.
        """
        self.estadisticas_cache = {}
    
    def procesar_estadisticas_equipo(self, equipo_stats, ultimos_n_partidos=5):
        """
        Procesa las estadísticas básicas de un equipo para generar características avanzadas.
        
        Args:
            equipo_stats (dict): Estadísticas del equipo
            ultimos_n_partidos (int): Número de partidos recientes a considerar
            
        Returns:
            dict: Características procesadas para el modelo
        """
        if not equipo_stats or 'data' not in equipo_stats:
            logger.warning("Estadísticas de equipo no válidas")
            return {}
        
        stats = equipo_stats['data']
        
        # Inicializar características básicas
        caracteristicas = {
            'equipo_id': stats.get('team_id'),
            'equipo_nombre': stats.get('team_name', ''),
            'liga_id': stats.get('league_id'),
            'liga_nombre': stats.get('league_name', '')
        }
        
        # Extraer y procesar estadísticas
        self._procesar_rendimiento_general(caracteristicas, stats)
        self._procesar_forma_reciente(caracteristicas, stats, ultimos_n_partidos)
        self._procesar_estadisticas_goles(caracteristicas, stats)
        self._procesar_estadisticas_defensivas(caracteristicas, stats)
        self._calcular_metricas_avanzadas(caracteristicas, stats)
        
        # Normalizar características
        self._normalizar_caracteristicas(caracteristicas)
        
        return caracteristicas
    
    def procesar_head_to_head(self, h2h_data, equipo1_id, equipo2_id, peso_recencia=True):
        """
        Procesa estadísticas de enfrentamientos directos entre dos equipos.
        
        Args:
            h2h_data (dict): Datos de enfrentamientos directos
            equipo1_id (int): ID del primer equipo
            equipo2_id (int): ID del segundo equipo
            peso_recencia (bool): Si se da más peso a partidos recientes
            
        Returns:
            dict: Características de H2H procesadas
        """
        if not h2h_data or 'data' not in h2h_data:
            logger.warning("Datos H2H no válidos")
            return {}
        
        # Extraer partidos
        partidos = h2h_data['data'].get('matches', [])
        
        if not partidos:
            logger.warning("No hay partidos H2H disponibles")
            return {}
        
        # Ordenar partidos por fecha (más recientes primero)
        partidos = sorted(partidos, key=lambda x: x.get('date', ''), reverse=True)
        
        # Inicializar características
        caracteristicas = {
            'total_partidos': len(partidos),
            'victorias_equipo1': 0,
            'victorias_equipo2': 0,
            'empates': 0,
            'goles_equipo1': 0,
            'goles_equipo2': 0,
            'ambos_marcan': 0,
            'porterias_cero_equipo1': 0,
            'porterias_cero_equipo2': 0
        }
        
        # Variables para promedio ponderado
        total_peso = 0
        goles_equipo1_ponderados = 0
        goles_equipo2_ponderados = 0
        
        # Procesar partidos
        for i, partido in enumerate(partidos):
            # Identificar equipos
            if partido['home_team']['id'] == equipo1_id:
                goles_equipo1 = partido['score']['home']
                goles_equipo2 = partido['score']['away']
            else:
                goles_equipo1 = partido['score']['away']
                goles_equipo2 = partido['score']['home']
            
            # Calcular peso según recencia (más peso a partidos recientes)
            if peso_recencia:
                # Peso exponencial decreciente (0.9^i)
                peso = math.pow(0.9, i)
            else:
                peso = 1.0
                
            total_peso += peso
            
            # Acumular estadísticas ponderadas
            goles_equipo1_ponderados += goles_equipo1 * peso
            goles_equipo2_ponderados += goles_equipo2 * peso
            
            # Acumular estadísticas básicas
            caracteristicas['goles_equipo1'] += goles_equipo1
            caracteristicas['goles_equipo2'] += goles_equipo2
            
            # Determinar resultado
            if goles_equipo1 > goles_equipo2:
                caracteristicas['victorias_equipo1'] += 1
            elif goles_equipo2 > goles_equipo1:
                caracteristicas['victorias_equipo2'] += 1
            else:
                caracteristicas['empates'] += 1
            
            # Verificar ambos equipos marcan
            if goles_equipo1 > 0 and goles_equipo2 > 0:
                caracteristicas['ambos_marcan'] += 1
            
            # Verificar porterías a cero
            if goles_equipo2 == 0:
                caracteristicas['porterias_cero_equipo1'] += 1
            if goles_equipo1 == 0:
                caracteristicas['porterias_cero_equipo2'] += 1
        
        # Calcular promedios ponderados si hay datos
        if total_peso > 0:
            caracteristicas['goles_promedio_equipo1_ponderado'] = round(goles_equipo1_ponderados / total_peso, 2)
            caracteristicas['goles_promedio_equipo2_ponderado'] = round(goles_equipo2_ponderados / total_peso, 2)
        
        # Calcular porcentajes y promedios
        if caracteristicas['total_partidos'] > 0:
            n = caracteristicas['total_partidos']
            caracteristicas['porcentaje_victorias_equipo1'] = round((caracteristicas['victorias_equipo1'] / n) * 100, 2)
            caracteristicas['porcentaje_victorias_equipo2'] = round((caracteristicas['victorias_equipo2'] / n) * 100, 2)
            caracteristicas['porcentaje_empates'] = round((caracteristicas['empates'] / n) * 100, 2)
            caracteristicas['porcentaje_ambos_marcan'] = round((caracteristicas['ambos_marcan'] / n) * 100, 2)
            caracteristicas['porcentaje_porterias_cero_equipo1'] = round((caracteristicas['porterias_cero_equipo1'] / n) * 100, 2)
            caracteristicas['porcentaje_porterias_cero_equipo2'] = round((caracteristicas['porterias_cero_equipo2'] / n) * 100, 2)
            caracteristicas['goles_promedio_equipo1'] = round(caracteristicas['goles_equipo1'] / n, 2)
            caracteristicas['goles_promedio_equipo2'] = round(caracteristicas['goles_equipo2'] / n, 2)
            caracteristicas['goles_promedio_total'] = round((caracteristicas['goles_equipo1'] + caracteristicas['goles_equipo2']) / n, 2)
        
        return caracteristicas
    
    def generar_caracteristicas_partido(self, local_stats, visitante_stats, h2h_stats=None):
        """
        Genera todas las características necesarias para predecir un partido.
        
        Args:
            local_stats (dict): Estadísticas procesadas del equipo local
            visitante_stats (dict): Estadísticas procesadas del equipo visitante
            h2h_stats (dict, opcional): Estadísticas de enfrentamientos directos
            
        Returns:
            dict: Todas las características para el modelo predictivo
        """
        if not local_stats or not visitante_stats:
            logger.warning("Estadísticas de equipos no válidas")
            return {}
        
        # Inicializar características del partido
        caracteristicas = {
            'fecha_procesamiento': datetime.now().isoformat(),
            'equipo_local_id': local_stats.get('equipo_id'),
            'equipo_local_nombre': local_stats.get('equipo_nombre', ''),
            'equipo_visitante_id': visitante_stats.get('equipo_id'),
            'equipo_visitante_nombre': visitante_stats.get('equipo_nombre', ''),
            'liga_id': local_stats.get('liga_id'),
            'liga_nombre': local_stats.get('liga_nombre', '')
        }
        
        # Añadir características de equipos
        self._fusionar_caracteristicas(caracteristicas, local_stats, 'local')
        self._fusionar_caracteristicas(caracteristicas, visitante_stats, 'visitante')
        
        # Añadir características de enfrentamientos directos
        if h2h_stats:
            for key, value in h2h_stats.items():
                caracteristicas[f'h2h_{key}'] = value
        
        # Calcular características diferenciales
        self._calcular_caracteristicas_diferenciales(
            caracteristicas, 
            local_stats, 
            visitante_stats
        )
        
        return caracteristicas
    
    def predecir_resultado_basico(self, caracteristicas):
        """
        Realiza una predicción básica basada en reglas simples (sin ML).
        Útil como fallback cuando no hay modelo entrenado.
        
        Args:
            caracteristicas (dict): Características del partido
            
        Returns:
            dict: Predicción básica con probabilidades
        """
        # Factores clave
        ventaja_local = 0.1  # Ventaja por jugar en casa
        
        # Obtener métricas relevantes
        puntos_promedio_local = caracteristicas.get('local_puntos_promedio', 1.5)
        puntos_promedio_visitante = caracteristicas.get('visitante_puntos_promedio', 1.3)
        
        # Ajustar por forma reciente
        forma_local = caracteristicas.get('local_forma_puntos_ultimos5', 0) / 15  # Normalizar a 0-1
        forma_visitante = caracteristicas.get('visitante_forma_puntos_ultimos5', 0) / 15
        
        # Calcular fuerza base de cada equipo
        fuerza_local = puntos_promedio_local / 3  # Normalizar a 0-1
        fuerza_visitante = puntos_promedio_visitante / 3
        
        # Ajustar por forma reciente (20% de influencia)
        fuerza_local = fuerza_local * 0.8 + forma_local * 0.2
        fuerza_visitante = fuerza_visitante * 0.8 + forma_visitante * 0.2
        
        # Añadir ventaja local
        fuerza_local += ventaja_local
        
        # Considerar historial H2H si está disponible
        if 'h2h_porcentaje_victorias_equipo1' in caracteristicas:
            h2h_local = caracteristicas['h2h_porcentaje_victorias_equipo1'] / 100
            h2h_visitante = caracteristicas['h2h_porcentaje_victorias_equipo2'] / 100
            
            # Ajustar fuerzas según H2H (10% de influencia)
            fuerza_local = fuerza_local * 0.9 + h2h_local * 0.1
            fuerza_visitante = fuerza_visitante * 0.9 + h2h_visitante * 0.1
        
        # Normalizar para que sumen a un valor fijo (con espacio para empate)
        total = fuerza_local + fuerza_visitante + 0.3  # 0.3 reservado para empate
        prob_victoria_local = fuerza_local / total
        prob_victoria_visitante = fuerza_visitante / total
        prob_empate = 1 - prob_victoria_local - prob_victoria_visitante
        
        # Predicción de goles
        goles_prom_favor_local = caracteristicas.get('local_goles_favor_promedio', 1.5)
        goles_prom_contra_local = caracteristicas.get('local_goles_contra_promedio', 1.0)
        goles_prom_favor_visitante = caracteristicas.get('visitante_goles_favor_promedio', 1.3)
        goles_prom_contra_visitante = caracteristicas.get('visitante_goles_contra_promedio', 1.2)
        
        # Estimar goles esperados (xG)
        xg_local = (goles_prom_favor_local + goles_prom_contra_visitante) / 2
        xg_visitante = (goles_prom_favor_visitante + goles_prom_contra_local) / 2
        
        # Estimar probabilidad de ambos equipos marcan
        clean_sheets_local = caracteristicas.get('local_porcentaje_porterias_cero', 30) / 100
        clean_sheets_visitante = caracteristicas.get('visitante_porcentaje_porterias_cero', 25) / 100
        
        prob_local_no_marca = (1 - (1 - clean_sheets_visitante))  # Probabilidad de que el local no marque
        prob_visitante_no_marca = (1 - (1 - clean_sheets_local))  # Probabilidad de que el visitante no marque
        
        prob_btts_si = 1 - (prob_local_no_marca + prob_visitante_no_marca - prob_local_no_marca * prob_visitante_no_marca)
        prob_btts_no = 1 - prob_btts_si
        
        # Probabilidad over/under
        # Usando distribución de Poisson para total de goles
        total_goles_esperados = xg_local + xg_visitante
        
        prob_over_1_5 = 1 - self._poisson_prob(0, total_goles_esperados) - self._poisson_prob(1, total_goles_esperados)
        prob_under_1_5 = 1 - prob_over_1_5
        
        prob_over_2_5 = 1 - self._poisson_prob(0, total_goles_esperados) - self._poisson_prob(1, total_goles_esperados) - self._poisson_prob(2, total_goles_esperados)
        prob_under_2_5 = 1 - prob_over_2_5
        
        prob_over_3_5 = 1 - (self._poisson_prob(0, total_goles_esperados) + self._poisson_prob(1, total_goles_esperados) + 
                              self._poisson_prob(2, total_goles_esperados) + self._poisson_prob(3, total_goles_esperados))
        prob_under_3_5 = 1 - prob_over_3_5
        
        # Resultado de la predicción
        return {
            'timestamp': datetime.now().isoformat(),
            'predicciones': {
                '1x2': {
                    'victoria_local': round(prob_victoria_local, 4),
                    'empate': round(prob_empate, 4),
                    'victoria_visitante': round(prob_victoria_visitante, 4)
                },
                'btts': {
                    'si': round(prob_btts_si, 4),
                    'no': round(prob_btts_no, 4)
                },
                'over_under': {
                    'over_1_5': round(prob_over_1_5, 4),
                    'under_1_5': round(prob_under_1_5, 4),
                    'over_2_5': round(prob_over_2_5, 4),
                    'under_2_5': round(prob_under_2_5, 4),
                    'over_3_5': round(prob_over_3_5, 4),
                    'under_3_5': round(prob_under_3_5, 4)
                },
                'goles_esperados': {
                    'local': round(xg_local, 2),
                    'visitante': round(xg_visitante, 2),
                    'total': round(total_goles_esperados, 2)
                }
            },
            'confidence': self._calcular_confianza_prediccion(caracteristicas)
        }
    
    def _procesar_rendimiento_general(self, caracteristicas, stats):
        """Procesa estadísticas de rendimiento general"""
        # Extraer estadísticas básicas
        if 'matches_played' in stats:
            caracteristicas['partidos_jugados'] = stats['matches_played'].get('total', 0)
            caracteristicas['partidos_jugados_local'] = stats['matches_played'].get('home', 0)
            caracteristicas['partidos_jugados_visitante'] = stats['matches_played'].get('away', 0)
        
        if 'wins' in stats:
            caracteristicas['victorias'] = stats['wins'].get('total', 0)
            caracteristicas['victorias_local'] = stats['wins'].get('home', 0)
            caracteristicas['victorias_visitante'] = stats['wins'].get('away', 0)
        
        if 'draws' in stats:
            caracteristicas['empates'] = stats['draws'].get('total', 0)
            caracteristicas['empates_local'] = stats['draws'].get('home', 0)
            caracteristicas['empates_visitante'] = stats['draws'].get('away', 0)
        
        if 'losses' in stats:
            caracteristicas['derrotas'] = stats['losses'].get('total', 0)
            caracteristicas['derrotas_local'] = stats['losses'].get('home', 0)
            caracteristicas['derrotas_visitante'] = stats['losses'].get('away', 0)
        
        # Calcular tasas y promedios
        if caracteristicas.get('partidos_jugados', 0) > 0:
            n = caracteristicas['partidos_jugados']
            caracteristicas['tasa_victoria'] = round(caracteristicas.get('victorias', 0) / n, 4)
            caracteristicas['tasa_empate'] = round(caracteristicas.get('empates', 0) / n, 4)
            caracteristicas['tasa_derrota'] = round(caracteristicas.get('derrotas', 0) / n, 4)
            
            # Puntos
            puntos = (caracteristicas.get('victorias', 0) * 3) + caracteristicas.get('empates', 0)
            caracteristicas['puntos'] = puntos
            caracteristicas['puntos_promedio'] = round(puntos / n, 2)
        
        # Tasas específicas para local y visitante
        if caracteristicas.get('partidos_jugados_local', 0) > 0:
            n_local = caracteristicas['partidos_jugados_local']
            caracteristicas['tasa_victoria_local'] = round(caracteristicas.get('victorias_local', 0) / n_local, 4)
            
            # Puntos como local
            puntos_local = (caracteristicas.get('victorias_local', 0) * 3) + caracteristicas.get('empates_local', 0)
            caracteristicas['puntos_local'] = puntos_local
            caracteristicas['puntos_promedio_local'] = round(puntos_local / n_local, 2)
        
        if caracteristicas.get('partidos_jugados_visitante', 0) > 0:
            n_visitante = caracteristicas['partidos_jugados_visitante']
            caracteristicas['tasa_victoria_visitante'] = round(caracteristicas.get('victorias_visitante', 0) / n_visitante, 4)
            
            # Puntos como visitante
            puntos_visitante = (caracteristicas.get('victorias_visitante', 0) * 3) + caracteristicas.get('empates_visitante', 0)
            caracteristicas['puntos_visitante'] = puntos_visitante
            caracteristicas['puntos_promedio_visitante'] = round(puntos_visitante / n_visitante, 2)
    
    def _procesar_forma_reciente(self, caracteristicas, stats, ultimos_n=5):
        """Procesa estadísticas de forma reciente"""
        # Extraer cadena de forma si está disponible
        if 'form' in stats and isinstance(stats['form'], str):
            forma = stats['form']
            # Tomar solo los últimos N resultados
            forma = forma[-ultimos_n:] if len(forma) > ultimos_n else forma
            
            # Contar resultados
            victorias_recientes = forma.count('W')
            empates_recientes = forma.count('D')
            derrotas_recientes = forma.count('L')
            
            # Calcular puntos
            puntos_recientes = (victorias_recientes * 3) + empates_recientes
            
            # Guardar estadísticas
            caracteristicas['forma'] = forma
            caracteristicas['forma_victorias_ultimos' + str(ultimos_n)] = victorias_recientes
            caracteristicas['forma_empates_ultimos' + str(ultimos_n)] = empates_recientes
            caracteristicas['forma_derrotas_ultimos' + str(ultimos_n)] = derrotas_recientes
            caracteristicas['forma_puntos_ultimos' + str(ultimos_n)] = puntos_recientes
            
            # Calcular índice de forma (0-1)
            max_puntos = ultimos_n * 3
            caracteristicas['indice_forma'] = round(puntos_recientes / max_puntos, 4) if max_puntos > 0 else 0
    
    def _procesar_estadisticas_goles(self, caracteristicas, stats):
        """Procesa estadísticas relacionadas con goles"""
        # Goles a favor
        if 'goals_for' in stats:
            caracteristicas['goles_favor'] = stats['goals_for'].get('total', 0)
            caracteristicas['goles_favor_local'] = stats['goals_for'].get('home', 0)
            caracteristicas['goles_favor_visitante'] = stats['goals_for'].get('away', 0)
            caracteristicas['goles_favor_promedio'] = stats['goals_for'].get('average', 0)
        
        # Goles en contra
        if 'goals_against' in stats:
            caracteristicas['goles_contra'] = stats['goals_against'].get('total', 0)
            caracteristicas['goles_contra_local'] = stats['goals_against'].get('home', 0)
            caracteristicas['goles_contra_visitante'] = stats['goals_against'].get('away', 0)
            caracteristicas['goles_contra_promedio'] = stats['goals_against'].get('average', 0)
        
        # Calcular promedios si no están disponibles
        if 'partidos_jugados' in caracteristicas and caracteristicas['partidos_jugados'] > 0:
            n = caracteristicas['partidos_jugados']
            
            if 'goles_favor' in caracteristicas and 'goles_favor_promedio' not in caracteristicas:
                caracteristicas['goles_favor_promedio'] = round(caracteristicas['goles_favor'] / n, 2)
            
            if 'goles_contra' in caracteristicas and 'goles_contra_promedio' not in caracteristicas:
                caracteristicas['goles_contra_promedio'] = round(caracteristicas['goles_contra'] / n, 2)
        
        # Calcular diferencia de goles
        if 'goles_favor' in caracteristicas and 'goles_contra' in caracteristicas:
            caracteristicas['diferencia_goles'] = caracteristicas['goles_favor'] - caracteristicas['goles_contra']
            
        # Calcular promedio de goles totales por partido
        if 'goles_favor_promedio' in caracteristicas and 'goles_contra_promedio' in caracteristicas:
            caracteristicas['promedio_goles_total'] = caracteristicas['goles_favor_promedio'] + caracteristicas['goles_contra_promedio']
    
    def _procesar_estadisticas_defensivas(self, caracteristicas, stats):
        """Procesa estadísticas defensivas"""
        # Porterías a cero (clean sheets)
        if 'clean_sheets' in stats:
            caracteristicas['porterias_cero'] = stats['clean_sheets'].get('total', 0)
            caracteristicas['porterias_cero_local'] = stats['clean_sheets'].get('home', 0)
            caracteristicas['porterias_cero_visitante'] = stats['clean_sheets'].get('away', 0)
            
            # Calcular porcentajes
            if 'partidos_jugados' in caracteristicas and caracteristicas['partidos_jugados'] > 0:
                caracteristicas['porcentaje_porterias_cero'] = round((caracteristicas['porterias_cero'] / caracteristicas['partidos_jugados']) * 100, 2)
            
            if 'partidos_jugados_local' in caracteristicas and caracteristicas['partidos_jugados_local'] > 0:
                caracteristicas['porcentaje_porterias_cero_local'] = round((caracteristicas['porterias_cero_local'] / caracteristicas['partidos_jugados_local']) * 100, 2)
            
            if 'partidos_jugados_visitante' in caracteristicas and caracteristicas['partidos_jugados_visitante'] > 0:
                caracteristicas['porcentaje_porterias_cero_visitante'] = round((caracteristicas['porterias_cero_visitante'] / caracteristicas['partidos_jugados_visitante']) * 100, 2)
        
        # Partidos sin marcar
        if 'failed_to_score' in stats:
            caracteristicas['partidos_sin_marcar'] = stats['failed_to_score'].get('total', 0)
            caracteristicas['partidos_sin_marcar_local'] = stats['failed_to_score'].get('home', 0)
            caracteristicas['partidos_sin_marcar_visitante'] = stats['failed_to_score'].get('away', 0)
            
            # Calcular porcentajes
            if 'partidos_jugados' in caracteristicas and caracteristicas['partidos_jugados'] > 0:
                caracteristicas['porcentaje_sin_marcar'] = round((caracteristicas['partidos_sin_marcar'] / caracteristicas['partidos_jugados']) * 100, 2)
    
    def _calcular_metricas_avanzadas(self, caracteristicas, stats):
        """Calcula métricas avanzadas derivadas de estadísticas básicas"""
        # Eficiencia defensiva (goles recibidos por partido)
        if 'goles_contra' in caracteristicas and 'partidos_jugados' in caracteristicas and caracteristicas['partidos_jugados'] > 0:
            caracteristicas['eficiencia_defensiva'] = round(caracteristicas['goles_contra'] / caracteristicas['partidos_jugados'], 2)
        
        # Eficiencia ofensiva (goles marcados por partido)
        if 'goles_favor' in caracteristicas and 'partidos_jugados' in caracteristicas and caracteristicas['partidos_jugados'] > 0:
            caracteristicas['eficiencia_ofensiva'] = round(caracteristicas['goles_favor'] / caracteristicas['partidos_jugados'], 2)
        
        # Índice BTTS (Both Teams To Score)
        if 'partidos_jugados' in caracteristicas and caracteristicas['partidos_jugados'] > 0:
            if 'porterias_cero' in caracteristicas and 'partidos_sin_marcar' in caracteristicas:
                # Partidos donde ambos equipos marcaron
                partidos_btts = caracteristicas['partidos_jugados'] - caracteristicas['porterias_cero'] - caracteristicas['partidos_sin_marcar'] + min(caracteristicas['porterias_cero'], caracteristicas['partidos_sin_marcar'])
                caracteristicas['porcentaje_btts'] = round((partidos_btts / caracteristicas['partidos_jugados']) * 100, 2)
        
        # Ratio victorias/derrotas
        if 'victorias' in caracteristicas and 'derrotas' in caracteristicas:
            if caracteristicas['derrotas'] > 0:
                caracteristicas['ratio_victorias_derrotas'] = round(caracteristicas['victorias'] / caracteristicas['derrotas'], 2)
            else:
                caracteristicas['ratio_victorias_derrotas'] = caracteristicas['victorias'] * 2 if caracteristicas['victorias'] > 0 else 1
    
    def _normalizar_caracteristicas(self, caracteristicas):
        """Normaliza valores de características para el modelo"""
        # Normalizar tasas a 0-1
        for key in list(caracteristicas.keys()):
            # Normalizar porcentajes a escala 0-1
            if key.startswith('porcentaje_'):
                valor = caracteristicas[key]
                if isinstance(valor, (int, float)):
                    caracteristicas[key.replace('porcentaje_', 'norm_')] = valor / 100
            
            # Normalizar tasas de victoria/empate/derrota
            if key.startswith('tasa_'):
                # Estas ya están en escala 0-1
                caracteristicas['norm_' + key] = caracteristicas[key]
        
        # Normalizar puntos promedio (valor típico max ~2.5)
        if 'puntos_promedio' in caracteristicas:
            caracteristicas['norm_puntos_promedio'] = min(caracteristicas['puntos_promedio'] / 3.0, 1.0)
        
        # Normalizar goles (valor típico: 0-4 por partido)
        if 'goles_favor_promedio' in caracteristicas:
            caracteristicas['norm_goles_favor'] = min(caracteristicas['goles_favor_promedio'] / 4.0, 1.0)
        
        if 'goles_contra_promedio' in caracteristicas:
            caracteristicas['norm_goles_contra'] = min(caracteristicas['goles_contra_promedio'] / 4.0, 1.0)
    
    def _fusionar_caracteristicas(self, destino, origen, prefijo):
        """
        Fusiona características de un equipo en el conjunto principal con un prefijo.
        
        Args:
            destino (dict): Diccionario destino para características
            origen (dict): Diccionario origen con características
            prefijo (str): Prefijo para añadir a las claves
        """
        for key, value in origen.items():
            # Evitar duplicación de IDs y nombres
            if key in ['equipo_id', 'equipo_nombre', 'liga_id', 'liga_nombre']:
                continue
            
            # Añadir con prefijo
            destino[f'{prefijo}_{key}'] = value
    
    def _calcular_caracteristicas_diferenciales(self, caracteristicas, local, visitante):
        """
        Calcula características que representan la diferencia entre equipos.
        
        Args:
            caracteristicas (dict): Diccionario destino para características
            local (dict): Características del equipo local
            visitante (dict): Características del equipo visitante
        """
        # Pares de características a comparar
        pares_comparacion = [
            ('puntos_promedio', 'Diferencia en puntos promedio'),
            ('indice_forma', 'Diferencia en forma reciente'),
            ('goles_favor_promedio', 'Diferencia en goles marcados'),
            ('goles_contra_promedio', 'Diferencia en goles recibidos'),
            ('porcentaje_porterias_cero', 'Diferencia en porterías a cero'),
            ('eficiencia_ofensiva', 'Diferencia en eficiencia ofensiva'),
            ('eficiencia_defensiva', 'Diferencia en eficiencia defensiva')
        ]
        
        # Calcular diferencias
        for par in pares_comparacion:
            clave, descripcion = par
            if clave in local and clave in visitante:
                diff_clave = f'diff_{clave}'
                caracteristicas[diff_clave] = round(local[clave] - visitante[clave], 4)
                
                # Normalizar diferencia a rango [-1, 1]
                if clave == 'puntos_promedio':
                    # Normalizar por el máximo posible (3 puntos por partido)
                    caracteristicas[f'norm_{diff_clave}'] = max(min(caracteristicas[diff_clave] / 3, 1), -1)
                elif clave.startswith('porcentaje_'):
                    # Normalizar porcentajes
                    caracteristicas[f'norm_{diff_clave}'] = max(min(caracteristicas[diff_clave] / 100, 1), -1)
                elif 'goles' in clave:
                    # Normalizar diferencia de goles (típicamente entre -4 y 4)
                    caracteristicas[f'norm_{diff_clave}'] = max(min(caracteristicas[diff_clave] / 4, 1), -1)
                else:
                    # Normalización general
                    factor = max(abs(local[clave]), abs(visitante[clave])) if max(abs(local[clave]), abs(visitante[clave])) > 0 else 1
                    caracteristicas[f'norm_{diff_clave}'] = max(min(caracteristicas[diff_clave] / factor, 1), -1)
        
        # Calcular índice de superioridad (-1 a 1, positivo = ventaja local)
        indices_ponderados = []
        pesos = {
            'diff_puntos_promedio': 0.3,
            'diff_indice_forma': 0.2,
            'diff_goles_favor_promedio': 0.15,
            'diff_goles_contra_promedio': 0.15,
            'diff_porcentaje_porterias_cero': 0.1,
            'diff_eficiencia_ofensiva': 0.05,
            'diff_eficiencia_defensiva': 0.05
        }
        
        # Sumar índices ponderados
        peso_total = 0
        for clave, peso in pesos.items():
            if clave in caracteristicas:
                norm_clave = f'norm_{clave}'
                if norm_clave in caracteristicas:
                    indices_ponderados.append(caracteristicas[norm_clave] * peso)
                    peso_total += peso
                else:
                    indices_ponderados.append(caracteristicas[clave] * peso)
                    peso_total += peso
        
        # Calcular índice final (normalizado por peso total)
        if peso_total > 0:
            caracteristicas['indice_superioridad'] = round(sum(indices_ponderados) / peso_total, 4)
        else:
            caracteristicas['indice_superioridad'] = 0
    
    def _calcular_confianza_prediccion(self, caracteristicas):
        """
        Calcula el nivel de confianza para la predicción (0-10).
        
        Args:
            caracteristicas (dict): Características del partido
            
        Returns:
            float: Nivel de confianza (0-10)
        """
        # Factores que aumentan la confianza
        factores_positivos = [
            # Cantidad de datos
            ('local_partidos_jugados', 10, 0.5),  # Más partidos aumenta confianza
            ('visitante_partidos_jugados', 10, 0.5),
            
            # Diferencia clara
            ('indice_superioridad', 0.5, 1.5),  # Mayor diferencia = mayor confianza
            
            # Consistencia
            ('local_forma_victorias_ultimos5', 4, 1.0),  # Forma consistente = mayor confianza
            ('visitante_forma_victorias_ultimos5', 4, 1.0),
            
            # Historial directo
            ('h2h_total_partidos', 5, 1.0)  # Más enfrentamientos = mayor confianza
        ]
        
        # Factores que disminuyen la confianza
        factores_negativos = [
            # Inconsistencia
            ('local_tasa_empate', 0.4, -1.0),  # Muchos empates = menor confianza
            ('visitante_tasa_empate', 0.4, -1.0),
            
            # Alta variabilidad
            ('local_goles_contra_promedio', 2, -0.5),  # Equipos que reciben muchos goles son menos predecibles
            ('visitante_goles_contra_promedio', 2, -0.5)
        ]
        
        # Inicializar confianza base
        confianza = 5.0  # Punto medio
        
        # Aplicar factores positivos
        for factor in factores_positivos:
            clave, umbral, peso = factor
            if clave in caracteristicas:
                valor = caracteristicas[clave]
                if clave == 'indice_superioridad':
                    # Para índice de superioridad, usar valor absoluto
                    confianza += (abs(valor) / umbral) * peso
                else:
                    # Para otros factores, comparar directamente con umbral
                    confianza += min(valor / umbral, 1) * peso
        
        # Aplicar factores negativos
        for factor in factores_negativos:
            clave, umbral, peso = factor
            if clave in caracteristicas:
                valor = caracteristicas[clave]
                confianza += min(valor / umbral, 1) * peso
        
        # Limitar confianza al rango 0-10
        confianza = max(0, min(10, confianza))
        
        return round(confianza, 1)
    
    def _poisson_prob(self, k, lambda_param):
        """Calcula probabilidad Poisson P(X = k) con parámetro lambda"""
        return (math.exp(-lambda_param) * (lambda_param ** k)) / math.factorial(k)


# Ejemplo de uso
if __name__ == "__main__":
    # Configurar logging
    logging.basicConfig(level=logging.INFO)
    
    # Crear modelo de estadísticas
    stats_model = EstadisticasModel()
    
    # Ejemplo de estadísticas de equipo (simplificado)
    equipo_stats = {
        'status': 'success',
        'data': {
            'team_id': 33,
            'team_name': 'Barcelona',
            'matches_played': {'total': 20, 'home': 10, 'away': 10},
            'wins': {'total': 14, 'home': 8, 'away': 6},
            'draws': {'total': 4, 'home': 2, 'away': 2},
            'losses': {'total': 2, 'home': 0, 'away': 2},
            'goals_for': {'total': 40, 'home': 25, 'away': 15, 'average': 2.0},
            'goals_against': {'total': 15, 'home': 5, 'away': 10, 'average': 0.75},
            'clean_sheets': {'total': 10, 'home': 7, 'away': 3},
            'failed_to_score': {'total': 1, 'home': 0, 'away': 1},
            'form': 'WDWWW'
        }
    }
    
    # Procesar estadísticas
    caracteristicas = stats_model.procesar_estadisticas_equipo(equipo_stats)
    print("Características procesadas:")
    for k, v in sorted(caracteristicas.items()):
        print(f"{k}: {v}")
    
    # Procesar estadísticas para otro equipo
    equipo2_stats = {
        'status': 'success',
        'data': {
            'team_id': 34,
            'team_name': 'Real Madrid',
            'matches_played': {'total': 20, 'home': 10, 'away': 10},
            'wins': {'total': 12, 'home': 7, 'away': 5},
            'draws': {'total': 5, 'home': 2, 'away': 3},
            'losses': {'total': 3, 'home': 1, 'away': 2},
            'goals_for': {'total': 35, 'home': 22, 'away': 13, 'average': 1.75},
            'goals_against': {'total': 17, 'home': 7, 'away': 10, 'average': 0.85},
            'clean_sheets': {'total': 8, 'home': 5, 'away': 3},
            'failed_to_score': {'total': 2, 'home': 1, 'away': 1},
            'form': 'WDLWW'
        }
    }
    
    # Procesar estadísticas del segundo equipo
    caracteristicas2 = stats_model.procesar_estadisticas_equipo(equipo2_stats)
    
    # Ejemplo H2H
    h2h_stats = {
        'status': 'success',
        'data': {
            'matches': [
                {
                    'date': '2023-10-20',
                    'home_team': {'id': 33, 'name': 'Barcelona'},
                    'away_team': {'id': 34, 'name': 'Real Madrid'},
                    'score': {'home': 2, 'away': 1}
                },
                {
                    'date': '2023-04-05',
                    'home_team': {'id': 34, 'name': 'Real Madrid'},
                    'away_team': {'id': 33, 'name': 'Barcelona'},
                    'score': {'home': 3, 'away': 2}
                },
                {
                    'date': '2022-10-16',
                    'home_team': {'id': 33, 'name': 'Barcelona'},
                    'away_team': {'id': 34, 'name': 'Real Madrid'},
                    'score': {'home': 3, 'away': 1}
                }
            ]
        }
    }
    
    # Procesar H2H
    h2h_caracteristicas = stats_model.procesar_head_to_head(h2h_stats, 33, 34)
    print("\nCaracterísticas H2H:")
    for k, v in h2h_caracteristicas.items():
        print(f"{k}: {v}")
    
    # Generar características completas para predicción
    caracteristicas_partido = stats_model.generar_caracteristicas_partido(
        caracteristicas,  # Barcelona (local)
        caracteristicas2,  # Real Madrid (visitante)
        h2h_caracteristicas
    )
    
    # Realizar predicción básica
    prediccion = stats_model.predecir_resultado_basico(caracteristicas_partido)
    print("\nPredicción básica:")
    print(json.dumps(prediccion, indent=2))
import pandas as pd
import numpy as np
import logging
import json
from datetime import datetime, timedelta
import math

# Configurar logging
logger = logging.getLogger('predictor_futbol_premium.estadisticas_modelo')

class EstadisticasModel:
    """
    Modelo para procesar estadísticas y generar características avanzadas para el modelo predictivo.
    """
    
    def __init__(self):
        """
        Inicializa el modelo de estadísticas.
        """
        self.estadisticas_cache = {}
    
    def procesar_estadisticas_equipo(self, equipo_stats, ultimos_n_partidos=5):
        """
        Procesa las estadísticas básicas de un equipo para generar características avanzadas.
        
        Args:
            equipo_stats (dict): Estadísticas del equipo
            ultimos_n_partidos (int): Número de partidos recientes a considerar
            
        Returns:
            dict: Características procesadas para el modelo
        """
        if not equipo_stats or 'data' not in equipo_stats:
            logger.warning("Estadísticas de equipo no válidas")
            return {}
        
        stats = equipo_stats['data']
        
        # Inicializar características básicas
        caracteristicas = {
            'equipo_id': stats.get('team_id'),
            'equipo_nombre': stats.get('team_name', ''),
            'liga_id': stats.get('league_id'),
            'liga_nombre': stats.get('league_name', '')
        }
        
        # Extraer y procesar estadísticas
        self._procesar_rendimiento_general(caracteristicas, stats)
        self._procesar_forma_reciente(caracteristicas, stats, ultimos_n_partidos)
        self._procesar_estadisticas_goles(caracteristicas, stats)
        self._procesar_estadisticas_defensivas(caracteristicas, stats)
        self._calcular_metricas_avanzadas(caracteristicas, stats)
        
        # Normalizar características
        self._normalizar_caracteristicas(caracteristicas)
        
        return caracteristicas
    
    def procesar_head_to_head(self, h2h_data, equipo1_id, equipo2_id, peso_recencia=True):
        """
        Procesa estadísticas de enfrentamientos directos entre dos equipos.
        
        Args:
            h2h_data (dict): Datos de enfrentamientos directos
            equipo1_id (int): ID del primer equipo
            equipo2_id (int): ID del segundo equipo
            peso_recencia (bool): Si se da más peso a partidos recientes
            
        Returns:
            dict: Características de H2H procesadas
        """
        if not h2h_data or 'data' not in h2h_data:
            logger.warning("Datos H2H no válidos")
            return {}
        
        # Extraer partidos
        partidos = h2h_data['data'].get('matches', [])
        
        if not partidos:
            logger.warning("No hay partidos H2H disponibles")
            return {}
        
        # Ordenar partidos por fecha (más recientes primero)
        partidos = sorted(partidos, key=lambda x: x.get('date', ''), reverse=True)
        
        # Inicializar características
        caracteristicas = {
            'total_partidos': len(partidos),
            'victorias_equipo1': 0,
            'victorias_equipo2': 0,
            'empates': 0,
            'goles_equipo1': 0,
            'goles_equipo2': 0,
            'ambos_marcan': 0,
            'porterias_cero_equipo1': 0,
            'porterias_cero_equipo2': 0
        }
        
        # Variables para promedio ponderado
        total_peso = 0
        goles_equipo1_ponderados = 0
        goles_equipo2_ponderados = 0
        
        # Procesar partidos
        for i, partido in enumerate(partidos):
            # Identificar equipos
            if partido['home_team']['id'] == equipo1_id:
                goles_equipo1 = partido['score']['home']
                goles_equipo2 = partido['score']['away']
            else:
                goles_equipo1 = partido['score']['away']
                goles_equipo2 = partido['score']['home']
            
            # Calcular peso según recencia (más peso a partidos recientes)
            if peso_recencia:
                # Peso exponencial decreciente (0.9^i)
                peso = math.pow(0.9, i)
            else:
                peso = 1.0
                
            total_peso += peso
            
            # Acumular estadísticas ponderadas
            goles_equipo1_ponderados += goles_equipo1 * peso
            goles_equipo2_ponderados += goles_equipo2 * peso
            
            # Acumular estadísticas básicas
            caracteristicas['goles_equipo1'] += goles_equipo1
            caracteristicas['goles_equipo2'] += goles_equipo2
            
            # Determinar resultado
            if goles_equipo1 > goles_equipo2:
                caracteristicas['victorias_equipo1'] += 1
            elif goles_equipo2 > goles_equipo1:
                caracteristicas['victorias_