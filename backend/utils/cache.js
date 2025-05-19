// backend/utils/cache.js

/**
 * Sistema de caché en memoria para optimizar consultas repetidas
 * Almacena datos con tiempo de expiración configurable
 */
class Cache {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    
    // Ejecutar limpieza periódica (cada 15 minutos)
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }
  
  /**
   * Almacena un valor en caché con tiempo de expiración
   * @param {string} key - Clave para almacenar el valor
   * @param {any} value - Valor a almacenar
   * @param {number} ttl - Tiempo de vida en segundos (defecto: 1 hora)
   */
  set(key, value, ttl = 3600) {
    const expiry = Date.now() + (ttl * 1000);
    
    this.store.set(key, {
      value,
      expiry
    });
    
    this.stats.size = this.store.size;
    
    return true;
  }
  
  /**
   * Recupera un valor de la caché
   * @param {string} key - Clave a buscar
   * @returns {any|null} - Valor almacenado o null si no existe o expiró
   */
  get(key) {
    const item = this.store.get(key);
    
    // No encontrado
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Comprobar expiración
    if (item.expiry < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }
  
  /**
   * Elimina una clave de la caché
   * @param {string} key - Clave a eliminar
   * @returns {boolean} - true si se eliminó, false si no existía
   */
  delete(key) {
    const result = this.store.delete(key);
    this.stats.size = this.store.size;
    return result;
  }
  
  /**
   * Comprueba si una clave existe y no ha expirado
   * @param {string} key - Clave a comprobar
   * @returns {boolean} - true si existe y es válida
   */
  has(key) {
    const item = this.store.get(key);
    if (!item) return false;
    
    // Comprobar expiración
    if (item.expiry < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Elimina todas las entradas de la caché
   */
  clear() {
    this.store.clear();
    this.stats.size = 0;
    return true;
  }
  
  /**
   * Limpia entradas expiradas de la caché
   * @returns {number} - Número de entradas eliminadas
   */
  cleanup() {
    let count = 0;
    const now = Date.now();
    
    for (const [key, item] of this.store.entries()) {
      if (item.expiry < now) {
        this.store.delete(key);
        count++;
      }
    }
    
    this.stats.size = this.store.size;
    console.log(`Caché limpiada: ${count} entradas expiradas eliminadas`);
    
    return count;
  }
  
  /**
   * Devuelve estadísticas de uso de la caché
   * @returns {object} - Estadísticas de uso
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      keys: Array.from(this.store.keys())
    };
  }
}

// Exportar una única instancia para toda la aplicación
module.exports = new Cache();
