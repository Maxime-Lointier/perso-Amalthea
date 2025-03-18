const db = require('../config/database');

const Order = {
    create: function(orderData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO orders 
                (user_id, total_amount, status, payment_intent_id, payment_method)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const values = [
                orderData.userId,
                orderData.amount,
                orderData.status || 'pending',
                orderData.stripeSessionId || null,
                'stripe'
            ];
            
            db.query(query, values, (err, result) => {
                if (err) {
                    console.error('Erreur lors de la création de la commande:', err);
                    return reject(err);
                }
                
                // Récupérer l'ID de la commande créée
                const orderId = result.insertId;
                resolve(orderId);
            });
        });
    },
    
    findById: function(orderId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM orders WHERE id = ?';
            db.query(query, [orderId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    },
    
    updateStatus: function(orderId, status) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE orders SET status = ? WHERE id = ?';
            db.query(query, [status, orderId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    },
    
    findByStripeSessionId: function(sessionId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM orders WHERE payment_intent_id = ?';
            db.query(query, [sessionId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    },

    // SÉCURITÉ : Ajouter une validation supplémentaire
    validateOrderOwnership: function(orderId, userId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM orders WHERE id = ? AND user_id = ?';
            db.query(query, [orderId, userId], (err, results) => {
                if (err) return reject(err);
                if (results.length === 0) return resolve(false);
                resolve(true);
            });
        });
    },
    
    // SÉCURITÉ : Méthode pour vérifier si un paiement a déjà été traité
    checkIfPaymentProcessed: function(sessionId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM orders WHERE payment_intent_id = ?';
            db.query(query, [sessionId], (err, results) => {
                if (err) return reject(err);
                resolve(results.length > 0);
            });
        });
    }
};

module.exports = Order;