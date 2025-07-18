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
        const response = await axios.get(icsUrl);
        const events = await ical.async.parseICS(response.data);
        
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
        console.error("Erreur lors de la récupération du calendrier:", error.message);
        res.status(500).json({ error: 'Impossible de récupérer les données du calendrier.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Serveur lancé sur http://localhost:${port}`);
});