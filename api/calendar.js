const axios = require('axios');
const ical = require('node-ical');

// Exporter directement une fonction asynchrone que Vercel exécutera
module.exports = async (req, res) => {
    // Calculer les dates dynamiquement
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Premier jour du mois précédent
    const endDate = new Date(now.getFullYear() + 1, now.getMonth(), 1); // Premier jour du même mois l'année prochaine
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const icsUrl = `https://edtweb.univ-cotedazur.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=64194&projectId=5&calType=ical&firstDate=${formatDate(startDate)}&lastDate=${formatDate(endDate)}`;

    try {
        console.log('📅 === RÉCUPÉRATION DU CALENDRIER EXTERNE ===');
        console.log('🔗 URL cible:', icsUrl);
        console.log('📊 Plage de dates:', formatDate(startDate), '→', formatDate(endDate));
        
        const response = await axios.get(icsUrl, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log('✅ Données récupérées avec succès');
        console.log('📏 Taille de la réponse:', response.data.length, 'caractères');
        console.log('📡 Status HTTP:', response.status);
        
        if (!response.data || response.data.length === 0) {
            throw new Error('Réponse vide du serveur de calendrier');
        }
        
        console.log('⚙️ Analyse des données iCal...');
        const events = await ical.async.parseICS(response.data);
        console.log('📊 Événements trouvés:', Object.keys(events).length);
        
        const formattedEvents = Object.values(events)
            .filter(event => event.type === 'VEVENT')
            .map(event => ({
                uid: event.uid,
                summary: event.summary,
                start: event.start,
                end: event.end,
                location: event.location,
                description: event.description,
            }));
        
        console.log('✅ Événements formatés:', formattedEvents.length);
        console.log('🎯 Envoi de la réponse au client...');
        
        // Envoyer une réponse 200 avec les données JSON
        res.status(200).json(formattedEvents);

    } catch (error) {
        console.error('💥 === ERREUR DANS L\'API CALENDRIER ===');
        console.error('❌ Message d\'erreur:', error.message);
        console.error('📋 Stack trace:', error.stack);
        
        let errorMessage = 'Impossible de récupérer les données du calendrier.';
        let statusCode = 500;
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('🔌 Problème de connexion réseau');
            errorMessage = 'Serveur de calendrier inaccessible.';
            statusCode = 503;
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️ Timeout de connexion');
            errorMessage = 'Timeout lors de la récupération du calendrier.';
            statusCode = 504;
        } else if (error.response) {
            console.error('📡 Erreur de réponse HTTP:', error.response.status);
            console.error('📄 Données de réponse:', error.response.data);
            errorMessage = `Erreur du serveur de calendrier (${error.response.status})`;
            statusCode = error.response.status;
        } else {
            console.error('❓ Erreur inconnue');
        }
        
        console.error('📤 Envoi de l\'erreur au client avec status', statusCode);
        res.status(statusCode).json({ 
            error: errorMessage,
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};