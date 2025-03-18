// controllers/cartController.js
const Cart = require('../models/cart');
const Customization = require('../models/customization');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Assurez-vous que le dossier uploads existe
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Vérifier les permissions du dossier
try {
    const stats = fs.statSync(uploadDir);
   
    
    // Tentative d'écriture de test
    const testFile = path.join(uploadDir, 'test_write.txt');
    fs.writeFileSync(testFile, 'test', { flag: 'w' });
    fs.unlinkSync(testFile); // Supprimer le fichier de test
} catch (err) {
    console.error('- Erreur lors de la vérification des permissions:', err);
}

// Configuration de multer simplifiée
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let targetDir;
        
        // Distinguer entre logos et prévisualisations
        if (file.fieldname === 'pharmacyLogo') {
            targetDir = path.join(__dirname, '../public/uploads');
        } else if (file.fieldname === 'previewImage') {
            targetDir = path.join(__dirname, '../public/uploads/previews');
        } else {
            targetDir = path.join(__dirname, '../public/uploads');
        }
        
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        cb(null, targetDir);
    },
    filename: function(req, file, cb) {
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(3).toString('hex');
        const fileExt = path.extname(file.originalname).toLowerCase();
        
        let prefix = '';
        if (file.fieldname === 'previewImage') {
            prefix = 'preview_';
        } else if (file.fieldname === 'pharmacyLogo') {
            prefix = 'logo_';
        }
        
        const newFilename = `${prefix}user${userId}_${timestamp}_${randomString}${fileExt}`;
        cb(null, newFilename);
    }
});

// Définir l'upload avec des options de base
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).fields([
    { name: 'pharmacyLogo', maxCount: 1 },
    { name: 'previewImage', maxCount: 1 }
]);

// Controller pour ajouter au panier
exports.addToCart = (req, res) => {
    console.log("=== Début de traitement addToCart ===");
    console.log("Chemin du dossier uploads:", uploadDir);
    
    // Utiliser multer comme middleware direct
    upload(req, res, function(err) {
        console.log("=== Callback d'upload appelé ===");
        
        if (err) {
            console.error("Erreur d'upload Multer:", err);
            console.error("Type d'erreur:", err.name);
            console.error("Stack trace:", err.stack);
            return res.status(400).json({ message: `Erreur d'upload: ${err.message}` });
        }
        
        console.log('Upload traité - Résultat:');
        let logoFilename = null;
        let previewFilename = null;
        
        if (req.files) {
            if (req.files.pharmacyLogo && req.files.pharmacyLogo[0]) {
                logoFilename = req.files.pharmacyLogo[0].filename;
            }
            
            if (req.files.previewImage && req.files.previewImage[0]) {
                previewFilename = req.files.previewImage[0].filename;
            }
        }
        
        if (req.file) {
            console.log('- Fichier reçu:', req.file.filename);
            console.log('- Chemin du fichier:', req.file.path);
            console.log('- Taille du fichier:', req.file.size, 'octets');
            
            // Vérifier si le fichier existe réellement
            try {
                const fileExists = fs.existsSync(req.file.path);
                console.log('- Fichier présent sur disque:', fileExists);
                
                if (fileExists) {
                    const stats = fs.statSync(req.file.path);
                    console.log('- Taille vérifiée:', stats.size, 'octets');
                }
            } catch (fileErr) {
                console.error('- Erreur lors de la vérification du fichier:', fileErr);
            }
        } else {
            console.log('- Aucun fichier reçu');
        }
        
        console.log('Upload traité avec succès');
        console.log('Fichier reçu:', req.file);
        console.log('Corps de la requête:', req.body);
        
        try {
            // Vérifier que les données nécessaires sont présentes
            const userId = req.body.userId;
            const productId = req.body.productId;
            const quantity = req.body.quantity;
            
            if (!req.body.CustomizationData) {
                console.error('CustomizationData manquant dans la requête');
                return res.status(400).json({ message: 'Données de personnalisation manquantes' });
            }
            
            // Parser les données JSON
            const customizationData = JSON.parse(req.body.CustomizationData);
            
            // Ajouter les noms de fichiers
            if (logoFilename) {
                customizationData.logo = logoFilename;
            }
            
            if (previewFilename) {
                customizationData.preview = previewFilename; // Changé de preview_image à preview
            }

            // Dans cartController.js, dans la fonction addToCart
            if (req.file) {
                if (req.file.fieldname === 'pharmacyLogo') {
                    customizationData.logo = req.file.filename; // Juste le nom du fichier logo
                } else if (req.file.fieldname === 'previewImage') {
                    customizationData.preview = req.file.filename; // Changé de preview_image à preview
                }
            }

            // Si vous utilisez multer.fields() pour gérer plusieurs fichiers :
            if (req.files) {
                if (req.files.pharmacyLogo && req.files.pharmacyLogo[0]) {
                    customizationData.logo = req.files.pharmacyLogo[0].filename;
                }
                
                if (req.files.previewImage && req.files.previewImage[0]) {
                    customizationData.preview = req.files.previewImage[0].filename; // Changé de preview_image à preview
                }
            }
            
            // Ajouter la personnalisation
            Customization.create(customizationData, (err, customizationResult) => {
                if (err) {
                    console.error('Erreur lors de la création de personnalisation:', err);
                    return res.status(500).json({ message: 'Erreur lors de la personnalisation', error: err.message });
                }
                
                console.log('Personnalisation créée avec succès:', customizationResult);
                
                const customizationId = customizationResult.insertId;
                
                // Ajouter au panier
                const cartData = {
                    userId: userId,
                    productId: productId,
                    customizationId: customizationId,
                    quantity: quantity
                };
                
                Cart.create(cartData, (err, cartResult) => {
                    if (err) {
                        console.error('Erreur lors de l\'ajout au panier:', err);
                        return res.status(500).json({ message: 'Erreur lors de l\'ajout au panier', error: err.message });
                    }
                    
                    console.log('Produit ajouté au panier avec succès:', cartResult);
                    res.status(201).json({ 
                        message: 'Produit ajouté au panier avec succès',
                        cartId: cartResult.insertId
                    });
                });
            });
        } catch (error) {
            console.error('Erreur lors du traitement de la requête:', error);
            res.status(500).json({ message: 'Erreur serveur', error: error.message });
        }
    });
};

exports.getCart = (req, res) => {
    const userId = req.user.id; // Récupérer l'id de l'utilisateur depuis le token (authentifié)

    Cart.getCartByUserId(userId, (err, cartItems) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la récupération du panier" });
        }

        // Inclure les personnalisations dans la réponse
        res.status(200).json({ cart: cartItems });
    });
};

// Fonction pour supprimer un article du panier
exports.removeFromCart = (req, res) => {
    const cartId = req.params.id;
    const customizationId = req.params.customizationId;

    // 1. D'abord récupérer les infos sur les images via le modèle Cart
    Cart.getCartImagesByIds(cartId, customizationId, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des informations d\'images:', err);
            return res.status(500).json({ message: 'Erreur lors de la suppression de l\'article du panier' });
        }
        
        // 2. S'il y a des images, les supprimer
        if (results.length > 0) {
            const { logo, preview } = results[0];
            
            // Supprimer le logo s'il existe
            if (logo) {
                const logoPath = path.join(__dirname, '../public/uploads', logo);
                try {
                    if (fs.existsSync(logoPath)) {
                        fs.unlinkSync(logoPath);
                        console.log(`Logo supprimé: ${logoPath}`);
                    }
                } catch (err) {
                    console.error(`Erreur lors de la suppression du logo: ${err}`);
                }
            }
            
            // Supprimer la prévisualisation si elle existe
            if (preview) {
                const previewPath = path.join(__dirname, '../public/uploads/previews', preview);
                try {
                    if (fs.existsSync(previewPath)) {
                        fs.unlinkSync(previewPath);
                        console.log(`Prévisualisation supprimée: ${previewPath}`);
                    } else {
                        // Essayer aussi dans le dossier principal
                        const altPath = path.join(__dirname, '../public/uploads', preview);
                        if (fs.existsSync(altPath)) {
                            fs.unlinkSync(altPath);
                            console.log(`Prévisualisation supprimée (alt): ${altPath}`);
                        }
                    }
                } catch (err) {
                    console.error(`Erreur lors de la suppression de la prévisualisation: ${err}`);
                }
            }
        }
        
        // 3. Ensuite supprimer l'article du panier
        Cart.delete(cartId, (err) => {
            if (err) {
                console.error('Erreur lors de la suppression de l\'article du panier:', err);
                return res.status(500).json({ message: 'Erreur lors de la suppression de l\'article du panier' });
            }

            // 4. Enfin supprimer la personnalisation
            Customization.delete(customizationId, (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression de la personnalisation:', err);
                    return res.status(500).json({ message: 'Erreur lors de la suppression de la personnalisation' });
                }

                res.status(200).json({ message: 'Article supprimé du panier avec succès' });
            });
        });
    });
};

// Fonction pour vider le panier de l'utilisateur
exports.clearCart = (req, res) => {
    const userId = req.user.id;

    // Supprimer tous les articles du panier de cet utilisateur
    Cart.clearCart(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Erreur lors de la suppression des articles du panier" });
        }

        res.status(200).json({ message: "Panier vidé avec succès" });
    });
};

exports.deleteCartImages = (req, res) => {
    const userId = req.user.id;
    
    // Utiliser la méthode du modèle pour récupérer les chemins d'images
    Cart.getCartImagesPathsByUserId(userId, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des chemins d\'images:', err);
            return res.status(500).json({ message: 'Erreur serveur lors de la suppression des images' });
        }
        
        // Liste pour collecter les erreurs éventuelles
        const errors = [];
        
        // Supprimer chaque image physiquement
        results.forEach(item => {
            // Traiter le logo s'il existe
            if (item.logo) {
                const logoPath = path.join(__dirname, '../public/uploads', item.logo);
                
                try {
                    if (fs.existsSync(logoPath)) {
                        fs.unlinkSync(logoPath);
                        console.log(`Logo supprimé: ${logoPath}`);
                    } else {
                        console.log(`Logo non trouvé: ${logoPath}`);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la suppression du logo ${item.logo}:`, error);
                    errors.push(`Logo ${item.logo}: ${error.message}`);
                }
            }
            
            // Traiter la prévisualisation s'il existe
            if (item.preview) {
                // MODIFICATION : Chemin corrigé pour les prévisualisations
                const previewPath = path.join(__dirname, '../public/uploads/previews', item.preview);
                
                try {
                    if (fs.existsSync(previewPath)) {
                        fs.unlinkSync(previewPath);
                        console.log(`Prévisualisation supprimée: ${previewPath}`);
                    } else {
                        // Essayer également dans le dossier uploads principal au cas où
                        const alternativePath = path.join(__dirname, '../public/uploads', item.preview);
                        if (fs.existsSync(alternativePath)) {
                            fs.unlinkSync(alternativePath);
                            console.log(`Prévisualisation supprimée (chemin alternatif): ${alternativePath}`);
                        } else {
                            console.log(`Prévisualisation non trouvée: ${previewPath} ni ${alternativePath}`);
                        }
                    }
                } catch (error) {
                    console.error(`Erreur lors de la suppression de la prévisualisation ${item.preview}:`, error);
                    errors.push(`Prévisualisation ${item.preview}: ${error.message}`);
                }
            }
        });
        
        // Renvoyer le statut de l'opération
        if (errors.length === 0) {
            res.status(200).json({ message: 'Images supprimées avec succès' });
        } else {
            res.status(207).json({ 
                message: 'Certaines images n\'ont pas pu être supprimées',
                errors: errors
            });
        }
    });
};
