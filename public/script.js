document.addEventListener('DOMContentLoaded', () => {
    // --- Éléments du DOM ---
    const calendarContainer = document.getElementById('calendar-container');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const todayBtn = document.getElementById('today-btn'); // NOUVEAU
    const currentWeekInfo = document.getElementById('current-week-info');
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');

    // --- Éléments de la modale (NOUVEAU) ---
    const eventModal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalTime = document.getElementById('modal-time');
    const modalLocation = document.getElementById('modal-location');
    const modalDescription = document.getElementById('modal-description');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- État de l'application ---
    let allEvents = [];
    let currentDate = new Date();
    let currentView = window.innerWidth <= 768 ? 'list' : 'week';

    // --- Fonctions utilitaires ---
    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const getCourseType = (summary) => {
        const lowerSummary = summary.toLowerCase();
        if (lowerSummary.includes('cm')) return 'cm';
        if (lowerSummary.includes('td')) return 'td';
        if (lowerSummary.includes('tp')) return 'tp';
        if (lowerSummary.includes('projet')) return 'projet';
        return 'autre';
    };

    const formatTime = (date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // --- Logique du calendrier ---
    const fetchAndRenderCalendar = async () => {
        try {
            const response = await fetch('/api/calendar');
            if (!response.ok) throw new Error('La réponse du serveur n\'est pas OK');
            const data = await response.json();
            allEvents = data.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) }))
                .sort((a, b) => a.start - b.start);
            renderCalendar();
        } catch (error) {
            calendarContainer.innerHTML = `<p class="no-class-message">Impossible de charger le calendrier. Vérifiez votre connexion ou le serveur.</p>`;
            console.error(error);
        }
    };

    const renderCalendar = () => {
        calendarContainer.innerHTML = '';
        const firstDayOfWeek = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

        const weekNum = getWeekNumber(currentDate);
        const options = { month: 'long', day: 'numeric' };
        currentWeekInfo.textContent = `Semaine ${weekNum} (${firstDayOfWeek.toLocaleDateString('fr-FR', options)} - ${lastDayOfWeek.toLocaleDateString('fr-FR', options)})`;

        const eventsThisWeek = allEvents.filter(event => {
            const eventDate = event.start;
            return eventDate >= firstDayOfWeek && eventDate <= new Date(lastDayOfWeek.getTime() + 86400000 - 1);
        });

        if (eventsThisWeek.length === 0) {
            calendarContainer.innerHTML = `<p class="no-class-message">Pas de cours cette semaine. Profitez-en ! 🎉</p>`;
            return;
        }

        if (currentView === 'week') {
            renderWeekView(eventsThisWeek, firstDayOfWeek);
        } else {
            renderListView(eventsThisWeek);
        }
    };

    const renderWeekView = (events, firstDayOfWeek) => {
        const weekViewContainer = document.createElement('div');
        weekViewContainer.id = 'week-view';
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        for (let i = 0; i < 7; i++) {
            const dayContainer = document.createElement('div');
            dayContainer.className = 'day-column';
            const currentDateInLoop = new Date(firstDayOfWeek);
            currentDateInLoop.setDate(firstDayOfWeek.getDate() + i);
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = `${days[i]} ${currentDateInLoop.getDate()}`;
            dayContainer.appendChild(dayHeader);
            const eventsForDay = events.filter(e => e.start.getDay() === (i + 1) % 7);
            eventsForDay.forEach(event => {
                dayContainer.appendChild(createEventCard(event));
            });
            weekViewContainer.appendChild(dayContainer);
        }
        calendarContainer.appendChild(weekViewContainer);
    };

    const renderListView = (events) => {
        const listViewContainer = document.createElement('div');
        listViewContainer.id = 'list-view';
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        let lastDay = -1;
        events.forEach(event => {
            const eventDay = event.start.getDay();
            if (eventDay !== lastDay) {
                const dayHeader = document.createElement('h3');
                dayHeader.textContent = `${days[eventDay]} ${event.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
                listViewContainer.appendChild(dayHeader);
                lastDay = eventDay;
            }
            listViewContainer.appendChild(createEventCard(event));
        });
        calendarContainer.appendChild(listViewContainer);
    };

    const createEventCard = (event) => {
        const card = document.createElement('div');
        const courseType = getCourseType(event.summary);
        card.className = `event-card course-${courseType}`;

        const title = document.createElement('h3');
        title.textContent = event.summary;

        const time = document.createElement('p');
        time.textContent = `⏰ ${formatTime(event.start)} - ${formatTime(event.end)}`;

        const location = document.createElement('p');
        location.textContent = `📍 ${event.location || 'Non spécifié'}`;

        card.append(title, time, location);

        // NOUVEAU : Ajout de l'écouteur de clic pour ouvrir la modale
        card.addEventListener('click', () => openModal(event));

        return card;
    };

    // NOUVEAU : Fonction pour ouvrir et remplir la modale
    const openModal = (event) => {
        modalTitle.textContent = event.summary;
        modalTime.textContent = `⏰ ${formatTime(event.start)} - ${formatTime(event.end)}`;
        modalLocation.textContent = `📍 ${event.location || 'Non spécifié'}`;
        // Nettoie et affiche la description
        modalDescription.innerHTML = event.description ? event.description.replace(/\\n/g, '<br>') : 'Pas de description.';
        eventModal.classList.add('visible');
    };

    // --- Gestionnaires d'événements ---
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderCalendar();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderCalendar();
    });

    // NOUVEAU : Gestionnaire pour le bouton "Aujourd'hui"
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });

    viewToggleBtn.addEventListener('click', () => {
        currentView = currentView === 'week' ? 'list' : 'week';
        viewToggleBtn.textContent = currentView === 'week' ? 'Vue Liste' : 'Vue Semaine';
        renderCalendar();
    });

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // NOUVEAU : Gestionnaires pour fermer la modale
    modalCloseBtn.addEventListener('click', () => eventModal.classList.remove('visible'));
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            eventModal.classList.remove('visible');
        }
    });


    const fetchVersion = async () => {
        const versionSpan = document.getElementById('commit-version');
        try {
            const response = await fetch('https://api.github.com/repos/NoaSecond/BetterCalendar/commits/main');
            if (!response.ok) throw new Error('Réponse du réseau non valide');
            const data = await response.json();
            const commitHash = data.sha.substring(0, 7);
            versionSpan.textContent = commitHash;
        } catch (error) {
            console.error('Erreur lors de la récupération de la version du commit:', error);
            versionSpan.textContent = 'indisponible';
        }
    };

    // --- PWA Update Logic (NOUVEAU) ---
    const updateNotification = document.getElementById('update-notification');
    const updateBtn = document.getElementById('update-btn');

    // Écoute les messages venant du service worker
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
            // Affiche la bannière de mise à jour
            updateNotification.classList.add('show');
        }
    });

    // Gère le clic sur le bouton de mise à jour
    updateBtn.addEventListener('click', () => {
        // Le service worker a déjà mis le cache à jour,
        // on recharge simplement la page pour afficher les nouvelles données.
        window.location.reload();
    });

    // --- Initialisation ---
    viewToggleBtn.textContent = currentView === 'week' ? 'Vue Liste' : 'Vue Semaine';

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    }

    fetchAndRenderCalendar();
    fetchVersion();
});