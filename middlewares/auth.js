const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware pour vérifier le token JWT et ajouter l'utilisateur à la requête
function authenticateToken(req, res, next) {
    console.log("--- Vérification d'authentification ---");
    const authHeader = req.header('Authorization');
    console.log("Auth header:", authHeader);
    
    const token = authHeader?.split(' ')[1];
    console.log("Token extrait:", token ? token.substring(0, 15) + '...' : 'null');
    
    if (!token) {
        console.log("Token manquant");
        return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }

    jwt.verify(token, process.env.JWT_SECRET  , (err, user) => {
        if (err) {
            console.log("Erreur JWT:", err.name, err.message);
            
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Session expirée, veuillez vous reconnecter', 
                    expired: true 
                });
            } else if (err.name === 'JsonWebTokenError') {
                console.log("Détail de l'erreur:", err);
                return res.status(401).json({ message: 'Token invalide', error: err.message });
            } else {
                return res.status(401).json({ message: 'Erreur d\'authentification', error: err.message });
            }
        }
        
        console.log("Token valide pour l'utilisateur:", user.id);
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
