const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ajout de cette ligne pour charger les variables d'environnement
const db = require('../config/database'); 
const User = require('../models/user'); // Modèle utilisateur

// Inscription d'un utilisateur
exports.register = (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Vérifier si l'utilisateur existe déjà
    db.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Erreur SQL:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hachage du mot de passe
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Erreur bcrypt:', err);
                return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });
            }

            // Insérer l'utilisateur dans la base de données
            db.query('INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
                [first_name, last_name, email, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error('Erreur SQL:', err);
                        return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
                    }

                    res.status(201).json({ message: 'Utilisateur inscrit avec succès' });
                }
            );
        });
    });
};

// Connexion d'un utilisateur
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    // Vérifier si l'utilisateur existe
    db.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Erreur SQL:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = results[0];

        // Vérifier le mot de passe
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Erreur bcrypt:', err);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

            if (!isMatch) {
                return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
            }

            // Créer le token JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name },
                process.env.JWT_SECRET ,  // Utiliser la même clé que dans les middlewares
                { expiresIn: '2h' }
            );

            res.json({ token });
        });
    });
};


// Modification du mot de passe
exports.changePassword = async (req, res) => {
    try {
      const userId = req.user.id; // Récupérer l'ID de l'utilisateur depuis le token
      const { oldPassword, newPassword } = req.body;
  
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Veuillez fournir l’ancien et le nouveau mot de passe' });
      }
  
      // 1. Récupérer l'utilisateur
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // 2. Vérifier l'ancien mot de passe
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
      }
  
      // 3. Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      // 4. Mettre à jour le mot de passe
      await User.updatePassword(userId, hashedPassword);
  
      res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
      res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
  };

  //mise a jour des informations de l'utilisateur
  exports.updateUserInfo = async (req, res) => {
    try {
        const userId = req.user.id; // Récupérer l'ID de l'utilisateur depuis le token
        const { first_name, last_name, email } = req.body;

        // Vérification des informations envoyées
        if (!first_name && !last_name && !email) {
            return res.status(400).json({ message: 'Veuillez fournir au moins une information à modifier' });
        }

        // Vérifier si l'email est déjà pris (uniquement si l'email est modifié)
        if (email) {
            const userExists = await User.findByEmail(email);
            if (userExists) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            }
        }

        // Mettre à jour les informations de l'utilisateur
        await User.updateUserInfo(userId, first_name, last_name, email);

        res.status(200).json({ message: 'Informations mises à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur interne du serveur', error: error.message });
    }
};
