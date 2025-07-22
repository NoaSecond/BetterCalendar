document.addEventListener('DOMContentLoaded', () => {
    // --- Références aux éléments du DOM ---
    const calendarContainer = document.getElementById('calendar-container');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const todayBtn = document.getElementById('today-btn');
    const currentWeekInfo = document.getElementById('current-week-info');
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const skeletonLoader = document.getElementById('skeleton-loader');
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

    // --- Fonctions Utilitaires ---
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

    const extractTeachers = (description) => {
        if (!description) return null;
        
        const lines = description.split('\n').filter(line => line.trim());
        const teachers = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (/^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]+\s+[A-Za-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+/.test(trimmed) && 
                !trimmed.includes('-') && 
                !trimmed.includes('M1') && 
                !trimmed.includes('M2') && 
                !trimmed.includes('CM') && 
                !trimmed.includes('TD') && 
                !trimmed.includes('TP') &&
                trimmed.length > 3 && 
                trimmed.length < 50) {
                teachers.push(trimmed);
            }
        }
        
        return teachers.length > 0 ? teachers : null;
    };

    // --- Logique Principale du Calendrier ---
    const fetchAndRenderCalendar = async () => {
        skeletonLoader.style.display = 'grid';
        calendarContainer.style.display = 'none';
        try {
            const response = await fetch('/api/calendar');
            if (!response.ok) throw new Error('La réponse du serveur n\'est pas OK');
            const data = await response.json();
            allEvents = data.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) })).sort((a, b) => a.start - b.start);
            renderCalendar();
        } catch (error) {
            calendarContainer.innerHTML = `<p class="no-class-message">Impossible de charger le calendrier. Vérifiez votre connexion ou le serveur.</p>`;
            console.error(error);
        } finally {
            skeletonLoader.style.display = 'none';
            calendarContainer.style.display = 'block';
        }
    };

    const renderCalendar = () => {
        const firstDayOfWeek = new Date(currentDate);
        const day = currentDate.getDay();
        const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        firstDayOfWeek.setHours(0, 0, 0, 0);

        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        lastDayOfWeek.setHours(23, 59, 59, 999);

        const weekNum = getWeekNumber(currentDate);
        const options = { month: 'long', day: 'numeric' };
        currentWeekInfo.innerHTML = `Semaine ${weekNum} <br>(${firstDayOfWeek.toLocaleDateString('fr-FR', options)} - ${lastDayOfWeek.toLocaleDateString('fr-FR', options)})`;

        const eventsThisWeek = allEvents.filter(event => {
            const eventDate = event.start;
            return eventDate >= firstDayOfWeek && eventDate <= lastDayOfWeek;
        });

        calendarContainer.innerHTML = '';
        if (eventsThisWeek.length === 0) {
            calendarContainer.innerHTML = `<p class="no-class-message">Pas de cours cette semaine. Profitez-en ! 🎉</p>`;
            return;
        }

        currentView === 'week' ? renderWeekView(eventsThisWeek, firstDayOfWeek) : renderListView(eventsThisWeek);
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
            const eventsForDay = events.filter(event => {
                const eventDate = new Date(event.start);
                const currentDay = new Date(currentDateInLoop);
                return eventDate.toDateString() === currentDay.toDateString();
            });
            eventsForDay.forEach(event => dayContainer.appendChild(createEventCard(event)));
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
        card.className = `event-card course-${getCourseType(event.summary)}`;
        const title = document.createElement('h3');
        title.textContent = event.summary;
        const time = document.createElement('p');
        time.textContent = `⏰ ${formatTime(event.start)} - ${formatTime(event.end)}`;
        const location = document.createElement('p');
        location.textContent = `📍 ${event.location || 'Non spécifié'}`;
        
        const teachers = extractTeachers(event.description);
        const teachersElement = document.createElement('p');
        if (teachers && teachers.length > 0) {
            teachersElement.textContent = `👤 ${teachers.join(', ')}`;
            teachersElement.className = 'event-teachers';
        } else {
            teachersElement.textContent = '👤 Enseignant non spécifié';
            teachersElement.className = 'event-teachers no-teacher';
        }
        
        card.append(title, time, location, teachersElement);
        card.addEventListener('click', () => openModal(event));
        return card;
    };

    const openModal = (event) => {
        modalTitle.textContent = event.summary;
        modalTime.textContent = `⏰ ${formatTime(event.start)} - ${formatTime(event.end)}`;
        modalLocation.textContent = `📍 ${event.location || 'Non spécifié'}`;
        
        const teachers = extractTeachers(event.description);
        const teachersText = teachers && teachers.length > 0 
            ? `👤 ${teachers.join(', ')}` 
            : '👤 Enseignant non spécifié';
        
        modalDescription.innerHTML = `
            <p style="margin-bottom: 10px; font-weight: 500;">${teachersText}</p>
            <div style="border-top: 1px solid #eee; padding-top: 10px;">
                ${event.description ? event.description.replace(/\\n/g, '<br>') : 'Pas de description.'}
            </div>
        `;
        eventModal.classList.add('visible');
    };

    const updateThemeButtonAria = (isDark) => {
        themeToggleBtn.setAttribute('aria-label', isDark ? 'Passer au mode clair' : 'Passer au mode sombre');
    };

    const fetchVersion = async () => {
        const versionSpan = document.getElementById('commit-version');
        try {
            const response = await fetch('https://api.github.com/repos/NoaSecond/BetterCalendar/commits/main');
            if (!response.ok) throw new Error('Réponse API GitHub non valide');
            const data = await response.json();
            versionSpan.textContent = data.sha.substring(0, 7);
        } catch (error) {
            console.error('Erreur lors de la récupération de la version:', error);
            versionSpan.textContent = 'indisponible';
        }
    };

    // --- Gestionnaires d'Événements ---
    const handleWeekChange = (direction) => {
        calendarContainer.classList.add('calendar-fading');
        setTimeout(() => {
            currentDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
            renderCalendar();
            calendarContainer.classList.remove('calendar-fading');
        }, 300);
    };

    prevWeekBtn.addEventListener('click', () => handleWeekChange('prev'));
    nextWeekBtn.addEventListener('click', () => handleWeekChange('next'));
    todayBtn.addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });
    viewToggleBtn.addEventListener('click', () => {
        currentView = currentView === 'week' ? 'list' : 'week';
        viewToggleBtn.textContent = currentView === 'week' ? 'Vue Liste' : 'Vue Semaine';
        renderCalendar();
    });
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeButtonAria(isDark);
    });
    modalCloseBtn.addEventListener('click', () => eventModal.classList.remove('visible'));
    eventModal.addEventListener('click', (e) => { if (e.target === eventModal) eventModal.classList.remove('visible'); });

    // --- Gestion du Swipe pour la Navigation ---
    let touchStartX = 0;
    let touchEndX = 0;

    calendarContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    calendarContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
        const swipeThreshold = 50; // La distance minimale en pixels pour considérer un swipe
        if (touchStartX - touchEndX > swipeThreshold) {
            // Swipe vers la gauche (semaine suivante)
            handleWeekChange('next');
        } else if (touchEndX - touchStartX > swipeThreshold) {
            // Swipe vers la droite (semaine précédente)
            handleWeekChange('prev');
        }
    };

    // --- Logique de la PWA ---
    const updateNotification = document.getElementById('update-notification');
    const updateBtn = document.getElementById('update-btn');
    
    // Variable pour éviter les notifications immédiatement après le chargement
    let pageLoadTime = Date.now();
    
    navigator.serviceWorker.addEventListener('message', event => { 
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
            // Ne pas afficher la notification si la page vient d'être chargée (moins de 5 secondes)
            if (Date.now() - pageLoadTime > 5000) {
                updateNotification.classList.add('show');
            }
        }
    });
    
    updateBtn.addEventListener('click', () => {
        updateNotification.classList.remove('show');
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => caches.delete(key)));
        }).then(() => {
            console.log('All caches cleared.');
            window.location.reload();
        });
    });

    // --- Initialisation de l'Application ---
    viewToggleBtn.textContent = currentView === 'week' ? 'Vue Liste' : 'Vue Semaine';
    const isInitiallyDark = localStorage.getItem('theme') === 'dark';
    if (isInitiallyDark) {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
    }
    updateThemeButtonAria(isInitiallyDark);
    
    fetchAndRenderCalendar();
    fetchVersion();
});