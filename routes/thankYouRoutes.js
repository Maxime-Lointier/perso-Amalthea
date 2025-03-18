const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticateToken } = require('../middlewares/auth');

// Middleware pour vérifier que l'accès à thankYou.html est légitime
const validateThankYouAccess = (req, res, next) => {
    // Vérifier si le referer est stripe.com ou votre domaine checkout
    const referer = req.headers.referer || '';
    const validReferers = ['https://checkout.stripe.com/', 'https://votre-domaine.com/checkout'];
    
    const isValidReferer = validReferers.some(validReferer => referer.startsWith(validReferer));
    
    if (!isValidReferer && !req.query.session_id) {
        return res.redirect('/views/html/accueil.html');
    }
    
    next();
};

// Route protégée pour thankYou.html
router.get('/thankYou.html', authenticateToken, validateThankYouAccess, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/html/thankYou.html'));
});

module.exports = router;