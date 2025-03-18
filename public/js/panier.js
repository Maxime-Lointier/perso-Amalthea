import { isAuthenticated } from "./auth.js";
import { escapeHTML } from '../utils/securityUtils.js';
import { showSuccess, showError, showInfo } from './toast.js';

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const cartSummary = document.getElementById('cartSummary');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Modifier la fonction loadCart dans panier.js
    async function loadCart() {
        if (isAuthenticated()) {
            try {
                const response = await fetch('/api/cart', {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                
                console.log("Status:", response.status);
                console.log("Headers:", [...response.headers.entries()]);

                const rawText = await response.text(); // Obtenir le texte brut
                console.log("Réponse brute:", rawText);

                // Essayer de parser en JSON
                try {
                    const data = JSON.parse(rawText);
                    console.log("Données parsées:", data);
                    // Continuer le traitement...
                    // Vérifier si le token est expiré
                    if (data.expired) {
                        console.log("Token expiré détecté par le serveur");
                        localStorage.removeItem('token');
                        window.location.href = '/views/html/accueil.html';
                    }

                    if (data.cart) {
                        displayCartItems(data.cart, true); // true indique que c'est un panier serveur
                    }
                } catch (e) {
                    console.error("Erreur lors du parsing JSON:", e);
                }
            } catch (error) {
                console.error('Erreur:', error);
            }
        } else {
            // Charger le panier depuis localStorage
            const savedCart = JSON.parse(localStorage.getItem('labelCart') || '[]');
            displayCartItems(savedCart, false); // false indique que c'est un panier local
        }
    }

    // Modifier displayCartItems pour gérer les deux types de paniers
    function displayCartItems(cartItems, isServerCart) {
        cartItemsContainer.innerHTML = ''; // Cette ligne est acceptable car elle vide simplement le contenu
        
        if (cartItems.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartSummary.style.display = 'none';
            return;
        }

        emptyCartMessage.style.display = 'none';
        cartSummary.style.display = 'block';
        
        let totalPrice = 0;
        
        cartItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            // Prix standard par étiquette
            const unitPrice = 44.50;
            
            // Calculer le prix total pour cet article
            const quantity = parseInt(item.quantity) || 1;
            const itemPrice = unitPrice * quantity;
            
            // Ajouter au total général
            totalPrice += itemPrice;
            
            // Créer les détails de l'article
            const detailsContainer = document.createElement('div');
            detailsContainer.classList.add('cart-item-details');
            
            const titleElement = document.createElement('h3');
            titleElement.textContent = `Étiquette #${index + 1}`;
            detailsContainer.appendChild(titleElement);
            
            // Ajouter les informations de quantité
            const quantityPara = document.createElement('p');
            const quantityStrong = document.createElement('strong');
            quantityStrong.textContent = 'Quantité: ';
            quantityPara.appendChild(quantityStrong);
            quantityPara.appendChild(document.createTextNode(item.quantity));
            detailsContainer.appendChild(quantityPara);
            
            // Ajouter le nom de pharmacie
            const pharmacyPara = document.createElement('p');
            const pharmacyStrong = document.createElement('strong');
            pharmacyStrong.textContent = 'Pharmacie: ';
            pharmacyPara.appendChild(pharmacyStrong);
            pharmacyPara.appendChild(document.createTextNode(item.pharmacy_name));
            detailsContainer.appendChild(pharmacyPara);
            
            // Ajouter des informations différentes selon le type de panier
            if (isServerCart) {
                // Pour les articles du serveur
                const addressPara = document.createElement('p');
                const addressStrong = document.createElement('strong');
                addressStrong.textContent = 'Adresse: ';
                addressPara.appendChild(addressStrong);
                addressPara.appendChild(document.createTextNode(`${item.pharmacy_address}, ${item.pharmacy_postal_code || ''}`));
                detailsContainer.appendChild(addressPara);
                
                const phonePara = document.createElement('p');
                const phoneStrong = document.createElement('strong');
                phoneStrong.textContent = 'Téléphone: ';
                phonePara.appendChild(phoneStrong);
                phonePara.appendChild(document.createTextNode(item.pharmacy_phone));
                detailsContainer.appendChild(phonePara);
                
                const formatPara = document.createElement('p');
                const formatStrong = document.createElement('strong');
                formatStrong.textContent = 'Format: ';
                formatPara.appendChild(formatStrong);
                formatPara.appendChild(document.createTextNode(item.format));
                detailsContainer.appendChild(formatPara);
                
                const colorPara = document.createElement('p');
                const colorStrong = document.createElement('strong');
                colorStrong.textContent = 'Couleur: ';
                colorPara.appendChild(colorStrong);
                colorPara.appendChild(document.createTextNode(item.color));
                detailsContainer.appendChild(colorPara);
            } else {
                // Pour les articles locaux
                const addressPara = document.createElement('p');
                const addressStrong = document.createElement('strong');
                addressStrong.textContent = 'Adresse: ';
                addressPara.appendChild(addressStrong);
                addressPara.appendChild(document.createTextNode(item.pharmacy_address));
                detailsContainer.appendChild(addressPara);
                
                const phonePara = document.createElement('p');
                const phoneStrong = document.createElement('strong');
                phoneStrong.textContent = 'Téléphone: ';
                phonePara.appendChild(phoneStrong);
                phonePara.appendChild(document.createTextNode(item.pharmacy_phone));
                detailsContainer.appendChild(phonePara);
                
                const formatPara = document.createElement('p');
                const formatStrong = document.createElement('strong');
                formatStrong.textContent = 'Format: ';
                formatPara.appendChild(formatStrong);
                formatPara.appendChild(document.createTextNode(item.format));
                detailsContainer.appendChild(formatPara);
                
                const colorPara = document.createElement('p');
                const colorStrong = document.createElement('strong');
                colorStrong.textContent = 'Couleur: ';
                colorPara.appendChild(colorStrong);
                colorPara.appendChild(document.createTextNode(item.color));
                detailsContainer.appendChild(colorPara);
            }
            
            // Ajouter le prix unitaire et total
            const unitPricePara = document.createElement('p');
            const unitPriceStrong = document.createElement('strong');
            unitPriceStrong.textContent = 'Prix unitaire: ';
            unitPricePara.appendChild(unitPriceStrong);
            unitPricePara.appendChild(document.createTextNode(`${unitPrice.toFixed(2)}€`));
            detailsContainer.appendChild(unitPricePara);
            
            const totalPricePara = document.createElement('p');
            const totalPriceStrong = document.createElement('strong');
            totalPriceStrong.textContent = 'Prix total: ';
            totalPricePara.appendChild(totalPriceStrong);
            totalPricePara.appendChild(document.createTextNode(`${itemPrice.toFixed(2)}€`));
            detailsContainer.appendChild(totalPricePara);
            
            // Ajouter le logo si disponible et qu'il n'y a pas de prévisualisation
            if (item.logo && !item.preview) {
                const logoContainer = document.createElement('div');
                logoContainer.className = 'logo-container';
                
                const logoImg = document.createElement('img');
                logoImg.className = 'pharmacy-logo';
                logoImg.alt = 'Logo de pharmacie';
                
                if (isServerCart) {
                    logoImg.src = `/uploads/${item.logo}`;
                } else {
                    logoImg.src = item.logo;
                }
                
                logoContainer.appendChild(logoImg);
                detailsContainer.appendChild(logoContainer);
            }
            
            // Ajouter le conteneur de détails à l'élément principal
            itemElement.appendChild(detailsContainer);
            
            // Ajouter la section de prévisualisation
            const previewContainer = document.createElement('div');
            previewContainer.className = 'item-preview-container';
            
            // Ajouter l'image de prévisualisation si disponible
            if (item.preview) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'item-preview';
                
                const previewImg = document.createElement('img');
                previewImg.className = 'preview-thumbnail';
                previewImg.alt = "Aperçu de l'étiquette";
                
                if (isServerCart) {
                    previewImg.src = `/uploads/previews/${item.preview}`;
                } else {
                    previewImg.src = item.preview;
                }
                
                previewDiv.appendChild(previewImg);
                previewContainer.appendChild(previewDiv);
            } 
            // Si pas de prévisualisation mais un logo, afficher le logo au centre
            else if (item.logo) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'item-preview';
                
                const logoImg = document.createElement('img');
                logoImg.className = 'preview-thumbnail';
                logoImg.alt = "Logo de pharmacie";
                
                if (isServerCart) {
                    logoImg.src = `/uploads/${item.logo}`;
                } else {
                    logoImg.src = item.logo;
                }
                
                previewDiv.appendChild(logoImg);
                previewContainer.appendChild(previewDiv);
            }
            
            itemElement.appendChild(previewContainer);
            
            // Ajouter la section des actions
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'item-actions';
            
            // Bouton supprimer
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-item';
            removeButton.textContent = 'Supprimer';
            
            // Pour les articles du serveur, on utilise les IDs pour la suppression
            if (isServerCart) {
                removeButton.dataset.cartId = item.id;
                removeButton.dataset.customizationId = item.customization_id;
            } else {
                // Pour les articles locaux, on utilise l'index
                removeButton.dataset.index = index;
            }
            
            actionsContainer.appendChild(removeButton);
            itemElement.appendChild(actionsContainer);
            
            cartItemsContainer.appendChild(itemElement);
        });
        
        // Mettre à jour le total
        cartTotal.textContent = `${totalPrice.toFixed(2)}€`;
        
        // Ajouter les gestionnaires d'événements pour les boutons de suppression
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', function() {
                if (isServerCart) {
                    const cartId = this.getAttribute('data-cart-id');
                    const customizationId = this.getAttribute('data-customization-id');
                    removeFromCart(cartId, customizationId);
                } else {
                    const index = this.getAttribute('data-index');
                    removeFromCart(null, null, index);
                }
            });
        });
    }

    function removeFromCart(id, customizationId, index) {
        if (isAuthenticated()) {
            fetch(`/api/cart/${id}/customization/${customizationId}`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    // Ajouter le toast de succès ici
                    showSuccess('Article supprimé du panier avec succès');
                    loadCart();
                } else {
                    showError('Erreur lors de la suppression de l\'article du panier.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showError('Erreur lors de la suppression de l\'article du panier.');
            });
        } else {
            const savedCart = JSON.parse(localStorage.getItem('labelCart') || '[]');
            savedCart.splice(index, 1);
            localStorage.setItem('labelCart', JSON.stringify(savedCart));
            // Ajouter le toast de succès pour le panier local aussi
            showSuccess('Article supprimé du panier avec succès');
            loadCart();
        }
    }

    // Checkout functionality (simulated)
    checkoutBtn.addEventListener('click', () => {
        window.location.href = '/views/html/checkout.html';
        //localStorage.removeItem('labelCart');
        loadCart();
    });

    // Initial cart load
    loadCart();
});