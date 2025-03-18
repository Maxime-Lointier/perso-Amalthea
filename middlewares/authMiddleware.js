const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization'); // On récupère le header Authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Accès refusé. Token manquant ou mal formé." });
    }

    const token = authHeader.split(' ')[1]; // On extrait le token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET  ); // Vérifie et décode le token
        req.user = decoded; // Ajoute les infos de l'utilisateur dans `req.user`
        next(); // Passe à la suite
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Spécifiquement pour les tokens expirés
            return res.status(401).json({ 
                message: "Session expirée, veuillez vous reconnecter.", 
                expired: true 
            });
        }
        return res.status(401).json({ message: "Token invalide." });
    }
};
