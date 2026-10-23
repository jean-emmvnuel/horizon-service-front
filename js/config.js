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
  VERSION: '2.1.0'
};

// Exposition globale pour window (DOM) et self (Workers)
if (typeof window !== 'undefined') {
  window.HORIZON_CONFIG = HORIZON_CONFIG;
}
if (typeof self !== 'undefined') {
  self.HORIZON_CONFIG = HORIZON_CONFIG;
}

// ==========================================================================
// 1. PURGE COMPLÈTE DU CACHE LOCAL (ZÉRO CACHE LOCAL)
// ==========================================================================
try {
  // Suppression de la BDD locale stockée en cache
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('horizon_service_db');
    sessionStorage.removeItem('horizon_service_db');
  }

  // Suppression de tous les caches Service Worker / CacheStorage
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch(() => {});
  }

  // Désinscription de tout Service Worker pour garantir du réseau direct pur
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
} catch (e) {
  console.warn('Nettoyage cache local :', e);
}

// ==========================================================================
// 2. SYSTÈME GLOBAL DE NOTIFICATIONS TOAST (SUCCÈS / ÉCHEC)
// ==========================================================================
function showToast(message, type = 'info', duration = 4000) {
  if (typeof document === 'undefined') return;

  let container = document.getElementById('toast-container');
  if (!container && document.body) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  if (!container) return;

  const normalized = (type === 'danger' || type === 'error') ? 'error' : type;
  const toast = document.createElement('div');
  toast.className = `toast toast-${normalized}`;

  let icon = 'ℹ️';
  if (normalized === 'success') icon = '✅';
  else if (normalized === 'error') icon = '❌';
  else if (normalized === 'warning') icon = '⚠️';

  toast.innerHTML = `
    <span style="font-size: 16px; line-height: 1; flex-shrink: 0;">${icon}</span>
    <div style="flex-grow: 1; font-weight: 500; word-break: break-word;">${String(message).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 200ms ease';
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}
