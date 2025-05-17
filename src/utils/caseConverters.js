// utils/caseConverters.js

/**
 * Converti una stringa da camelCase a snake_case
 * @param {string} str - La stringa camelCase da convertire
 * @returns {string} La stringa convertita in snake_case
 */
export const camelToSnake = (str) => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  };
  
  /**
   * Converti una stringa da snake_case a camelCase
   * @param {string} str - La stringa snake_case da convertire
   * @returns {string} La stringa convertita in camelCase
   */
  export const snakeToCamel = (str) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  };
  
  /**
   * Converti tutte le chiavi di un oggetto da camelCase a snake_case
   * @param {Object} obj - L'oggetto con chiavi in camelCase
   * @returns {Object} Un nuovo oggetto con le chiavi in snake_case
   */
  export const objectKeysToSnake = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
  
    if (Array.isArray(obj)) {
      return obj.map(item => objectKeysToSnake(item));
    }
  
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const newKey = camelToSnake(key);
        const newValue = objectKeysToSnake(value);
        return [newKey, newValue];
      })
    );
  };
  
  /**
   * Converti tutte le chiavi di un oggetto da snake_case a camelCase
   * @param {Object} obj - L'oggetto con chiavi in snake_case
   * @returns {Object} Un nuovo oggetto con le chiavi in camelCase
   */
  export const objectKeysToCamel = (obj) => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
  
    if (Array.isArray(obj)) {
      return obj.map(item => objectKeysToCamel(item));
    }
  
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        const newKey = snakeToCamel(key);
        const newValue = objectKeysToCamel(value);
        return [newKey, newValue];
      })
    );
  };