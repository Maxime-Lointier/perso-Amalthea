import { isAuthenticated } from './auth.js';
import { registerUser } from './register.js'; 
import { addCheckOut, transferCartAtCheckout } from './addCartCheckOut.js';
import { popup } from './login-popup.js'; // Importer la fonction popup
import { escapeHTML } from '../utils/securityUtils.js';
// Ajouter l'import des fonctions toast en haut du fichier
import { showSuccess, showError, showInfo, showWarning } from './toast.js';

// Au début du fichier, ajouter une variable pour stocker les prix
let productPrices = {
    format60x50Label: { amount: 44.50 }, // Valeurs par défaut
    format50x40Label: { amount: 39.90 },
    format40x30Label: { amount: 34.90 },
    format50x20Label: { amount: 29.90 }
};

// Ajouter une fonction pour charger les prix
async function loadProductPrices() {
    try {
        const response = await fetch('/api/products/prices');
        const prices = await response.json();
        productPrices = prices;
        console.log("Prix chargés:", productPrices);
    } catch (error) {
        console.error("Erreur lors du chargement des prix:", error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Charger les prix au démarrage
    await loadProductPrices();

    const checkoutForm = document.getElementById('checkout-form');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    const loginForm = document.getElementById('login-form-2');
    
    // NOUVEAU: Ajouter l'écouteur d'événement pour le bouton "déjà un compte"
    const loginButton = document.getElementById('login');
    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Mémoriser qu'on a utilisé le bouton "déjà un compte"
            sessionStorage.setItem('loginFromCheckout', 'true');
            
            // Appeler la popup de connexion avec la page courante comme destination
            popup(event, "reload");
        });
    }
    
    // Référence au bouton "Déjà un compte"
    const switchToLoginBtn = document.getElementById('switch-to-login');
    
    // Vérifier si le bouton existe et ajouter l'écouteur d'événement
    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Mémoriser qu'on a utilisé le bouton "déjà un compte"
            sessionStorage.setItem('loginFromCheckout', 'true');
            
            // Appeler la popup de connexion
            popup(event, "reload");
        });
    }
    
    // NOUVEAU: Vérifier si l'utilisateur vient de se connecter via "déjà un compte"
    if (isAuthenticated() && sessionStorage.getItem('loginFromCheckout') === 'true') {
        // Supprimer le marqueur pour éviter des transferts multiples
        sessionStorage.removeItem('loginFromCheckout');
        
        console.log("Connexion détectée via 'Déjà un compte', transfert du panier local");
        
        // Afficher un indicateur de chargement
        const loadingToast = showInfo('Transfert de votre panier en cours...', 0); // 0 = ne pas fermer automatiquement
        
        // Exécuter le transfert du panier
        try {
            const result = await transferCartAtCheckout();
            if (result.success) {
                // Supprimer le toast de chargement
                if (loadingToast && loadingToast.parentNode) {
                    loadingToast.parentNode.removeChild(loadingToast);
                }
                
                // Afficher un message de succès
                showSuccess('Panier transféré avec succès!');
                
                // Recharger la page après 1 seconde
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // Supprimer le toast de chargement
                if (loadingToast && loadingToast.parentNode) {
                    loadingToast.parentNode.removeChild(loadingToast);
                }
                
                // Afficher un message d'erreur
                showError('Erreur lors du transfert du panier.');
            }
        } catch (error) {
            console.error("Erreur lors du transfert du panier:", error);
            
            // Supprimer le toast de chargement
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }
            
            // Afficher un message d'erreur
            showError('Erreur lors du transfert du panier.');
        }
    }

    if (isAuthenticated()) {
        loginForm.style.display = 'none';
    } else {
        // Afficher le formulaire de connexion
        loginForm.style.display = 'block';
        
        // Ajouter un écouteur sur le formulaire de connexion UNIQUEMENT dans checkout.js
        if (loginForm) {
            const loginBtn = loginForm.querySelector('button[type="submit"]');
            if (loginBtn) {
                // Remplacer l'écouteur existant par le nôtre
                const originalClick = loginBtn.onclick;
                
                loginBtn.onclick = async (e) => {
                    // Si un gestionnaire d'événements original existe, l'appeler d'abord
                    if (originalClick) {
                        originalClick.call(loginBtn, e);
                    }
                    
                    // Vérifier toutes les 500ms si l'utilisateur s'est connecté
                    const checkLoginInterval = setInterval(() => {
                        if (isAuthenticated()) {
                            clearInterval(checkLoginInterval);
                            console.log("Connexion détectée, transfert du panier local");
                            
                            // Transférer le panier
                            transferCartAtCheckout().then(result => {
                                if (result.success) {
                                    window.location.reload();
                                }
                            });
                        }
                    }, 500);
                    
                    // Arrêter la vérification après 10 secondes quoi qu'il arrive
                    setTimeout(() => clearInterval(checkLoginInterval), 10000);
                };
            }
        }
    }

    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const first_name = document.getElementById('first-name').value;
        const last_name = document.getElementById('last-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        const result = await registerUser(first_name, last_name, email, password, confirmPassword);    
        
        if (result && result.success) {
            console.log("Inscription réussie, transfert du panier local");
            
            // Vérifier si le panier local n'est pas vide
            const localCart = JSON.parse(localStorage.getItem('labelCart') || '[]');
            if (localCart.length > 0) {
                console.log(`Transfert de ${localCart.length} articles du panier local`);
                
                // Transférer les articles du localStorage vers le panier du serveur
                // Augmenter le délai pour donner le temps au transfert
                setTimeout(() => {
                    addCheckOut();
                    
                    setTimeout(() => {
                        localStorage.removeItem('labelCart');
                        showSuccess('Compte créé et panier transféré avec succès!');
                        window.location.reload();
                    }, 2000);
                }, 1000);
            } else {
                showSuccess('Compte créé avec succès!');
                window.location.reload();
            }
        }
    });

    checkoutForm.addEventListener('submit', handleFormSubmit);

    // Charger le panier
    function loadCart() {
        if (isAuthenticated()) {
            fetch('/api/cart', {
                method: 'GET',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            })
            .then(response => response.json())
            .then(data => {
                if (data.cart) {
                    displayCart(data.cart);
                } else {
                    showError('Erreur lors de la récupération du panier.');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showError('Erreur lors de la récupération du panier.');
            });
        } else {
            const savedCart = JSON.parse(localStorage.getItem('labelCart') || '[]');
            displayCart(savedCart);
        }
    }

    // Modifier la fonction displayCart pour afficher le total en haut
    function displayCart(cartData) {
        cartSummary.innerHTML = ''; // Acceptable car on vide simplement le conteneur

        if (cartData.length === 0) {
            emptyCartMessage.style.display = 'block';
            return;
        }

        emptyCartMessage.style.display = 'none';
        let totalPrice = 0;
        
        // Calculer d'abord le prix total
        cartData.forEach((label) => {
            // Déterminer le prix unitaire en fonction du format
            let unitPrice = 44.50; // Prix par défaut au cas où
            
            // Utiliser le product_id pour déterminer le format
            const formatId = parseInt(label.product_id || label.productId);
            
            if (formatId >= 1 && formatId <= 4) {
                unitPrice = productPrices.format60x50Label.amount;
            } else if (formatId >= 5 && formatId <= 8) {
                unitPrice = productPrices.format50x40Label.amount;
            } else if (formatId >= 9 && formatId <= 12) {
                unitPrice = productPrices.format40x30Label.amount;
            } else if (formatId >= 13 && formatId <= 14) {
                unitPrice = productPrices.format50x20Label.amount;
            }
            
            // Calculer le prix total pour cet article (prix unitaire × quantité)
            const quantity = parseInt(label.quantity) || 1;
            const itemPrice = unitPrice * quantity;
            
            // Ajouter au total général
            totalPrice += itemPrice;
        });

        // Créer l'en-tête avec le titre et le prix total d'abord
        const headerElement = document.createElement('div');
        headerElement.className = 'cart-summary-header';
        
        const titleElement = document.createElement('h1');
        titleElement.textContent = 'Résumé du Panier';
        
        const totalTopElement = document.createElement('div');
        totalTopElement.className = 'cart-total-top';
        totalTopElement.textContent = `Total: ${totalPrice.toFixed(2)}€`;
        
        headerElement.appendChild(titleElement);
        headerElement.appendChild(totalTopElement);
        
        // Créer le conteneur pour les éléments du panier
        const cartItemsContainer = document.createElement('div');
        cartItemsContainer.className = 'cart-items-container';
        
        // Ajouter les éléments dans le bon ordre
        cartSummary.appendChild(headerElement);
        cartSummary.appendChild(cartItemsContainer);

        // Afficher chaque élément du panier
        cartData.forEach((label, index) => {
            // Déterminer le prix unitaire en fonction du format
            let unitPrice = 44.50; // Prix par défaut au cas où
            
            // Utiliser le product_id pour déterminer le format (répétition nécessaire)
            const formatId = parseInt(label.product_id || label.productId);
            
            if (formatId >= 1 && formatId <= 4) {
                unitPrice = productPrices.format60x50Label.amount;
            } else if (formatId >= 5 && formatId <= 8) {
                unitPrice = productPrices.format50x40Label.amount;
            } else if (formatId >= 9 && formatId <= 12) {
                unitPrice = productPrices.format40x30Label.amount;
            } else if (formatId >= 13 && formatId <= 14) {
                unitPrice = productPrices.format50x20Label.amount;
            }
            
            // Calculer le prix total pour cet article
            const quantity = parseInt(label.quantity) || 1;
            const itemPrice = unitPrice * quantity;
            
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            // Créer le conteneur de détails de l'article
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'cart-item-details';
            
            // Ajouter le titre de l'étiquette
            const title = document.createElement('h3');
            title.textContent = `Étiquette #${index + 1}`;
            detailsDiv.appendChild(title);
            
            // Ajouter les infos de format
            const formatP = document.createElement('p');
            const formatStrong = document.createElement('strong');
            formatStrong.textContent = 'Format: ';
            formatP.appendChild(formatStrong);
            formatP.appendChild(document.createTextNode(label.format));
            detailsDiv.appendChild(formatP);
            
            // Ajouter les infos de couleur
            const colorP = document.createElement('p');
            const colorStrong = document.createElement('strong');
            colorStrong.textContent = 'Couleur: ';
            colorP.appendChild(colorStrong);
            colorP.appendChild(document.createTextNode(label.color));
            detailsDiv.appendChild(colorP);
            
            // Ajouter les infos de pharmacie
            const pharmacyP = document.createElement('p');
            const pharmacyStrong = document.createElement('strong');
            pharmacyStrong.textContent = 'Pharmacie: ';
            pharmacyP.appendChild(pharmacyStrong);
            pharmacyP.appendChild(document.createTextNode(label.pharmacy_name));
            detailsDiv.appendChild(pharmacyP);
            
            // Ajouter les infos de quantité
            const quantityP = document.createElement('p');
            const quantityStrong = document.createElement('strong');
            quantityStrong.textContent = 'Quantité: ';
            quantityP.appendChild(quantityStrong);
            quantityP.appendChild(document.createTextNode(label.quantity));
            detailsDiv.appendChild(quantityP);
            
            // Ajouter les infos de prix unitaire
            const unitPriceP = document.createElement('p');
            const unitPriceStrong = document.createElement('strong');
            unitPriceStrong.textContent = 'Prix unitaire: ';
            unitPriceP.appendChild(unitPriceStrong);
            unitPriceP.appendChild(document.createTextNode(`${unitPrice.toFixed(2)}€`));
            detailsDiv.appendChild(unitPriceP);
            
            // Ajouter les infos de prix total
            const totalPriceP = document.createElement('p');
            const totalPriceStrong = document.createElement('strong');
            totalPriceStrong.textContent = 'Prix total: ';
            totalPriceP.appendChild(totalPriceStrong);
            totalPriceP.appendChild(document.createTextNode(`${itemPrice.toFixed(2)}€`));
            detailsDiv.appendChild(totalPriceP);
            
            // Ajouter le logo UNIQUEMENT si on n'a pas de prévisualisation
            if (label.logo && !label.preview) {
                const logoContainer = document.createElement('div');
                logoContainer.className = 'logo-container';
                
                const logoImg = document.createElement('img');
                logoImg.className = 'pharmacy-logo';
                logoImg.alt = 'Logo de pharmacie';
                
                if (isAuthenticated()) {
                    logoImg.src = `/uploads/${label.logo}`;
                } else {
                    logoImg.src = label.logo;
                }
                
                logoContainer.appendChild(logoImg);
                detailsDiv.appendChild(logoContainer);
            }
            
            // Ajouter les détails à l'élément cart-item
            itemElement.appendChild(detailsDiv);
            
            // Ajouter la section de prévisualisation centrale
            const previewContainerDiv = document.createElement('div');
            previewContainerDiv.className = 'item-preview-container';
            
            // Ajouter l'image de prévisualisation si disponible
            if (label.preview) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'item-preview';
                
                const previewImg = document.createElement('img');
                previewImg.className = 'preview-thumbnail';
                previewImg.alt = "Aperçu de l'étiquette";
                
                if (isAuthenticated()) {
                    previewImg.src = `/uploads/previews/${label.preview}`;
                } else {
                    previewImg.src = label.preview;
                }
                
                previewDiv.appendChild(previewImg);
                previewContainerDiv.appendChild(previewDiv);
            }
            // Si pas de prévisualisation mais un logo, afficher le logo au centre
            else if (label.logo) {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'item-preview';
                
                const logoImg = document.createElement('img');
                logoImg.className = 'preview-thumbnail';
                logoImg.alt = "Logo de pharmacie";
                
                if (isAuthenticated()) {
                    logoImg.src = `/uploads/${label.logo}`;
                } else {
                    logoImg.src = label.logo;
                }
                
                previewDiv.appendChild(logoImg);
                previewContainerDiv.appendChild(previewDiv);
            }
            
            // Ajouter le conteneur de prévisualisation à l'élément principal
            itemElement.appendChild(previewContainerDiv);
            
            // Ajouter la section des actions
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'item-actions';
            
            // Bouton supprimer
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-item';
            removeBtn.textContent = 'Supprimer';
            removeBtn.dataset.cartId = label.id || '';
            removeBtn.dataset.customizationId = label.customization_id || '';
            removeBtn.dataset.index = index;
            
            actionsDiv.appendChild(removeBtn);
            itemElement.appendChild(actionsDiv);
            
            cartItemsContainer.appendChild(itemElement);
        });

        // Ajouter des gestionnaires d'événements aux boutons "Supprimer"
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cartId = e.target.getAttribute('data-cart-id');
                const customizationId = e.target.getAttribute('data-customization-id');
                const index = e.target.getAttribute('data-index');
                
                removeFromCart(cartId, customizationId, index);
            });
        });
    }

    // Fonction pour supprimer un élément du panier
    function removeFromCart(id, customizationId, index) {
        if (isAuthenticated()) {
            fetch(`/api/cart/${id}/customization/${customizationId}`, {
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showSuccess(data.message);
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
            loadCart();
        }
    }

    // Charger le panier au chargement de la page
    loadCart();

    // Référence au conteneur principal
    const checkoutContainer = document.querySelector('.container.checkout');
    
    // Appliquer la classe guest-mode si l'utilisateur n'est pas connecté
    if (!isAuthenticated()) {
        checkoutContainer.classList.add('guest-mode');
        
        // Ajuster spécifiquement le récapitulatif du panier pour qu'il soit plus visible
        const cartSummarySection = document.querySelector('#cart-summary').closest('.form-section');
        if (cartSummarySection) {
            cartSummarySection.style.minHeight = '600px';  // Hauteur encore plus grande pour le résumé
        }
    } else {
        checkoutContainer.classList.remove('guest-mode');
        // Cacher le formulaire d'inscription/connexion
        loginForm.style.display = 'none';
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();
    if(!isAuthenticated()) {
        showWarning('Vous devez être connecté pour passer une commande.');
        return;
    }

    // Récupérer les données du panier
    let cartData;
    if (isAuthenticated()) {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
            });
            const data = await response.json();
            if (data.cart && data.cart.length > 0) {
                cartData = data.cart;
            } else {
                showInfo('Votre panier est vide.');
                return;
            }
        } catch (error) {
            console.error('Erreur:', error);
            showError('Erreur lors de la récupération du panier.');
            return;
        }
    } else {
        cartData = JSON.parse(localStorage.getItem('labelCart') || '[]');
    }

    if (!cartData || cartData.length === 0) {
        showInfo('Votre panier est vide.');
        return;
    }

    // Ajouter un indicateur de chargement
    const paymentButton = document.getElementById('payment-button');
    const originalText = paymentButton.textContent;
    paymentButton.disabled = true;
    paymentButton.textContent = 'Traitement en cours...';

    try {
        console.log("Envoi du panier au serveur:", cartData);
        const response = await fetch('/api/payment/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ cart: cartData })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur serveur');
        }

        const session = await response.json();
        
        if (session.id) {
            // Stocker l'ID de session pour la vérification à la page de remerciement
            sessionStorage.setItem('validPaymentSession', session.id);
            
            // Récupérer la clé publique du serveur
            const stripeResponse = await fetch('/api/payment/stripe-key');
            const stripeData = await stripeResponse.json();
            
            if (stripeData.publicKey) {
                // Initialiser Stripe avec la clé publique récupérée du serveur
                // L'objet Stripe est disponible globalement via la balise script dans checkout.html
                const stripe = Stripe(stripeData.publicKey);
                
                // Rediriger vers Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
            } else {
                throw new Error('Clé Stripe non disponible');
            }
        } else {
            throw new Error('Pas d\'ID de session retourné');
        }
    } catch (error) {
        showError('Erreur lors de la création de la session de paiement: ' + error.message);
        
        // Réactiver le bouton
        paymentButton.disabled = false;
        paymentButton.textContent = originalText;
    }
}
