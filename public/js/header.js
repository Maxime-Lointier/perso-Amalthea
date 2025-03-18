import { popup } from './login-popup.js';
import { isAuthenticated } from './auth.js';

// Bouton connecter / déconnecter
function updateHeader() {
    const profileLink = document.getElementById('profile-link');
    const authButton = document.createElement('button');
    authButton.className = 'auth-button';
    
    if (isAuthenticated()) {
        authButton.textContent = 'Se Déconnecter';
        authButton.onclick = function() {
            localStorage.removeItem('token');
            window.location.href = '/accueil.html';
        };
    } else {
        authButton.textContent = 'Se Connecter';
        authButton.onclick = function(event) {
            popup(event, 'reload');
        };
    }
    
    profileLink.insertAdjacentElement('afterend', authButton);
}

document.addEventListener('DOMContentLoaded', function() {
    const profileLink = document.getElementById('profile-link');

    profileLink.addEventListener('click', function(event) {
        popup(event, '/views/html/profil.html');
    });

    updateHeader(); // Met à jour le header
});