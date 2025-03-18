/**
 * Système de notifications Toast
 * Remplace les alert() traditionnels par des notifications élégantes
 */

// Créer le conteneur de notifications s'il n'existe pas déjà
let toastContainer = document.querySelector('.toast-container');
if (!toastContainer) {
  toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
  
  // Ajouter la feuille de style si elle n'est pas déjà chargée
  if (!document.querySelector('link[href*="toast.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/toast.css';
    document.head.appendChild(link);
  }
}

// Icônes SVG pour les différents types de notifications
const icons = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="8"></line></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12" y2="17"></line></svg>`
};

/**
 * Fonction principale pour afficher une notification toast
 * @param {string} message - Le message à afficher
 * @param {string} type - Type de notification ('success', 'error', 'info', 'warning')
 * @param {number} duration - Durée d'affichage en ms (défaut: 3000ms)
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Créer l'élément toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Créer le contenu du toast
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">${message}</div>
    <button class="toast-close" aria-label="Fermer">&times;</button>
  `;
  
  // Ajouter le toast au conteneur
  toastContainer.appendChild(toast);
  
  // Animation d'entrée (setTimeout pour permettre au navigateur de traiter le DOM)
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Gestionnaire pour fermer le toast
  const closeToast = () => {
    toast.classList.add('hide');
    toast.classList.remove('show');
    
    // Supprimer l'élément après l'animation
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  };
  
  // Ajouter le gestionnaire d'événement pour le bouton de fermeture
  toast.querySelector('.toast-close').addEventListener('click', closeToast);
  
  // Fermeture automatique après la durée spécifiée
  if (duration > 0) {
    setTimeout(closeToast, duration);
  }
  
  // Fermeture au clic sur le toast (optionnel)
  toast.addEventListener('click', (e) => {
    if (e.target !== toast.querySelector('.toast-close')) {
      closeToast();
    }
  });
  
  return toast;
}

// Fonctions simplifiées pour chaque type de notification
export function showSuccess(message, duration = 3000) {
  return showToast(message, 'success', duration);
}

export function showError(message, duration = 4000) {
  return showToast(message, 'error', duration);
}

export function showInfo(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

export function showWarning(message, duration = 4000) {
  return showToast(message, 'warning', duration);
}