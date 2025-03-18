const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth'); 


// Route pour l'inscription
router.post('/register', userController.register);

// Route pour la connexion
router.post('/login', userController.login);

// Route pour le profil
router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: "Voici votre profil", user: req.user });
});

router.get('/verify-token', authMiddleware, (req, res) => {
    res.json({ valid: true });
});

// Route pour la modification du password
router.put('/change-password', authMiddleware, userController.changePassword);

router.post('/update-info', authMiddleware, userController.updateUserInfo);
module.exports = router;

