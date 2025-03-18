import { storeToken, isAuthenticated } from './auth.js';

export function popup(event, path) {
    event.preventDefault();

    // Si l'utilisateur est authentifié, rediriger vers la page spécifiée
    if (isAuthenticated()) {
        window.location.href = path;
        return;
    }

    const container = document.getElementById('login-popup-container');
    
    // Vider le conteneur de manière sécurisée
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Créer la structure du popup de manière sécurisée avec createElement
    const popupDiv = document.createElement('div');
    popupDiv.id = 'login-popup';
    popupDiv.className = 'popup';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'popup-content';
    
    const closeSpan = document.createElement('span');
    closeSpan.className = 'close';
    closeSpan.textContent = '×';
    
    const title = document.createElement('h2');
    title.textContent = 'Connexion';
    
    const form = document.createElement('form');
    form.id = 'login-form';
    
    // Groupe de formulaire pour email
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'login-email');
    emailLabel.textContent = 'Email:';
    
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'login-email';
    emailInput.name = 'login-email';
    
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    
    // Groupe de formulaire pour mot de passe
    const passwordGroup = document.createElement('div');
    passwordGroup.className = 'form-group';
    
    const passwordLabel = document.createElement('label');
    passwordLabel.setAttribute('for', 'login-password');
    passwordLabel.textContent = 'Mot de Passe:';
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'login-password';
    passwordInput.name = 'login-password';
    
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    
    // Bouton de soumission
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Se Connecter';
    
    // Lien d'inscription
    const registerLink = document.createElement('a');
    registerLink.href = 'register.html';
    registerLink.id = 'register-link';
    registerLink.textContent = 'Inscription';
    
    // Assembler le formulaire
    form.appendChild(emailGroup);
    form.appendChild(passwordGroup);
    form.appendChild(submitButton);
    form.appendChild(registerLink);
    
    // Assembler le contenu du popup
    contentDiv.appendChild(closeSpan);
    contentDiv.appendChild(title);
    contentDiv.appendChild(form);
    
    // Assembler le popup
    popupDiv.appendChild(contentDiv);
    
    // Ajouter la feuille de style pour le popup
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/css/login-popup.css';
    document.head.appendChild(styleLink);
    
    // Ajouter le popup au conteneur
    container.appendChild(popupDiv);
    
    const loginPopup = document.getElementById('login-popup');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('login-form');
    
    loginPopup.style.display = 'block';
    
    closeBtn.addEventListener('click', function() {
        loginPopup.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target == loginPopup) {
            loginPopup.style.display = 'none';
        }
    });
    
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        fetch('/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                storeToken(data.token);
                loginPopup.style.display = 'none';
                if (path === 'reload') {
                    window.location.reload();
                } else {
                    window.location.href = path;
                }
            } else {
                // Créer un message d'erreur sécurisé
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.textContent = data.message || 'Erreur de connexion';
                
                // Supprimer tout message d'erreur précédent
                const existingError = loginForm.querySelector('.error-message');
                if (existingError) {
                    loginForm.removeChild(existingError);
                }
                
                // Ajouter le nouveau message d'erreur
                loginForm.appendChild(errorMessage);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Afficher un message d'erreur générique
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Erreur de connexion au serveur';
            
            // Supprimer tout message d'erreur précédent
            const existingError = loginForm.querySelector('.error-message');
            if (existingError) {
                loginForm.removeChild(existingError);
            }
            
            // Ajouter le message d'erreur
            loginForm.appendChild(errorMessage);
        });
    });
}