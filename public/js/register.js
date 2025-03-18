import { storeToken } from './auth.js';

export async function registerUser(first_name, last_name, email, password, confirmPassword) {
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ first_name, last_name, email, password })
        });
        const data = await response.json();

        if (data.message === 'Utilisateur inscrit avec succès') {
            // Connexion automatique après l'inscription réussie
            const loginResponse = await fetch('/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const loginData = await loginResponse.json();

            if (loginData.token) {
                storeToken(loginData.token);
                return;
            } else {
                throw new Error('Erreur lors de la connexion.');
            }
        } else {
            throw new Error('Erreur : ' + data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}


