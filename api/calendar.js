const axios = require('axios');
const ical = require('node-ical');

// Exporter directement une fonction asynchrone que Vercel exécutera
module.exports = async (req, res) => {
    const icsUrl = 'https://edtweb.univ-cotedazur.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=64194&projectId=5&calType=ical&firstDate=2025-08-01&lastDate=2026-08-01';

    try {
        console.log('Fetching calendar from:', icsUrl);
        const response = await axios.get(icsUrl, { timeout: 8000 });
        
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
        
        // Envoyer une réponse 200 avec les données JSON
        res.status(200).json(formattedEvents);

    } catch (error) {
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
};