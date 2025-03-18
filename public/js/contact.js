import { escapeHTML } from '../utils/securityUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;

        // Basic form validation
        if (!name || !email || !message) {
            alert('Veuillez remplir tous les champs requis');
            return;
        }

        // Version sécurisée avec escapeHTML
        alert('Message envoyé avec succès!\n\n' + 
              `Nom: ${escapeHTML(name)}\n` +
              `Email: ${escapeHTML(email)}\n` +
              `Téléphone: ${escapeHTML(phone || 'Non fourni')}\n` +
              `Message: ${escapeHTML(message)}`);

        // Reset form
        contactForm.reset();
    });
});