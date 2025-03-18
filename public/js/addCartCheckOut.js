import { getToken } from './auth.js'; // Importer la fonction getToken

export function addCheckOut() {
    // Récupérer le panier local
    const labels = JSON.parse(localStorage.getItem('labelCart') || '[]');  
    console.log("Panier local trouvé:", labels);
    
    if (labels.length === 0) {
        console.log("Panier local vide, rien à transférer");
        return;
    }

    // Pour chaque article dans le panier
    labels.forEach(label => {
        let productId = 0;
        
        // Déterminer l'ID du produit en fonction du format et de la couleur
        if (label.format === "60x50") {
            if (label.color === "blanc") {
                productId = (label.warning && label.warning !== "") ? 2 : 1;
            } else if (label.color === "bleu") {
                productId = 3;
            } else if (label.color === "rouge") {
                productId = 4;
            }
        } else if (label.format === "50x40") {
            if (label.color === "blanc") {
                productId = (label.warning && label.warning !== "") ? 6 : 5;
            } else if (label.color === "bleu") {
                productId = 7;
            } else if (label.color === "rouge") {
                productId = 8;
            }
        } else if (label.format === "40x30") {
            if (label.color === "blanc") {
                productId = (label.warning && label.warning !== "") ? 10 : 9;
            } else if (label.color === "bleu") {
                productId = 11;
            } else if (label.color === "rouge") {
                productId = 12;
            }
        } else if (label.format === "50x20") {
            if (label.color === "blanc") {
                productId = 13;
            } else if (label.color === "or") {
                productId = 14;
            }
        }
        
        console.log(`Ajout de l'article au panier - Format: ${label.format}, Couleur: ${label.color}, ID: ${productId}`);
        
        // S'assurer que productId est bien défini
        if (productId > 0) {
            // CORRECTION ICI : utiliser addCartCheckOut au lieu de addCart
            addCartCheckOut(label, productId);
        } else {
            console.error("Impossible de déterminer le productId pour:", label);
        }
    });
}

// Modifier la fonction qui gère les images
export async function addCartCheckOut(label, productId) {
    try {
        const token = getToken();
        const userId = getUserIdFromToken(token);
        
        // Préparer les données du formulaire
        const formData = new FormData();
        
        // Gérer le logo (si disponible en base64)
        if (label.logo && typeof label.logo === 'string' && label.logo.startsWith('data:')) {
            const base64 = label.logo.split(',')[1];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            formData.append('pharmacyLogo', blob, 'logo.png');
        }
        
        // Gérer l'image de prévisualisation (si disponible en base64)
        if (label.preview && typeof label.preview === 'string' && label.preview.startsWith('data:')) {
            const base64 = label.preview.split(',')[1];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            formData.append('previewImage', blob, 'preview.png');
        }
        
        // Ajouter les autres données
        formData.append('userId', userId);
        formData.append('productId', productId);
        formData.append('quantity', label.quantity);
        
        // Préparer les données de personnalisation
        const CustomizationData = {
            product_id: productId,
            warning: label.warning,
            pharmacy_name: label.pharmacy_name,
            pharmacy_address: label.pharmacy_address,
            pharmacy_postal_code: label.pharmacy_postal_code, 
            pharmacy_phone: label.pharmacy_phone,
            detail_1: label.detail_1,
            libre: label.libre,
            position: label.position
        };
        
        formData.append('CustomizationData', JSON.stringify(CustomizationData));
        
        // Envoyer la requête
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });
        
        if (response.ok) {
            console.log('Étiquette ajoutée au panier avec prévisualisation:', label);
        } else {
            console.error('Erreur lors de l\'ajout au panier:', response.statusText);
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'étiquette au panier:', error);
    }
}

function getUserIdFromToken(token) {
    // Décodez le token JWT pour obtenir userId
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
}

// Ajouter cette fonction pour le transfert au checkout
export function transferCartAtCheckout() {
    return new Promise(async (resolve, reject) => {
        try {
            // Vérifier s'il y a des articles dans le localStorage
            const savedCart = JSON.parse(localStorage.getItem('labelCart') || '[]');
            if (savedCart.length === 0) {
                console.log("Panier local vide, rien à transférer");
                return resolve({ success: true, message: "Panier vide" });
            }

            console.log(`Transfert de ${savedCart.length} articles du localStorage vers le serveur`);
            
            // Appeler addCheckOut pour transférer le panier
            addCheckOut();
            
            // Attendre que tous les articles soient transférés
            setTimeout(() => {
                localStorage.removeItem('labelCart');
                console.log("Panier local transféré et vidé avec succès");
                resolve({ success: true, message: "Panier transféré avec succès" });
            }, 2000);
        } catch (error) {
            console.error("Erreur lors du transfert du panier:", error);
            reject(error);
        }
    });
}