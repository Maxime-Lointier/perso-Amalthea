const db = require('../config/database');

exports.getAllProducts = (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Erreur serveur" });
        }

        res.status(200).json({ products: results });
    });
};

exports.getProductPrices = (req, res) => {
    const productPrices = require('../config/productPrices');
    res.json(productPrices);
};
