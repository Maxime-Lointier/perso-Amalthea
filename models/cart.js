// models/cart.js
const db = require('../config/database');

exports.create = (data, callback) => {
    const { userId, productId, customizationId, quantity } = data;
    const query = 'INSERT INTO cart (user_id, product_id, customization_id, quantity) VALUES (?, ?, ?, ?)';
    db.query(query, [userId, productId, customizationId, quantity], callback);
};

exports.getCartByUserId = (userId, callback) => {
    const query = `
        SELECT 
            c.id, 
            user_id, 
            c.product_id, 
            customization_id,
            quantity,
            cu.warning,
            cu.pharmacy_name,
            cu.pharmacy_address,
            cu.pharmacy_postal_code,
            cu.pharmacy_phone,
            cu.detail_1,
            cu.libre,
            cu.position,
            cu.logo,
            cu.preview,
            p.format,
            p.color 
        FROM 
            cart c 
        JOIN 
            customizations cu ON c.customization_id = cu.id 
        JOIN 
            products p ON p.id = c.product_id 
        WHERE 
            user_id = ?
    `;
    db.query(query, [userId], callback);
};

exports.removeFromCart = (userId, productId, callback) => {
    const query = 'DELETE FROM cart WHERE user_id = ? AND product_id = ?';
    db.query(query, [userId, productId], callback);
};

exports.clearCart = (userId, callback) => {
    const query = 'DELETE FROM cart WHERE user_id = ?';
    db.query(query, [userId], callback);
};

exports.delete = (cartId, callback) => {
    const query = 'DELETE FROM cart WHERE id = ?';
    db.query(query, [cartId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de l\'article du panier:', err);
            return callback(err);
        }
        callback(null, result);
    });
};

// Nouvelle fonction pour récupérer le customizationId par cartId
exports.getCustomizationIdByCartId = (cartId, callback) => {
    const query = 'SELECT customization_id FROM cart WHERE id = ?';
    db.query(query, [cartId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération du customizationId:', err);
            return callback(err);
        }
        if (result.length === 0) {
            return callback(new Error('Aucun élément trouvé avec cet ID de panier'));
        }
        callback(null, result[0].customization_id);
    });
};

// Nouvelle méthode pour récupérer les chemins d'images des articles du panier
exports.getCartImagesPathsByUserId = (userId, callback) => {
    const query = `
        SELECT 
            cu.logo,
            cu.preview
        FROM 
            cart c 
        JOIN 
            customizations cu ON c.customization_id = cu.id 
        WHERE 
            c.user_id = ?
    `;
    
    db.query(query, [userId], callback);
};

// Ajouter cette méthode au modèle Cart
exports.getCartImagesByIds = (cartId, customizationId, callback) => {
    const query = `
        SELECT cu.logo, cu.preview 
        FROM cart c
        JOIN customizations cu ON c.customization_id = cu.id
        WHERE c.id = ? AND cu.id = ?
    `;
    
    db.query(query, [cartId, customizationId], callback);
};
