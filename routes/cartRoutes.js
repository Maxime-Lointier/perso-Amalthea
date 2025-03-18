// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authenticateToken = require('../middlewares/authMiddleware');

// Route pour ajouter un produit au panier
router.post('/add', authenticateToken, cartController.addToCart);

// Route pour récupérer le panier
router.get('/', authenticateToken, cartController.getCart);

// Route pour supprimer un produit du panier et la personnalisation associée
router.delete('/:id/customization/:customizationId', authenticateToken, cartController.removeFromCart);

// Route pour vider le panier
router.delete('/clear', authenticateToken, cartController.clearCart);

// CORRECTION : Changer le chemin de la route pour qu'il corresponde à l'appel client
router.delete('/delete-images', authenticateToken, cartController.deleteCartImages);

module.exports = router;
