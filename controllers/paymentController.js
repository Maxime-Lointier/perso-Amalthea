// controllers/paymentController.js
const stripe = require('../config/stripe');

const Order = require('../models/order');

// Remplacer les prix codés en dur par l'importation du fichier de config
const productPrices = require('../config/productPrices');

exports.createCheckoutSession = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Validation améliorée du panier
        if (!req.body.cart) {
            return res.status(400).json({ error: 'Votre panier est manquant' });
        }
        
        // Vérifier que cart est bien un tableau
        if (!Array.isArray(req.body.cart)) {
            return res.status(400).json({ error: 'Format de panier invalide' });
        }
        
        // Vérifier que le panier n'est pas vide
        if (req.body.cart.length === 0) {
            return res.status(400).json({ error: 'Votre panier est vide' });
        }

        // Vérifier que chaque élément du panier contient les champs requis
        for (const item of req.body.cart) {
            // Vérifier que l'item est un objet
            if (typeof item !== 'object' || item === null) {
                return res.status(400).json({ error: 'Format d\'article invalide dans le panier' });
            }
            
            // Vérifier les champs requis
            const requiredFields = ['product_id', 'quantity'];
            for (const field of requiredFields) {
                if (!(field in item)) {
                    return res.status(400).json({ error: `Champ requis manquant dans un article: ${field}` });
                }
            }
            
            // Valider le type et la valeur des champs importants
            if (!Number.isInteger(parseInt(item.product_id)) || parseInt(item.product_id) <= 0) {
                return res.status(400).json({ error: 'ID de produit invalide' });
            }
            
            if (!Number.isInteger(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
                return res.status(400).json({ error: 'Quantité invalide' });
            }
        }

        const cartItems = req.body.cart;

        // Création des éléments de ligne pour Stripe
        const lineItems = cartItems.map(item => {
            // Déterminer la clé de prix en fonction du format
            let priceKey;
            
            const formatId = parseInt(item.product_id || item.productId);
            
            switch (formatId) {
                case 1: case 2: case 3: case 4:
                    priceKey = 'format60x50Label';
                    break;
                case 5: case 6: case 7: case 8:
                    priceKey = 'format50x40Label';
                    break;
                case 9: case 10: case 11: case 12:
                    priceKey = 'format40x30Label';
                    break;
                case 13: case 14:
                    priceKey = 'format50x20Label';
                    break;
                default:
                    priceKey = 'format60x50Label'; // Prix par défaut
                    break;
            }
            
            // Console.log pour le débogage
            console.log(`Format ID: ${formatId}, Prix utilisé: ${productPrices[priceKey].amount_cents / 100}€, Clé: ${priceKey}`);
            
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Étiquette pour ${item.pharmacy_name || 'pharmacie'}`,
                        description: `Format: ${item.format || 'Standard'}, Couleur: ${item.color || 'Standard'}`
                    },
                    unit_amount: productPrices[priceKey].amount_cents,
                },
                quantity: parseInt(item.quantity) || 1,
            };
        });

        // Le reste du code reste inchangé...
        
        if (!lineItems.length) {
            return res.status(400).json({ error: 'Impossible de créer des articles pour le paiement' });
        }

        // Ajouter des logs pour le débogage
        console.log("Création de session Stripe avec les articles:", JSON.stringify(lineItems));

        // Créer la session de paiement Stripe
        const stripe = require('../config/stripe');
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.DOMAIN || 'http://localhost:3000'}/views/html/thankYou.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.DOMAIN || 'http://localhost:3000'}/views/html/checkout.html`,
            client_reference_id: userId.toString(),
            metadata: {
                user_id: userId.toString()
            }
        });

        // VÉRIFICATION: S'assurer que session.id existe
        if (!session || !session.id) {
            console.error("Session Stripe créée sans ID:", session);
            return res.status(500).json({ error: 'Erreur lors de la création de la session: pas d\'ID généré' });
        }

        console.log("Session Stripe créée avec succès, ID:", session.id);

        // Stocker la session dans la base de données
        try {
            await db.query(
                'INSERT INTO payment_sessions (session_id, user_id) VALUES (?, ?)',
                [session.id, req.user.id]
            );
        } catch (dbError) {
            console.error("Erreur lors de l'enregistrement en base de données:", dbError);
            // On continue même si l'enregistrement échoue
        }

        // Stocker l'ID de session dans sessionStorage côté client
        res.json({
            id: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Erreur détaillée lors de la création de la session:', error);
        res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
    }
};

exports.verifyPaymentSession = async (req, res) => {
    try {
        const { session_id } = req.query;
        
        if (!session_id) {
            return res.status(400).json({ success: false, error: 'ID de session manquant' });
        }

        const userId = req.user.id;
        
        // Récupérer les détails de la session depuis Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        // SÉCURITÉ : Vérifier que la session appartient bien à cet utilisateur
        if (session.client_reference_id !== userId.toString()) {
            return res.status(403).json({ success: false, error: 'Session non autorisée' });
        }
        
        // SÉCURITÉ : Vérifier que le paiement a bien été effectué
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ success: false, error: 'Paiement non complété' });
        }
        
        try {
            // SÉCURITÉ : Créer la commande dans la base de données
            // pour avoir un lien entre le paiement Stripe et la commande
            const orderData = {
                userId,
                amount: session.amount_total / 100,
                status: 'completed',
                stripeSessionId: session_id
            };
            
            const orderId = await Order.create(orderData);
            
            return res.json({ 
                success: true, 
                orderId: orderId,
                message: 'Paiement vérifié avec succès'
            });
        } catch (orderError) {
            console.error('Erreur lors de la création de la commande:', orderError);
            return res.status(500).json({ success: false, error: 'Erreur lors de la finalisation de la commande' });
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
        return res.status(500).json({ success: false, error: 'Erreur lors de la vérification de la session' });
    }
};

// Fonction de vérification de la session de paiement
exports.verifySession = async (req, res) => {
    const sessionId = req.query.session_id;
    const userId = req.user.id; // Obtenu à partir du middleware d'authentification
    
    try {
        // 1. Vérifier que cette session existe et appartient à cet utilisateur
        const sessionRecord = await db.query(
            'SELECT * FROM payment_sessions WHERE session_id = ? AND user_id = ?', 
            [sessionId, userId]
        );
        
        if (!sessionRecord || sessionRecord.length === 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'Session de paiement non valide pour cet utilisateur' 
            });
        }
        
        // 2. Vérifier auprès de Stripe que le paiement a été complété
        const stripe = require('../config/stripe');
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status !== 'paid') {
            return res.status(400).json({ 
                success: false, 
                error: 'Le paiement n\'a pas été effectué' 
            });
        }
        
        // 3. Vérifier si cette session a déjà été utilisée pour créer une commande
        const existingOrder = await db.query(
            'SELECT * FROM orders WHERE stripe_session_id = ?', 
            [sessionId]
        );
        
        if (existingOrder && existingOrder.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Cette commande a déjà été traitée'
            });
        }
        
        // 4. Créer la commande et renvoyer l'orderId
        const orderId = await createOrder(userId, sessionId);
        
        return res.status(200).json({
            success: true,
            orderId: orderId
        });
    } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la vérification du paiement'
        });
    }
};

// Fonction helper pour créer la commande
async function createOrder(userId, sessionId) {
    // Implémentation de la création de commande
    // ...
}

exports.getStripePublicKey = (req, res) => {
    res.json({ publicKey: process.env.STRIPE_TEST_PUBLIC_KEY });
};