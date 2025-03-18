import { isTokenExpired } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const pageContent = document.getElementById('pageContent');

    if (!token) {
        // Rediriger vers la page de connexion si le token n'est pas présent
        window.location.href = '/views/html/accueil.html';
        console.log('Token non trouvé');
    } else if (isTokenExpired()) {
        // Vérifier l'expiration du token
        localStorage.removeItem('token');
        window.location.href = '/views/html/accueil.html';
        console.log('Token expiré');
    } else {
        // Vérifier la validité du token en faisant une requête au serveur
        fetch('/api/user/verify-token', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.valid) {
                // Rediriger vers la page de connexion si le token est invalide
                localStorage.removeItem('token');
                window.location.href = '/views/html/accueil.html';
                console.log('Token invalide');
            } else {
                // Afficher le contenu de la page si le token est valide
                pageContent.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du token:', error);
            localStorage.removeItem('token');
            window.location.href = '/views/html/accueil.html';
            console.log('Erreur lors de la vérification du token');
        });
    }
});