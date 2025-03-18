import { labelDimensionSelect, backgroundColorSelect, warningBlockSelect } from './generateur.js';
import { isAuthenticated, getToken } from './auth.js'; // Importer la fonction getToken
import { showSuccess, showError, showWarning, showInfo } from './toast.js'; // Importer les notifications Toast

export function product_id() {
    if (labelDimensionSelect.value == "60x50") {
        if (backgroundColorSelect.value == "blanc") {
            if (warningBlockSelect.value == "") { return 1; }
            else { return 2; }
        }
        else if (backgroundColorSelect.value == "bleu") { return 3; }
        else if (backgroundColorSelect.value == "rouge") { return 4; }
    }
    if (labelDimensionSelect.value == "50x40") {
        if (backgroundColorSelect.value == "blanc") {
            if (warningBlockSelect.value == "") { return 5; }
            else { return 6; }
        }
        else if (backgroundColorSelect.value == "bleu") { return 7; }
        else if (backgroundColorSelect.value == "rouge") { return 8; }
    }
    if (labelDimensionSelect.value == "40x30") {
        if (backgroundColorSelect.value == "blanc") {
            if (warningBlockSelect.value == "") { return 9; }
            else { return 10; }
        }
        else if (backgroundColorSelect.value == "bleu") { return 11; }
        else if (backgroundColorSelect.value == "rouge") { return 12; }
    }
    if (labelDimensionSelect.value == "50x20") {
        if (backgroundColorSelect.value == "blanc") { return 13; }
        else if (backgroundColorSelect.value == "or") { return 14; }
    }
}
export function addCheckOut() {

    const label = JSON.parse(localStorage.getItem('label') || '[]');                
    if (label.format == "60x50") {
        if (label.color == "blanc") {
            if (label.warning == "") { productId = 1; }
            else { productId = 2; }
        }
        else if (label.color == "bleu") { productId = 3; }
        else if (label.color == "rouge") { productId = 4; }
    }
    if (label.format == "50x40") {
        if (label.color == "blanc") {
            if (label.warning == "") { productId = 5; }
            else { productId = 6; }
        }
        else if (label.color == "bleu") { productId = 7; }
        else if (label.color == "rouge") { productId = 8; }
    }
    if (label.format == "40x30") {
        if (label.color == "blanc") {
            if (label.warning == "") { productId = 9; }
            else { productId = 10; }
        }
        else if (label.color == "bleu") { productId = 11; }
        else if (label.color == "rouge") { productId = 12; }
    }
    if (label.format == "50x20") {
        if (label.color == "blanc") { productId = 13; }
        else if (label.color == "or") { productId = 14; }
    }
    label.forEach(element => {
        addCart(element);
    });
}

export async function addCart(label) {
    try {
        const token = getToken();
        
        if (!token) {
            showWarning("Vous n'êtes pas connecté ou votre session a expiré. Veuillez vous reconnecter.");
            setTimeout(() => {
                window.location.href = '/views/html/accueil.html';
            }, 2000); // Attendre 2 secondes pour que l'utilisateur puisse lire le message
            return;
        }
        
        const userId = getUserIdFromToken(token);
        
        // Récupérer le fichier du logo
        const logoInput = document.getElementById('pharmacyLogo');
        const logoFile = logoInput?.files?.[0];
        
        // Utiliser FormData pour permettre l'envoi de fichiers
        const formData = new FormData();
        
        // Préparer les données de personnalisation
        const CustomizationData = {
            product_id: product_id(),
            warning: label.warning || '',
            pharmacy_name: label.pharmacy_name || '',
            pharmacy_address: label.pharmacy_address || '',
            pharmacy_postal_code: label.pharmacy_postal_code || '',
            pharmacy_phone: label.pharmacy_phone || '',
            detail_1: label.detail_1 || '',
            libre: label.champLibre || '',
            position: label.position || 'haut'
        };
        
        // Ajouter le fichier si présent
        if (logoFile) {
            formData.append('pharmacyLogo', logoFile);
        }
        else {
            console.log("Fichier non trouvé");
        }
        
        // Ajouter l'image de prévisualisation
        if (label.preview_image) {
            // Convertir une URL data: en blob sans utiliser fetch
            const base64 = label.preview_image.split(',')[1];
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            formData.append('previewImage', blob, 'preview.png');
        }
        
        // Et faire la même chose pour le logo:
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
        
        // Ajouter les autres données comme chaînes JSON
        formData.append('userId', userId);
        formData.append('productId', product_id());
        formData.append('quantity', label.quantity || '1');
        formData.append('CustomizationData', JSON.stringify(CustomizationData));
        

        try {
            // Afficher un toast d'information pendant le chargement
            const loadingToast = showInfo('Ajout de l\'étiquette au panier...', 0); // Durée 0 = ne disparaît pas automatiquement
            
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                // Ne pas ajouter Content-Type avec FormData, le navigateur le fait
                body: formData
            });
            
            // Supprimer le toast de chargement
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }
            
            if (response.ok) {
                const data = await response.json();
                showSuccess('Étiquette ajoutée au panier!');
            } else {
                const errorText = await response.text();
                console.error('Erreur réponse:', errorText);
                showError('Erreur lors de l\'ajout de l\'étiquette au panier.');
            }
        } catch (fetchError) {
            console.error('Erreur fetch détaillée:', fetchError);
            
            // Vérifier si c'est un problème d'expiration de token
            if (fetchError.message.includes('token') || fetchError.message.includes('Token')) {
                localStorage.removeItem('token');
                showError('Votre session a expiré. Veuillez vous reconnecter.');
                setTimeout(() => {
                    window.location.href = '/views/html/accueil.html';
                }, 2000);
                return;
            }
            
            showError('Erreur de connexion au serveur. Veuillez réessayer.');
        }
    } catch (error) {
        console.error('Exception complète:', error);
        showError('Une erreur inattendue s\'est produite.');
    }
}

function getUserIdFromToken(token) {
    // Décodez le token JWT pour obtenir userId
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
}