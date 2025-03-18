const nodemailer = require('nodemailer');

// Configuration du transporteur de messagerie
const transporter = nodemailer.createTransport({
    service: 'gmail', // Utilisez le service de messagerie de votre choix
    auth: {
        user: process.env.EMAIL_USER, // Votre adresse email
        pass: process.env.EMAIL_PASS  // Votre mot de passe email
    }
});

// Fonction pour envoyer un email de confirmation
const sendConfirmationEmail = (to, token) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Confirmation de votre compte',
        html: `
            <h1>Confirmation de votre compte</h1>
            <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour confirmer votre compte :</p>
            <a href="http://localhost:3000/api/user/confirm/${token}">Confirmer votre compte</a>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
        } else {
            console.log('Email envoyé:', info.response);
        }
    });
};

module.exports = { sendConfirmationEmail };