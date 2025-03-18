//import jwt_decode from 'jwt-decode';
//import jwtDecode from "jwt-decode";

// Function to check if the user is authenticated
export function isAuthenticated() {
    const token = localStorage.getItem('token');
    return token !== null;
}

// Function to store the JWT token
export function storeToken(token) {
    localStorage.setItem('token', token);
}

// Function to make authenticated requests
export function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No token found');
    }

    options.headers = {
        ...options.headers,
        'Authorization': 'Bearer ' + token
    };

    return fetch(url, options)
        .then(response => response.json());
}

// Fonction pour récupérer le token JWT
export function getToken() {
    return localStorage.getItem('token');
}

// Ajouter cette fonction pour vérifier l'expiration
export function isTokenExpired() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return true;
    }
    
    try {
        // Récupérer la partie payload du token
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Vérifier si la date d'expiration est passée
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch (e) {
        console.error("Erreur lors de la vérification de l'expiration du token:", e);
        return true; // En cas d'erreur, considérer le token comme expiré
    }
}

// Ajouter cette fonction pour gérer la déconnexion en cas d'expiration
export function checkTokenExpiration() {
    if (isTokenExpired()) {
        console.log("Token expiré, redirection vers la page d'accueil");
        localStorage.removeItem('token'); // Supprimer le token
        window.location.href = '/views/html/accueil.html'; // Rediriger vers l'accueil
        return false;
    }
    return true;
}

// // Function to load jwt-decode dynamically
// async function loadJwtDecode() {
//     const module = await import('https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.min.js');
//     return module.default || module;
// }

// // Function to check if the token is expired
// export async function isExpired(token) {
    
//     const jwt_decode = await loadJwtDecode();
//     console.log(jwt_decode);
//     const decoded = jwt_decode(token);
//     const currentTime = Date.now() / 1000;
//     return decoded.exp < currentTime;
// }