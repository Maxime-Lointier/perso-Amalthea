// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateToken = require('../middlewares/authMiddleware');

router.post('/create-checkout-session', authenticateToken, paymentController.createCheckoutSession);
router.get('/verify-session', authenticateToken, paymentController.verifyPaymentSession);
router.get('/stripe-key', paymentController.getStripePublicKey);

module.exports = router;