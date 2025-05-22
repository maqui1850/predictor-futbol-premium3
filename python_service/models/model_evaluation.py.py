# models/model_evaluation.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, roc_curve, auc, precision_recall_curve
from datetime import datetime
import json
import os
import logging

# Configuración del sistema de logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    filename='logs/model_evaluation.log'
)
logger = logging.getLogger('model_evaluation')

class ModelEvaluator:
    """
    Clase para evaluar y monitorear el rendimiento de modelos de predicción de fútbol.
    """
    
    def __init__(self, model_name, save_dir='evaluations'):
        """
        Inicializa el evaluador de modelos.
        
        Args:
            model_name (str): Nombre del modelo a evaluar
            save_dir (str): Directorio donde guardar los resultados de la evaluación
        """
        self.model_name = model_name
        self.save_dir = save_dir
        self.evaluation_history = []
        
        # Crear directorio si no existe
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)
            logger.info(f"Directorio de evaluación creado: {save_dir}")
    
    def evaluate_predictions(self, y_true, y_pred, y_prob, class_names=None):
        """
        Evalúa las predicciones del modelo.
        
        Args:
            y_true (array-like): Valores reales
            y_pred (array-like): Valores predichos
            y_prob (array-like): Probabilidades de predicción
            class_names (list): Nombres de las clases
            
        Returns:
            dict: Métricas de evaluación
        """
        if class_names is None:
            class_names = ['Victoria Local', 'Empate', 'Victoria Visitante']
        
        # Convertir a arrays de numpy
        y_true = np.array(y_true)
        y_pred = np.array(y_pred)
        y_prob = np.array(y_prob)
        
        # Métricas básicas
        cr = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
        cm = confusion_matrix(y_true, y_pred)
        
        # Generar matriz de confusión normalizada
        cm_norm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        
        # Calcular ROC y AUC para cada clase (one-vs-rest)
        n_classes = len(class_names)
        fpr = dict()
        tpr = dict()
        roc_auc = dict()
        
        for i in range(n_classes):
            fpr[i], tpr[i], _ = roc_curve((y_true == i).astype(int), y_prob[:, i])
            roc_auc[i] = auc(fpr[i], tpr[i])
        
        # Calcular precisión-recall para cada clase
        precision = dict()
        recall = dict()
        pr_auc = dict()
        
        for i in range(n_classes):
            precision[i], recall[i], _ = precision_recall_curve((y_true == i).astype(int), y_prob[:, i])
            pr_auc[i] = auc(recall[i], precision[i])
        
        # Calcular métricas específicas para apuestas
        bet_precision = self.calculate_betting_metrics(y_true, y_pred, y_prob)
        
        # Crear estructura de evaluación
        evaluation = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'model_name': self.model_name,
            'metrics': {
                'accuracy': cr['accuracy'],
                'weighted_precision': cr['weighted avg']['precision'],
                'weighted_recall': cr['weighted avg']['recall'],
                'weighted_f1': cr['weighted avg']['f1-score'],
                'class_metrics': {
                    class_name: {
                        'precision': cr[class_name]['precision'],
                        'recall': cr[class_name]['recall'],
                        'f1-score': cr[class_name]['f1-score'],
                        'support': cr[class_name]['support'],
                        'roc_auc': roc_auc[i],
                        'pr_auc': pr_auc[i]
                    } for i, class_name in enumerate(class_names)
                },
                'confusion_matrix': cm.tolist(),
                'confusion_matrix_normalized': cm_norm.tolist(),
            },
            'betting_metrics': bet_precision
        }
        
        # Guardar la evaluación en el historial
        self.evaluation_history.append(evaluation)
        
        # Guardar en disco
        self._save_evaluation(evaluation)
        
        logger.info(f"Evaluación completada para modelo {self.model_name}")
        return evaluation
    
    def calculate_betting_metrics(self, y_true, y_pred, y_prob, threshold=0.6):
        """
        Calcula métricas específicas para apuestas deportivas.
        
        Args:
            y_true (array-like): Valores reales
            y_pred (array-like): Valores predichos
            y_prob (array-like): Probabilidades de predicción
            threshold (float): Umbral de confianza para considerar una apuesta
            
        Returns:
            dict: Métricas de apuestas
        """
        # Identificar predicciones con alta confianza (por encima del umbral)
        high_conf_indices = np.max(y_prob, axis=1) >= threshold
        
        # Calcular precisión en predicciones de alta confianza
        if np.sum(high_conf_indices) > 0:
            high_conf_accuracy = np.mean(y_pred[high_conf_indices] == y_true[high_conf_indices])
            high_conf_count = np.sum(high_conf_indices)
            high_conf_pct = high_conf_count / len(y_true)
        else:
            high_conf_accuracy = 0
            high_conf_count = 0
            high_conf_pct = 0
        
        # Identificar predicciones para cada clase con alta confianza
        class_high_conf_metrics = {}
        for i in range(y_prob.shape[1]):
            class_indices = (np.argmax(y_prob, axis=1) == i) & (np.max(y_prob, axis=1) >= threshold)
            if np.sum(class_indices) > 0:
                class_accuracy = np.mean(y_true[class_indices] == i)
                class_count = np.sum(class_indices)
            else:
                class_accuracy = 0
                class_count = 0
                
            class_high_conf_metrics[i] = {
                'accuracy': float(class_accuracy),
                'count': int(class_count)
            }
        
        # Simulación de ROI en apuestas (simplificado, asumiendo cuotas promedio)
        # Cuotas medias típicas: victoria local 2.0, empate 3.2, victoria visitante 3.8
        avg_odds = [2.0, 3.2, 3.8]
        roi = 0
        total_bets = 0
        
        for i in range(len(y_true)):
            if np.max(y_prob[i]) >= threshold:
                pred_class = np.argmax(y_prob[i])
                total_bets += 1
                
                # Si acertamos, ganamos según la cuota
                if pred_class == y_true[i]:
                    roi += avg_odds[pred_class] - 1  # Ganancia neta
                else:
                    roi -= 1  # Pérdida de la apuesta
        
        # Calcular ROI como porcentaje
        if total_bets > 0:
            roi_pct = (roi / total_bets) * 100
        else:
            roi_pct = 0
            
        betting_metrics = {
            'high_confidence_accuracy': float(high_conf_accuracy),
            'high_confidence_predictions': int(high_conf_count),
            'high_confidence_percentage': float(high_conf_pct),
            'class_high_confidence': class_high_conf_metrics,
            'simulated_roi_percent': float(roi_pct),
            'confidence_threshold': threshold
        }
        
        return betting_metrics
    
    def plot_confusion_matrix(self, evaluation, figsize=(10, 8), normalize=True, save=True):
        """
        Genera y guarda un gráfico de matriz de confusión.
        
        Args:
            evaluation (dict): Resultado de evaluación
            figsize (tuple): Tamaño de la figura
            normalize (bool): Si se debe normalizar la matriz
            save (bool): Si se debe guardar la figura
            
        Returns:
            matplotlib.figure.Figure: Figura generada
        """
        if normalize:
            cm = np.array(evaluation['metrics']['confusion_matrix_normalized'])
            title = f"Matriz de Confusión Normalizada - {self.model_name}"
            fmt = '.2f'
        else:
            cm = np.array(evaluation['metrics']['confusion_matrix'])
            title = f"Matriz de Confusión - {self.model_name}"
            fmt = 'd'
        
        class_names = list(evaluation['metrics']['class_metrics'].keys())
        
        plt.figure(figsize=figsize)
        sns.heatmap(cm, annot=True, fmt=fmt, cmap='Blues', 
                    xticklabels=class_names, 
                    yticklabels=class_names)
        plt.title(title)
        plt.ylabel('Resultado Real')
        plt.xlabel('Predicción')
        
        if save:
            timestamp = evaluation['timestamp'].replace(' ', '_').replace(':', '-')
            plt.savefig(f"{self.save_dir}/{self.model_name}_cm_{timestamp}.png", bbox_inches='tight', dpi=300)
            logger.info(f"Matriz de confusión guardada: {self.save_dir}/{self.model_name}_cm_{timestamp}.png")
        
        return plt.gcf()
    
    def plot_roc_curves(self, y_true, y_prob, class_names=None, figsize=(10, 8), save=True):
        """
        Genera y guarda curvas ROC para cada clase.
        
        Args:
            y_true (array-like): Valores reales
            y_prob (array-like): Probabilidades de predicción
            class_names (list): Nombres de las clases
            figsize (tuple): Tamaño de la figura
            save (bool): Si se debe guardar la figura
            
        Returns:
            matplotlib.figure.Figure: Figura generada
        """
        if class_names is None:
            class_names = ['Victoria Local', 'Empate', 'Victoria Visitante']
        
        y_true = np.array(y_true)
        y_prob = np.array(y_prob)
        n_classes = len(class_names)
        
        # Calcular ROC para cada clase
        plt.figure(figsize=figsize)
        
        for i in range(n_classes):
            fpr, tpr, _ = roc_curve((y_true == i).astype(int), y_prob[:, i])
            roc_auc = auc(fpr, tpr)
            plt.plot(fpr, tpr, lw=2, label=f'{class_names[i]} (AUC = {roc_auc:.2f})')
        
        plt.plot([0, 1], [0, 1], 'k--', lw=2)
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('Tasa de Falsos Positivos')
        plt.ylabel('Tasa de Verdaderos Positivos')
        plt.title(f'Curvas ROC - {self.model_name}')
        plt.legend(loc="lower right")
        
        if save:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            plt.savefig(f"{self.save_dir}/{self.model_name}_roc_{timestamp}.png", bbox_inches='tight', dpi=300)
            logger.info(f"Curvas ROC guardadas: {self.save_dir}/{self.model_name}_roc_{timestamp}.png")
        
        return plt.gcf()
    
    def plot_precision_recall_curves(self, y_true, y_prob, class_names=None, figsize=(10, 8), save=True):
        """
        Genera y guarda curvas de precisión-recall para cada clase.
        
        Args:
            y_true (array-like): Valores reales
            y_prob (array-like): Probabilidades de predicción
            class_names (list): Nombres de las clases
            figsize (tuple): Tamaño de la figura
            save (bool): Si se debe guardar la figura
            
        Returns:
            matplotlib.figure.Figure: Figura generada
        """
        if class_names is None:
            class_names = ['Victoria Local', 'Empate', 'Victoria Visitante']
        
        y_true = np.array(y_true)
        y_prob = np.array(y_prob)
        n_classes = len(class_names)
        
        # Calcular curvas de precisión-recall para cada clase
        plt.figure(figsize=figsize)
        
        for i in range(n_classes):
            precision, recall, _ = precision_recall_curve((y_true == i).astype(int), y_prob[:, i])
            pr_auc = auc(recall, precision)
            plt.plot(recall, precision, lw=2, label=f'{class_names[i]} (AUC = {pr_auc:.2f})')
        
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('Recall')
        plt.ylabel('Precisión')
        plt.title(f'Curvas Precisión-Recall - {self.model_name}')
        plt.legend(loc="lower left")
        
        if save:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            plt.savefig(f"{self.save_dir}/{self.model_name}_pr_{timestamp}.png", bbox_inches='tight', dpi=300)
            logger.info(f"Curvas Precisión-Recall guardadas: {self.save_dir}/{self.model_name}_pr_{timestamp}.png")
        
        return plt.gcf()
    
    def plot_confidence_distribution(self, y_prob, bins=20, figsize=(10, 6), save=True):
        """
        Genera y guarda un histograma de distribución de confianza.
        
        Args:
            y_prob (array-like): Probabilidades de predicción
            bins (int): Número de bins para el histograma
            figsize (tuple): Tamaño de la figura
            save (bool): Si se debe guardar la figura
            
        Returns:
            matplotlib.figure.Figure: Figura generada
        """
        max_probs = np.max(y_prob, axis=1)
        
        plt.figure(figsize=figsize)
        plt.hist(max_probs, bins=bins, color='skyblue', edgecolor='black', alpha=0.7)
        plt.axvline(x=0.6, color='red', linestyle='--', label='Umbral de confianza (0.6)')
        plt.axvline(x=0.8, color='green', linestyle='--', label='Umbral de alta confianza (0.8)')
        
        plt.xlabel('Probabilidad máxima (confianza)')
        plt.ylabel('Número de predicciones')
        plt.title(f'Distribución de Confianza en Predicciones - {self.model_name}')
        plt.legend()
        plt.grid(alpha=0.3)
        
        if save:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            plt.savefig(f"{self.save_dir}/{self.model_name}_confidence_{timestamp}.png", bbox_inches='tight', dpi=300)
            logger.info(f"Distribución de confianza guardada: {self.save_dir}/{self.model_name}_confidence_{timestamp}.png")
        
        return plt.gcf()
    
    def _save_evaluation(self, evaluation):
        """
        Guarda la evaluación en disco.
        
        Args:
            evaluation (dict): Evaluación a guardar
        """
        timestamp = evaluation['timestamp'].replace(' ', '_').replace(':', '-')
        filename = f"{self.save_dir}/{self.model_name}_evaluation_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(evaluation, f, indent=4)
            
        logger.info(f"Evaluación guardada en {filename}")
    
    def load_evaluation(self, filename):
        """
        Carga una evaluación previamente guardada.
        
        Args:
            filename (str): Ruta del archivo a cargar
            
        Returns:
            dict: Evaluación cargada
        """
        try:
            with open(filename, 'r') as f:
                evaluation = json.load(f)
            
            logger.info(f"Evaluación cargada desde {filename}")
            return evaluation
        except Exception as e:
            logger.error(f"Error al cargar evaluación: {str(e)}")
            raise
    
    def compare_models(self, model_names, metric='accuracy'):
        """
        Compara múltiples modelos según una métrica específica.
        
        Args:
            model_names (list): Lista de nombres de modelos a comparar
            metric (str): Métrica para la comparación
            
        Returns:
            pandas.DataFrame: DataFrame con la comparación
        """
        results = []
        
        for model_name in model_names:
            # Buscar la última evaluación del modelo
            files = [f for f in os.listdir(self.save_dir) if f.startswith(f"{model_name}_evaluation_")]
            
            if not files:
                logger.warning(f"No se encontraron evaluaciones para el modelo {model_name}")
                continue
                
            # Ordenar por fecha (más reciente primero)
            latest_file = sorted(files)[-1]
            evaluation = self.load_evaluation(os.path.join(self.save_dir, latest_file))
            
            if metric in evaluation['metrics']:
                value = evaluation['metrics'][metric]
            elif metric == 'roi':
                value = evaluation['betting_metrics']['simulated_roi_percent']
            elif metric == 'high_confidence_accuracy':
                value = evaluation['betting_metrics']['high_confidence_accuracy']
            else:
                logger.warning(f"Métrica {metric} no encontrada para el modelo {model_name}")
                value = None
                
            results.append({
                'model': model_name,
                'metric': metric,
                'value': value,
                'timestamp': evaluation['timestamp']
            })
            
        return pd.DataFrame(results)
    
    def generate_report(self, evaluation):
        """
        Genera un informe de texto completo sobre una evaluación.
        
        Args:
            evaluation (dict): Evaluación de modelo
            
        Returns:
            str: Informe en formato texto
        """
        report = []
        report.append(f"# Informe de Evaluación - {self.model_name}")
        report.append(f"Fecha: {evaluation['timestamp']}\n")
        
        # Métricas generales
        report.append("## Métricas Generales")
        report.append(f"Accuracy: {evaluation['metrics']['accuracy']:.4f}")
        report.append(f"Precisión ponderada: {evaluation['metrics']['weighted_precision']:.4f}")
        report.append(f"Recall ponderado: {evaluation['metrics']['weighted_recall']:.4f}")
        report.append(f"F1-score ponderado: {evaluation['metrics']['weighted_f1']:.4f}\n")
        
        # Métricas por clase
        report.append("## Métricas por Clase")
        for class_name, metrics in evaluation['metrics']['class_metrics'].items():
            report.append(f"### {class_name}")
            report.append(f"Precisión: {metrics['precision']:.4f}")
            report.append(f"Recall: {metrics['recall']:.4f}")
            report.append(f"F1-score: {metrics['f1-score']:.4f}")
            report.append(f"Soporte: {metrics['support']}")
            report.append(f"ROC AUC: {metrics['roc_auc']:.4f}")
            report.append(f"PR AUC: {metrics['pr_auc']:.4f}\n")
        
        # Métricas de apuestas
        report.append("## Métricas para Apuestas")
        bet_metrics = evaluation['betting_metrics']
        report.append(f"Umbral de confianza: {bet_metrics['confidence_threshold']}")
        report.append(f"Predicciones de alta confianza: {bet_metrics['high_confidence_predictions']} ({bet_metrics['high_confidence_percentage']:.2f}%)")
        report.append(f"Precisión en predicciones de alta confianza: {bet_metrics['high_confidence_accuracy']:.4f}")
        report.append(f"ROI simulado: {bet_metrics['simulated_roi_percent']:.2f}%\n")
        
        # Predicciones de alta confianza por clase
        report.append("### Predicciones de Alta Confianza por Clase")
        for class_idx, metrics in bet_metrics['class_high_confidence'].items():
            class_name = list(evaluation['metrics']['class_metrics'].keys())[int(class_idx)]
            report.append(f"{class_name}: {metrics['count']} predicciones, precisión {metrics['accuracy']:.4f}")
        
        report_text = "\n".join(report)
        
        # Guardar informe
        timestamp = evaluation['timestamp'].replace(' ', '_').replace(':', '-')
        filename = f"{self.save_dir}/{self.model_name}_report_{timestamp}.md"
        
        with open(filename, 'w') as f:
            f.write(report_text)
            
        logger.info(f"Informe guardado en {filename}")
        
        return report_text

# Ejemplo de uso
if __name__ == '__main__':
    # Cargar datos de prueba (simplificado para el ejemplo)
    y_true = np.random.randint(0, 3, size=100)  # 0: victoria local, 1: empate, 2: victoria visitante
    y_pred = np.random.randint(0, 3, size=100)
    y_prob = np.random.random((100, 3))
    y_prob = y_prob / y_prob.sum(axis=1, keepdims=True)  # Normalizar para que sumen 1
    
    class_names = ['Victoria Local', 'Empate', 'Victoria Visitante']
    
    # Crear evaluador
    evaluator = ModelEvaluator('ModeloPredictor_v2')
    
    # Evaluar predicciones
    evaluation = evaluator.evaluate_predictions(y_true, y_pred, y_prob, class_names)
    
    # Generar gráficos
    evaluator.plot_confusion_matrix(evaluation)
    evaluator.plot_roc_curves(y_true, y_prob, class_names)
    evaluator.plot_precision_recall_curves(y_true, y_prob, class_names)
    evaluator.plot_confidence_distribution(y_prob)
    
    # Generar informe
    report = evaluator.generate_report(evaluation)
    print(report)
