import { checkTokenExpiration } from './auth.js';

// Intercepter tous les clics sur la page pour vérifier l'expiration
document.addEventListener('click', function(event) {
    // Vérifier l'expiration du token avant de traiter le clic
    // Si le token est expiré, checkTokenExpiration s'occupera de la redirection
    // et retournera false pour éviter les comportements indésirables
    checkTokenExpiration();
}, true);

// Intercepter toutes les requêtes fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
    // Vérifier l'expiration du token avant chaque requête
    if (checkTokenExpiration()) {
        // Si le token est valide, procéder à la requête
        return originalFetch.apply(this, args);
    } else {
        // Si le token est expiré, renvoyer une promesse rejetée
        return Promise.reject(new Error('Token expiré'));
    }
};