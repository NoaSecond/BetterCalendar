const express = require('express');
const axios = require('axios');
const ical = require('node-ical');
const path = require('path');

const app = express();
const port = 3000;

const icsUrl = 'https://edtweb.univ-cotedazur.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=64194&projectId=5&calType=ical&firstDate=2025-08-01&lastDate=2026-08-01';

app.use(express.static('public'));

app.get('/api/calendar', async (req, res) => {
    try {
        console.log('Fetching calendar from:', icsUrl);
        const response = await axios.get(icsUrl, { timeout: 8000 }); // Ajout d'un timeout de 8 secondes
        
        console.log('Calendar data fetched successfully. Parsing...');
        const events = await ical.async.parseICS(response.data);
        console.log('Parsing complete.');
        
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
        
        res.json(formattedEvents);

    } catch (error) {
        // Log plus détaillé pour le débogage sur Vercel
        console.error('Error in /api/calendar function:', error.message);
        if (error.response) {
            console.error('Error details (data):', error.response.data);
            console.error('Error details (status):', error.response.status);
        }
        res.status(500).json({ 
            error: 'Impossible de récupérer les données du calendrier.',
            details: error.message 
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Note : La ligne app.listen n'est pas utilisée par Vercel, mais est utile pour le dev local
if (process.env.VERCEL_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Serveur local lancé sur http://localhost:${port}`);
    });
}

// Exporter l'app pour Vercel
module.exports = app;