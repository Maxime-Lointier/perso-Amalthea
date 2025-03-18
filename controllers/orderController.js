const User = require('../models/user'); // Assurez-vous d'importer correctement le modèle User
const { google } = require('googleapis');
const path = require('path');

exports.createOrder = async (req, res) => {
    try {
        console.log(req.body); // Log du corps de la requête pour débogage
        const { items } = req.body; // Les articles du panier

        // Vérifier que items est défini et est un tableau
        console.log('items:', items);   

        // Utiliser la date actuelle comme date d'achat
        const purchaseDate = new Date();
        const userId = items[0].user_id;
        const email = await User.findEmailById(userId);

        // Vérifier que items est bien un tableau
        if (!Array.isArray(items)) {
            console.error('Erreur: les items ne sont pas au format tableau');
            throw new Error('Format de données invalide');
        }

        // Vérifier que le tableau contient des objets valides
        for (const item of items) {
            if (typeof item !== 'object' || item === null) {
                console.error('Erreur: un élément du tableau n\'est pas un objet valide');
                throw new Error('Format de données invalide');
            }
            
            // Vérifier les propriétés obligatoires
            const requiredProperties = [
                'pharmacy_name', 'pharmacy_address', 'pharmacy_postal_code',
                'pharmacy_phone', 'format', 'color', 'quantity'
            ];
            
            for (const prop of requiredProperties) {
                if (!(prop in item)) {
                    console.error(`Erreur: propriété manquante '${prop}' dans un item`);
                    throw new Error(`Propriété manquante: ${prop}`);
                }
            }
        }

        // Formater les données pour Google Sheets après validation
        console.log('Articles à envoyer à Google Sheets:', items);
        const values = items.map(item => [
            email,
            purchaseDate, // Ajouter la date d'achat
            item.format,
            item.color,
            item.warning,
            item.pharmacy_name,
            item.pharmacy_address,
            item.pharmacy_postal_code,
            item.pharmacy_phone,
            item.detail_1,
            item.libre,
            item.position,
            item.quantity,
            item.price
        ]);

        // Envoyer les données à Google Sheets
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../config/amalthea-450508-8c91f9e937f8.json'), // Chemin vers le fichier de clé JSON
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1EPtVPLUWk_384fslaq7teVxcCG9bmw_go_Wq62h0QLQ'; // Remplacez par l'ID de votre feuille de calcul
        const range = "A2"; // Utilisez des guillemets simples autour du nom de la feuille

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            resource: {
                values: values
            }
        });

        console.log('Réponse de Google Sheets:', response.data); // Log de la réponse de Google Sheets
        res.status(200).json({ message: 'Données envoyées avec succès à Google Sheets' });
    } catch (error) {
        console.error('Erreur lors de l\'envoi des données à Google Sheets:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi des données à Google Sheets', error: error.message });
    }
};