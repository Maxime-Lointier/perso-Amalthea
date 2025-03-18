const Order = require('../models/order');

exports.finalizeOrderAfterPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;
        
        // Vérifier que la commande existe et appartient à l'utilisateur
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Commande introuvable' });
        }
        
        if (order.user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Vous n\'êtes pas autorisé à accéder à cette commande' });
        }
        
        // Vérifier que la commande est bien en statut "completed"
        if (order.status !== 'completed') {
            return res.status(400).json({ success: false, error: 'La commande n\'est pas finalisée' });
        }
        
        // Ici, vous pourriez implémenter d'autres actions post-paiement comme :
        // - Envoyer un email de confirmation
        // - Préparer les fichiers pour impression
        // - Mettre à jour l'inventaire
        // - etc.
        
        return res.json({
            success: true,
            message: 'Commande finalisée avec succès',
            order: {
                id: order.id,
                amount: order.total_amount,
                status: order.status,
                date: order.created_at
            }
        });
    } catch (error) {
        console.error('Erreur lors de la finalisation de la commande:', error);
        return res.status(500).json({ success: false, error: 'Erreur lors de la finalisation de la commande' });
    }
};