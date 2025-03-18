import { escapeHTML } from '../utils/securityUtils.js';
import { showSuccess, showError, showWarning, showInfo } from './toast.js'; // Importer les notifications Toast

document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/user/profile', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token') // Assurez-vous que le token est stocké dans localStorage
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            document.getElementById('first_name').value = escapeHTML(data.user.first_name || '');
            document.getElementById('last_name').value = escapeHTML(data.user.last_name || '');
            document.getElementById('email').placeholder = escapeHTML(data.user.email || '');
        } else {
            // Remplacer l'alerte par une notification Toast
            showError('Erreur lors de la récupération des informations utilisateur.');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        // Remplacer l'alerte par une notification Toast
        showError('Erreur lors de la récupération des informations utilisateur.');
    });

    document.getElementById('update-info-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const first_name = document.getElementById('first_name').value;
        const last_name = document.getElementById('last_name').value;
        const email = document.getElementById('email').value;

        // Afficher un toast de chargement pendant la requête
        const loadingToast = showInfo('Mise à jour de vos informations...', 0); // Durée 0 = ne pas fermer automatiquement

        fetch('/api/user/update-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ first_name, last_name, email })
        })
        .then(response => response.json())
        .then(data => {
            // Supprimer le toast de chargement
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }

            if (data.message === 'Informations mises à jour avec succès') {
                // Remplacer l'alerte par une notification Toast de succès
                showSuccess('Informations mises à jour avec succès');
            } else {
                // Remplacer l'alerte par une notification Toast d'erreur
                showError('Erreur : ' + data.message);
            }
        })
        .catch(error => {
            // Supprimer le toast de chargement
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }

            console.error('Erreur:', error);
            // Remplacer l'alerte par une notification Toast d'erreur
            showError('Erreur lors de la mise à jour des informations.');
        });
    });

    document.getElementById('change-password-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const oldPassword = document.getElementById('old_password').value;
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;

        if (newPassword !== confirmPassword) {
            // Remplacer l'alerte par une notification Toast d'avertissement
            showWarning('Les mots de passe ne correspondent pas.');
            return;
        }

        // Afficher un toast de chargement pendant la requête
        const loadingToast = showInfo('Mise à jour de votre mot de passe...', 0); // Durée 0 = ne pas fermer automatiquement

        fetch('/api/user/change-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ oldPassword, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            // Supprimer le toast de chargement
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }

            if (data.message === 'Mot de passe mis à jour avec succès') {
                // Remplacer l'alerte par une notification Toast de succès
                showSuccess('Mot de passe mis à jour avec succès');
                
                // Réinitialiser les champs du formulaire
                document.getElementById('old_password').value = '';
                document.getElementById('new_password').value = '';
                document.getElementById('confirm_password').value = '';
            } else {
                // Remplacer l'alerte par une notification Toast d'erreur
                showError('Erreur : ' + data.message);
            }
        })
        .catch(error => {
            // Supprimer le toast de chargement
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }

            console.error('Erreur:', error);
            // Remplacer l'alerte par une notification Toast d'erreur
            showError('Erreur lors de la mise à jour du mot de passe.');
        });
    });
});