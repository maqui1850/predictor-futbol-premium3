# 📊 Data Fetcher - Obtención de Datos Históricos

Este módulo se encarga de obtener y procesar datos históricos de fútbol desde múltiples fuentes para entrenar el modelo de machine learning.

## 🚀 Inicio Rápido

### Opción 1: Datos Gratuitos (Recomendado)
```bash
cd python_service/scripts
python fetch_historical_data.py --source free
```

### Opción 2: Datos de Muestra (Para Testing)
```bash
python fetch_historical_data.py --source sample
```

### Opción 3: Datos Premium (Requiere API Key)
```bash
python fetch_historical_data.py --source api --api-key TU_CLAVE_API
```

## 📋 Requisitos

### Dependencias Python
```bash
pip install pandas numpy requests python-dotenv
```

### Variables de Entorno (Opcional)
```bash
# Crear archivo .env en python_service/
API_FOOTBALL_KEY=tu_clave_api_football
```

## 🎯 Fuentes de Datos Soportadas

### 🟢 Gratuitas
| Fuente | Ligas | Temporadas | Estadísticas | Limitaciones |
|--------|--------|------------|--------------|--------------|
| **Football-Data.co.uk** | 5 principales europeas | 1993-2024 | Básicas + apuestas | Solo Europa |
| **Datos Sintéticos** | Configurable | Cualquiera | Realistas | No son reales |

### 🟡 Premium
| Fuente | Ligas | Temporadas | Estadísticas | Costo |
|--------|--------|------------|--------------|-------|
| **API-Football** | 1000+ mundiales | 2008-2024 | Completas | 100 req/día gratis |

## 📈 Datos Obtenidos

### Estructura del CSV Generado
```csv
match_id,date,season,league,home_team,away_team,home_goals,away_goals,result,total_goals,home_shots_on_target,away_shots_on_target,home_corners,away_corners,home_fouls,away_fouls,home_yellow_cards,away_yellow_cards,home_red_cards,away_red_cards
1,2023-08-12,2023,Premier League,Manchester City,Chelsea,3,1,H,4,8,4,7,3,11,14,2,3,0,0
2,2023-08-13,2023,Premier League,Arsenal,Liverpool,2,2,D,4,6,7,5,6,13,12,1,2,0,1
```

### Características Incluidas

#### 📊 Básicas (Todas las fuentes)
- **Identificación**: match_id, date, season, league
- **Equipos**: home_team, away_team, home_team_id, away_team_id
- **Resultado**: home_goals, away_goals, result, total_goals

#### 📈 Estadísticas de Partido (Football-Data + API-Football)
- **Tiros**: shots, shots_on_target
- **Juego**: corners, fouls, possession
- **Disciplina**: yellow_cards, red_cards
- **Portería**: saves, clean_sheets

#### 🎯 Avanzadas (Solo API-Football)
- **Expected Goals**: xG, xGA
- **Pases**: passes, pass_accuracy
- **Otras**: offsides, aerials_won

## 🔧 Opciones de Configuración

### Parámetros del Script

```bash
python fetch_historical_data.py [opciones]
```

| Parámetro | Descripción | Ejemplo | Por Defecto |
|-----------|-------------|---------|-------------|
| `--source` | Fuente de datos | `free`, `api`, `sample` | `free` |
| `--leagues` | Ligas a procesar | `"Premier League" "La Liga"` | `["Premier League", "La Liga"]` |
| `--seasons` | Temporadas | `2022 2023 2024` | `[2022, 2023, 2024]` |
| `--api-key` | Clave API-Football | `tu_clave_api` | Desde .env |
| `--output` | Archivo de salida | `mi_dataset.csv` | `partidos_historicos.csv` |

### Ejemplos de Uso

#### 🎯 Dataset Completo para Entrenamiento
```bash
python fetch_historical_data.py \
  --source free \
  --leagues "Premier League" "La Liga" "Bundesliga" "Serie A" "Ligue 1" \
  --seasons 2020 2021 2022 2023 2024 \
  --output dataset_completo.csv
```

#### ⚡ Dataset Rápido para Testing
```bash
python fetch_historical_data.py \
  --source sample \
  --output test_dataset.csv
```

#### 💎 Dataset Premium con API-Football
```bash
python fetch_historical_data.py \
  --source api \
  --api-key $API_FOOTBALL_KEY \
  --leagues "Premier League" \
  --seasons 2023 2024 \
  --output premium_dataset.csv
```

## 🔍 Verificación de Datos

### Script de Verificación Rápida
```python
import pandas as pd

# Cargar datos
df = pd.read_csv('data/partidos_historicos.csv')

# Información general
print(f"📊 Total de partidos: {len(df)}")
print(f"📅 Rango de fechas: {df['date'].min()} a {df['date'].max()}")
print(f"🏆 Ligas incluidas: {df['league'].nunique()}")
print(f"⚽ Promedio de goles: {df['total_goals'].mean():.2f}")

# Distribución de resultados
result_dist = df['result'].value_counts(normalize=True) * 100
print(f"\n📈 Distribución de resultados:")
print(f"   🏠 Victoria Local: {result_dist.get('H', 0):.1f}%")
print(f"   🤝 Empate: {result_dist.get('D', 0):.1f}%")
print(f"   ✈️  Victoria Visitante: {result_dist.get('A', 0):.1f}%")

# Verificar calidad
print(f"\n✅ Verificaciones:")
print(f"   Valores nulos: {df.isnull().sum().sum()}")
print(f"   Duplicados: {df.duplicated().sum()}")
print(f"   Fechas válidas: {pd.to_datetime(df['date'], errors='coerce').notna().all()}")
```

## 🚨 Solución de Problemas

### Error: "No module named pandas"
```bash
# Solución
pip install pandas numpy requests
```

### Error: "API key inválida"
```bash
# Verificar clave en RapidAPI
echo $API_FOOTBALL_KEY

# O usar directamente
python fetch_historical_data.py --source api --api-key "tu_clave_aqui"
```

### Error: "No se obtuvieron datos"
1. **Verificar conexión**: `ping google.com`
2. **Verificar parámetros**: Ligas y temporadas válidas
3. **Verificar fuente**: Probar con `--source sample`

### Datos incompletos o con errores
```python
# Script de limpieza
import pandas as pd

df = pd.read_csv('data/partidos_historicos.csv')

# Eliminar filas con datos críticos faltantes
df = df.dropna(subset=['home_goals', 'away_goals', 'result'])

# Filtrar goles anómalos
df = df[(df['home_goals'] >= 0) & (df['away_goals'] >= 0)]
df = df[(df['home_goals'] <= 15) & (df['away_goals'] <= 15)]

# Verificar consistencia de resultados
def verify_result(row):
    if row['home_goals'] > row['away_goals']:
        return 'H'
    elif row['away_goals'] > row['home_goals']:
        return 'A'
    else:
        return 'D'

df['result_verified'] = df.apply(verify_result, axis=1)
inconsistent = df[df['result'] != df['result_verified']]

if len(inconsistent) > 0:
    print(f"⚠️  {len(inconsistent)} resultados inconsistentes encontrados")
    df['result'] = df['result_verified']

df = df.drop('result_verified', axis=1)
df.to_csv('data/partidos_historicos_limpio.csv', index=False)
print("✅ Datos limpiados guardados")
```

## 📊 Estadísticas de Fuentes

### Football-Data.co.uk
- ✅ **Ventajas**: Gratuito, histórico extenso, datos de apuestas
- ❌ **Limitaciones**: Solo Europa, estadísticas básicas
- 📈 **Cobertura**: ~2,500 partidos/temporada (5 ligas)

### API-Football
- ✅ **Ventajas**: Global, estadísticas completas, datos oficiales
- ❌ **Limitaciones**: Requiere pago, límites de requests
- 📈 **Cobertura**: ~100,000 partidos/temporada (mundial)

### Datos Sintéticos
- ✅ **Ventajas**: Ilimitados, configurables, perfectos para testing
- ❌ **Limitaciones**: No son reales, patrones simplificados
- 📈 **Cobertura**: Cualquier cantidad configurada

## 🔄 Próximos Pasos

### 1. Después de Obtener Datos
```bash
# Verificar datos
python -c "import pandas as pd; print(pd.read_csv('data/partidos_historicos.csv').info())"

# Entrenar modelo
python train_model.py --data data/partidos_historicos.csv

# Evaluar rendimiento
python -c "from models.model_evaluation import ModelEvaluator; print('✅ Listo para evaluación')"
```

### 2. Automatización (Opcional)
```bash
# Crear cron job para actualización semanal
crontab -e

# Añadir línea:
# 0 2 * * 1 cd /ruta/al/proyecto && python python_service/scripts/fetch_historical_data.py --source free
```

### 3. Configuración Avanzada
- Modificar `config/data_sources.yaml` para personalizar fuentes
- Implementar cache para evitar re-descargas
- Añadir validación automática de calidad de datos

## 📞 Soporte

### Fuentes de Ayuda
- 📚 **Documentación**: Comentarios en el código
- 🐛 **Issues**: GitHub Issues para reportar problemas
- 💬 **Comunidad**: Stack Overflow para preguntas técnicas

### Datos de Contacto
- 📧 **Email**: soporte@predictor-futbol-premium.com
- 🌐 **Web**: docs.predictor-futbol-premium.com

---

**¡Listo para obtener datos históricos y entrenar tu modelo de ML! 🚀⚽**