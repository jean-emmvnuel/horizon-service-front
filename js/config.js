/**
 * HORIZON SERVICE — CONFIGURATION GLOBALE CENTRALISÉE
 * 
 * Modifiez l'URL de l'API ici pour basculer l'ensemble de l'application en 1 seule ligne :
 * - Production : 'https://horizon-service.onrender.com'
 * - Local      : 'http://localhost:3001'
 */
const HORIZON_CONFIG = {
  API_URL: 'https://horizon-service.onrender.com',
  APP_NAME: 'Horizon Service',
  CURRENCY: 'FCFA',
  VERSION: '2.0.0'
};

// Exposition globale pour window (DOM) et self (Workers)
if (typeof window !== 'undefined') {
  window.HORIZON_CONFIG = HORIZON_CONFIG;
}
if (typeof self !== 'undefined') {
  self.HORIZON_CONFIG = HORIZON_CONFIG;
}
