const express = require('express');
const path = require('path');
const calendarHandler = require('./api/calendar');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le dossier public
app.use(express.static('public'));

// Route pour l'API du calendrier
app.get('/api/calendar', calendarHandler);

// Route pour la page d'accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📅 Calendrier disponible sur http://localhost:${PORT}`);
});

module.exports = app;
