const db = require('../config/database');

// models/customization.js
exports.create = (data, callback) => {
    // Renommez preview en preview pour correspondre à la colonne dans la base de données
    const { product_id, warning, pharmacy_name, pharmacy_address, pharmacy_postal_code, pharmacy_phone, detail_1, libre, position, logo, preview } = data;
    
    const query = `
        INSERT INTO customizations 
        (product_id, warning, pharmacy_name, pharmacy_address, pharmacy_postal_code, pharmacy_phone, detail_1, libre, position, logo, preview) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [product_id, warning, pharmacy_name, pharmacy_address, pharmacy_postal_code, pharmacy_phone, detail_1, libre, position, logo, preview], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion dans la base de données:', err);
            return callback(err);
        }
        console.log('Insertion réussie dans la base de données:', result);
        callback(null, result);
    });
};

exports.delete = (customizationId, callback) => {
    const query = 'DELETE FROM customizations WHERE id = ?';
    db.query(query, [customizationId], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la personnalisation:', err.message, err);
            return callback(err);
        }
        console.log('Suppression réussie de la personnalisation:', result);
        callback(null, result);
    });
};
