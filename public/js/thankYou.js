import { isAuthenticated, checkTokenExpiration } from './auth.js';
import { escapeHTML } from '../utils/securityUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier si l'utilisateur est authentifié
    if (!isAuthenticated() || !checkTokenExpiration()) {
        window.location.href = '/views/html/accueil.html';
        return;
    }

    // Récupérer l'ID de session Stripe depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    // SÉCURITÉ CRITIQUE: Rediriger si pas d'ID de session ou pas celui conservé en stockage
    if (!sessionId || sessionId !== sessionStorage.getItem('validPaymentSession')) {
        console.error("Tentative d'accès non autorisé à la page de confirmation");
        window.location.href = '/views/html/accueil.html';
        return;
    }
    
    // Supprimer l'ID de session du stockage pour empêcher les rechargements
    sessionStorage.removeItem('validPaymentSession');
    
    
    
    const container = document.querySelector('.container');
    
    // Vider le conteneur
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Créer les éléments de façon sécurisée
    const title = document.createElement('h1');
    title.textContent = 'Finalisation de votre commande...';
    container.appendChild(title);
    
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.style.margin = '30px 0';
    
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Traitement de votre commande en cours...';
    loadingIndicator.appendChild(loadingText);
    
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.border = '4px solid #f3f3f3';
    spinner.style.borderTop = '4px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.animation = 'spin 2s linear infinite';
    spinner.style.margin = '20px auto';
    loadingIndicator.appendChild(spinner);
    
    container.appendChild(loadingIndicator);
    
    // Ajouter le style d'animation
    const styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(styleEl);
    
    try {
        // Vérifier le statut de la session de paiement
        const response = await fetch(`/api/payment/verify-session?session_id=${sessionId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        
        if (!response.ok) {
            throw new Error('Erreur lors de la vérification du paiement');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // 1. Envoyer les données du panier à Google Sheets
            await sendCartDataToGoogleSheets();
            
            // 2. Supprimer les images du panier
            await deleteCartImages();
            
            // 3. Vider le panier
            await clearCart();
            
            // 4. Afficher un message de confirmation avec createElements au lieu de innerHTML
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            // Titre principal
            const thankYouTitle = document.createElement('h1');
            thankYouTitle.textContent = 'Merci pour votre commande !';
            container.appendChild(thankYouTitle);
            
            // Message de succès
            const orderStatus = document.createElement('div');
            orderStatus.id = 'order-status';
            orderStatus.className = 'success';
            orderStatus.style.fontSize = '18px';
            orderStatus.style.margin = '20px 0';
            orderStatus.style.padding = '15px';
            orderStatus.style.borderRadius = '5px';
            orderStatus.style.backgroundColor = '#d4edda';
            orderStatus.style.color = '#155724';
            orderStatus.textContent = 'Votre commande a été traitée avec succès !';
            container.appendChild(orderStatus);
            
            // Détails de la commande
            const orderDetails = document.createElement('div');
            orderDetails.id = 'order-details';
            
            const emailConfirmation = document.createElement('p');
            emailConfirmation.textContent = 'Un email de confirmation vous a été envoyé.';
            orderDetails.appendChild(emailConfirmation);
            
            const orderIdParagraph = document.createElement('p');
            const orderIdStrong = document.createElement('strong');
            orderIdStrong.textContent = 'Référence de commande : ';
            orderIdParagraph.appendChild(orderIdStrong);
            orderIdParagraph.appendChild(document.createTextNode(data.orderId));
            orderDetails.appendChild(orderIdParagraph);
            
            const dateParagraph = document.createElement('p');
            const dateStrong = document.createElement('strong');
            dateStrong.textContent = 'Date : ';
            dateParagraph.appendChild(dateStrong);
            dateParagraph.appendChild(document.createTextNode(new Date().toLocaleDateString()));
            orderDetails.appendChild(dateParagraph);
            
            container.appendChild(orderDetails);
            
            // Bouton de retour à l'accueil
            const homeLink = document.createElement('a');
            homeLink.href = 'accueil.html';
            homeLink.className = 'btn';
            homeLink.textContent = 'Retour à l\'accueil';
            homeLink.style.display = 'inline-block';
            homeLink.style.padding = '10px 20px';
            homeLink.style.backgroundColor = '#3498db';
            homeLink.style.color = 'white';
            homeLink.style.borderRadius = '5px';
            homeLink.style.textDecoration = 'none';
            homeLink.style.marginTop = '20px';
            container.appendChild(homeLink);
            
            // Masquer l'ID de session dans l'URL pour plus de sécurité
            window.history.replaceState({}, document.title, '/views/html/thankYou.html');
        } else {
            throw new Error(data.error || 'Erreur lors de la vérification du paiement');
        }
    } catch (error) {
        console.error('Erreur:', error);
        
        // Vider le conteneur
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Afficher le message d'erreur de façon sécurisée
        const errorTitle = document.createElement('h1');
        errorTitle.textContent = 'Problème avec votre commande';
        container.appendChild(errorTitle);
        
        const orderStatusError = document.createElement('div');
        orderStatusError.id = 'order-status';
        orderStatusError.className = 'error';
        orderStatusError.style.fontSize = '18px';
        orderStatusError.style.margin = '20px 0';
        orderStatusError.style.padding = '15px';
        orderStatusError.style.borderRadius = '5px';
        orderStatusError.style.backgroundColor = '#f8d7da';
        orderStatusError.style.color = '#721c24';
        orderStatusError.textContent = 'Une erreur est survenue lors du traitement de votre paiement.';
        container.appendChild(orderStatusError);
        
        const contactMsg = document.createElement('p');
        contactMsg.textContent = 'Veuillez nous contacter si votre carte a été débitée.';
        container.appendChild(contactMsg);
        
        const homeLink = document.createElement('a');
        homeLink.href = 'accueil.html';
        homeLink.className = 'btn';
        homeLink.textContent = 'Retour à l\'accueil';
        homeLink.style.display = 'inline-block';
        homeLink.style.padding = '10px 20px';
        homeLink.style.backgroundColor = '#3498db';
        homeLink.style.color = 'white';
        homeLink.style.borderRadius = '5px';
        homeLink.style.textDecoration = 'none';
        homeLink.style.marginTop = '20px';
        container.appendChild(homeLink);
    }
});

// Fonction existante pour envoyer les données à Google Sheets
async function sendCartDataToGoogleSheets(cartData) {
    try {
        // Si cartData n'est pas fourni, on essaie de le récupérer
        if (!cartData) {
            const cartResponse = await fetch('/api/cart', {
                method: 'GET',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            });
            const cartResult = await cartResponse.json();
            cartData = cartResult.cart;
        }
        
        const response = await fetch('/api/googleSheets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ items: cartData })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur lors de l\'envoi des données à Google Sheets:', errorData);
            throw new Error('Erreur lors de l\'envoi des données à Google Sheets');
        }
        
        console.log('Données envoyées à Google Sheets avec succès');
        return true;
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

// Fonction pour supprimer les images liées au panier
async function deleteCartImages() {
    try {
        const response = await fetch('/api/cart/delete-images', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur lors de la suppression des images:', errorData);
            throw new Error('Erreur lors de la suppression des images');
        }
        
        console.log('Images du panier supprimées avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la suppression des images:', error);
        throw error;
    }
}

// Fonction pour vider le panier après le paiement
async function clearCart() {
    try {
        const response = await fetch('/api/cart/clear', {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Erreur lors de la suppression du panier:', error);
        return false;
    }
}
