const express = require('express');
const { google } = require('googleapis');
const path = require('path'); // Importer le module path pour gérer les chemins de fichiers
const router = express.Router();
const { createOrder } = require('../controllers/orderController'); // Importer le contrôleur

router.post('/', createOrder); // Utiliser le contrôleur

module.exports = router;