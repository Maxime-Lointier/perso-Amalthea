import { registerUser } from './api.js';
document.getElementById('register-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const first_name = document.getElementById('first-name').value;
    const last_name = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    registerUser(first_name, last_name, email, password, confirmPassword);
    window.location.reload();
});