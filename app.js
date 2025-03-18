const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const authenticateToken = require('./middlewares/auth'); // Importer le middleware d'authentification
const userRoutes = require('./routes/userRoutes'); 
const productRoutes = require('./routes/productsRoutes');
const cartRoutes = require('./routes/cartRoutes');  
const googleSheetsRouter = require('./routes/googleSheets'); // Importer la route googleSheets
const paymentRoutes = require('./routes/paymentRoutes'); // Importer la route paymentRoutes
const path = require('path');
const rateLimit = require('express-rate-limit'); // Importer express-rate-limit
const http = require('http'); // Importer le module http pour configurer le timeout des requêtes
const helmet = require('helmet'); // Importer helmet
const PORT = 3000;

// Utiliser Helmet avant les autres middlewares
app.use(helmet());

// Appliquer le middleware CSP à toutes les routes

// Configurer le middleware de rate-limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // limite chaque IP à 1000 requêtes par fenêtre, plus raisonable, et encore a voir
    standardHeaders: true, // Retourne les infos de limite dans les headers `RateLimit-*`
    legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes'
});

// Appliquer le rate-limiting à toutes les requêtes
//app.use(globalLimiter);

// Middleware pour gérer les JSON envoyés par le client
app.use(bodyParser.json({ limit: '1mb' })); // Limiter la taille des requêtes JSON à 1MB
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' })); // Limiter la taille des requêtes URL-encoded à 1MB

// Middleware pour éviter les problèmes de CORS 
app.use(cors());

// Ajouter après les autres middleware et avant les routes
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://html2canvas.hertzen.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Si vous avez des styles inline
      imgSrc: ["'self'", "data:", "blob:"], // Nécessaire pour que html2canvas fonctionne correctement
      connectSrc: ["'self'", "data:", "blob:", "https://api.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://checkout.stripe.com", "https://hooks.stripe.com", "https://js.stripe.com"],
    },
  })
);

// Configuration de limiteurs spécifiques pour les routes sensibles
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limite chaque IP à 50 requêtes par fenêtre pour les API
    message: 'Trop de requêtes API depuis cette IP, veuillez réessayer après 5 minutes'
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // limite chaque IP à 10 tentatives de connexion par heure
    message: 'Trop de tentatives de connexion depuis cette IP, veuillez réessayer après une heure'
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 20, // limite chaque IP à 20 uploads par heure
    message: 'Limite d\'upload atteinte, veuillez réessayer après une heure'
});

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'views/html')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/views/html', express.static(path.join(__dirname, 'views/html')));

// Appliquer le rate-limiting spécifique pour les uploads
app.use('/uploads', uploadLimiter, express.static('uploads'));
app.use('/uploads', uploadLimiter, express.static(path.join(__dirname, 'public/uploads')));
app.use('/utils', express.static(path.join(__dirname, 'utils')));

// Routes avec rate-limiting spécifique
//app.use('/api/user/login', authLimiter); // Limiter les tentatives de connexion
app.use('/api/user/register', authLimiter); // Limiter les inscriptions
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/cart', apiLimiter, authenticateToken, cartRoutes);
app.use('/api/googleSheets', apiLimiter, googleSheetsRouter);
app.use('/api/payment', apiLimiter, paymentRoutes);

// Serve the accueil.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/html/accueil.html'));
});

// Gestion d'erreur pour les routes non trouvées
app.use((req, res) => {
    res.status(404).json({ message: "Route non trouvée" });
});

// Créer le serveur avec Express
const server = http.createServer(app);

// Configurer le timeout des requêtes
server.timeout = 10000; // 10 secondes

// Utiliser le serveur à la place de app.listen
server.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});



