const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  create: async (name, email, password, callback) => {
    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion dans la base de données
    db.query(
      'INSERT INTO user (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // Trouver un utilisateur par son ID
  findById: (userId) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM user WHERE id = ?', [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]); // Retourne le premier utilisateur trouvé
      });
    });
  },

  // Trouver l'email d'un utilisateur par son ID
  findEmailById: (userId) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT email FROM user WHERE id = ?', [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].email); // Retourne l'email de l'utilisateur trouvé
      });
    });
  },

  // Mettre à jour le mot de passe
  updatePassword: (userId, newPassword) => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE user SET password = ? WHERE id = ?', [newPassword, userId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Mettre à jour les informations utilisateur
  updateUserInfo: (userId, firstName, lastName, email) => {
    return new Promise((resolve, reject) => {
      const updates = [];
      const values = [];

      // On prépare les champs à mettre à jour
      if (firstName) {
        updates.push('first_name = ?');
        values.push(firstName);
      }

      if (lastName) {
        updates.push('last_name = ?');
        values.push(lastName);
      }

      if (email) {
        updates.push('email = ?');
        values.push(email);
      }

      // On ajoute l'ID de l'utilisateur
      values.push(userId);

      const query = `UPDATE user SET ${updates.join(', ')} WHERE id = ?`;

      db.query(query, values, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  },

  // Trouver un utilisateur par email
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]); // Retourne l'utilisateur trouvé, ou undefined si aucun
      });
    });
  }
};

module.exports = User;
