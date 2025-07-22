document.addEventListener('DOMContentLoaded', () => {
    // --- Références aux éléments du DOM ---
    const calendarContainer = document.getElementById('calendar-container');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const todayBtn = document.getElementById('today-btn');
    const todayFab = document.getElementById('today-fab');
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

    // Fonction pour vérifier si on est sur la semaine actuelle
    const isCurrentWeek = () => {
        const today = new Date();
        const todayWeekStart = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        todayWeekStart.setDate(diff);
        todayWeekStart.setHours(0, 0, 0, 0);

        const currentWeekStart = new Date(currentDate);
        const currentDay = currentDate.getDay();
        const currentDiff = currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        currentWeekStart.setDate(currentDiff);
        currentWeekStart.setHours(0, 0, 0, 0);

        return todayWeekStart.getTime() === currentWeekStart.getTime();
    };

    // Fonction pour gérer l'affichage du bouton flottant
    const updateTodayFab = () => {
        // Afficher seulement sur mobile (768px ou moins) et si on n'est pas sur la semaine actuelle
        const isMobile = window.innerWidth <= 768;
        const shouldShow = isMobile && !isCurrentWeek();
        
        if (shouldShow) {
            todayFab.style.display = 'block';
            todayFab.classList.add('show');
            todayFab.classList.remove('hide');
        } else {
            todayFab.classList.add('hide');
            todayFab.classList.remove('show');
            setTimeout(() => {
                if (todayFab.classList.contains('hide')) {
                    todayFab.style.display = 'none';
                }
            }, 300);
        }
    };

    // Fonction pour aller à aujourd'hui
    const goToToday = () => {
        currentDate = new Date();
        renderCalendar();
        updateTodayFab();
    };

    const fetchVersion = async () => {
        const versionSpan = document.getElementById('commit-version');
        try {
            const response = await fetch('https://api.github.com/repos/NoaSecond/BetterCalendar/commits/main');
            if (!response.ok) throw new Error('Réponse API GitHub non valide');
            const data = await response.json();
            const latestCommit = data.sha.substring(0, 7);
            versionSpan.textContent = latestCommit;
            
            // Vérifier si la version locale est différente
            const cachedVersion = localStorage.getItem('cachedVersion');
            if (cachedVersion && cachedVersion !== latestCommit) {
                console.log(`Version différente détectée: cached=${cachedVersion}, latest=${latestCommit}`);
                // Afficher la notification de mise à jour après un délai
                setTimeout(() => {
                    updateNotification.classList.add('show');
                }, 3000);
            }
            localStorage.setItem('cachedVersion', latestCommit);
            
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
            updateTodayFab();
            calendarContainer.classList.remove('calendar-fading');
        }, 300);
    };

    prevWeekBtn.addEventListener('click', () => handleWeekChange('prev'));
    nextWeekBtn.addEventListener('click', () => handleWeekChange('next'));
    todayBtn.addEventListener('click', goToToday);
    todayFab.addEventListener('click', goToToday);
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

    // Gestionnaire pour les changements de taille d'écran
    window.addEventListener('resize', updateTodayFab);

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
    const installBtn = document.getElementById('install-btn');
    const installNotification = document.getElementById('install-notification');
    const installPopupBtn = document.getElementById('install-popup-btn');
    const installDismissBtn = document.getElementById('install-dismiss-btn');
    
    // Variable pour éviter les notifications immédiatement après le chargement
    let pageLoadTime = Date.now();
    let deferredPrompt;
    let installPopupDismissed = localStorage.getItem('installPopupDismissed') === 'true';
    
    // Vérifier si c'est une session après mise à jour ou vidage de cache
    const lastSessionTime = localStorage.getItem('lastSessionTime');
    const currentTime = Date.now();
    const timeSinceLastSession = lastSessionTime ? currentTime - parseInt(lastSessionTime) : 0;
    const cacheCleared = sessionStorage.getItem('cacheCleared') === 'true';
    
    // Si plus de 30 minutes se sont écoulées, première visite, ou cache vidé, réinitialiser la popup
    if (!lastSessionTime || timeSinceLastSession > 30 * 60 * 1000 || cacheCleared) {
        localStorage.removeItem('installPopupDismissed');
        installPopupDismissed = false;
        sessionStorage.removeItem('cacheCleared');
    }
    
    // Enregistrer l'heure de cette session
    localStorage.setItem('lastSessionTime', currentTime.toString());
    
    // Fonction pour gérer l'affichage du bouton d'installation
    const toggleInstallButton = (show) => {
        if (show) {
            installBtn.style.display = 'block';
            // Ajouter la classe pour masquer le bouton de vue sur mobile
            document.body.classList.add('install-available');
        } else {
            installBtn.style.display = 'none';
            // Supprimer la classe pour réafficher le bouton de vue
            document.body.classList.remove('install-available');
        }
    };
    
    // Fonction pour afficher la popup d'installation
    const showInstallPopup = () => {
        if (!installPopupDismissed && !localStorage.getItem('pwaInstalled')) {
            setTimeout(() => {
                installNotification.classList.add('show');
            }, 2000);
        }
    };
    
    // Gestion de l'installation PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event fired');
        // Empêcher l'affichage automatique du mini-infobar
        e.preventDefault();
        // Stocker l'événement pour l'utiliser plus tard
        deferredPrompt = e;
        
        // Afficher le bouton dans le header
        toggleInstallButton(true);
        
        // Afficher la popup si les conditions sont remplies
        showInstallPopup();
    });

    // Si pas d'événement beforeinstallprompt mais conditions remplies, afficher quand même la popup
    setTimeout(() => {
        if (!deferredPrompt && !localStorage.getItem('pwaInstalled')) {
            // Vérifier si on peut détecter que c'est une PWA installable
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
            const isInWebAppiOS = (window.navigator.standalone === true);
            const isInstalled = isStandalone || isInWebAppiOS;
            
            if (!isInstalled) {
                // Afficher le bouton header même sans beforeinstallprompt
                toggleInstallButton(true);
                // Afficher la popup si cache vidé ou première visite
                if (cacheCleared || !lastSessionTime) {
                    showInstallPopup();
                }
            }
        }
    }, 3000);

    // Fonction pour installer l'app
    const installApp = async () => {
        if (!deferredPrompt) {
            console.log('Pas de prompt d\'installation disponible - redirection vers instructions');
            // Si pas de prompt disponible, afficher des instructions
            alert('Pour installer cette application :\n\n• Chrome/Edge : Menu ⋮ > "Installer l\'application"\n• Firefox : Menu ≡ > "Installer cette application"\n• Safari : Partager 📤 > "Sur l\'écran d\'accueil"');
            return;
        }
        
        // Afficher le prompt d'installation
        deferredPrompt.prompt();
        
        // Attendre la réponse de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        
        // Cacher la popup et le bouton si l'installation a réussi
        if (outcome === 'accepted') {
            installNotification.classList.remove('show');
            toggleInstallButton(false);
        }
        
        // Reset du prompt après utilisation
        deferredPrompt = null;
    };

    // Gestionnaires pour les boutons d'installation
    installPopupBtn.addEventListener('click', () => {
        installNotification.classList.remove('show');
        installApp();
    });

    installDismissBtn.addEventListener('click', () => {
        installNotification.classList.remove('show');
        // Marquer que l'utilisateur a rejeté la popup pour cette session
        localStorage.setItem('installPopupDismissed', 'true');
        // Enregistrer le timestamp du rejet pour permettre la re-proposition plus tard
        localStorage.setItem('installPopupDismissedTime', Date.now().toString());
        installPopupDismissed = true;
    });

    installBtn.addEventListener('click', installApp);

    // Masquer le bouton si l'app est déjà installée
    window.addEventListener('appinstalled', () => {
        console.log('PWA installée avec succès');
        toggleInstallButton(false);
        installNotification.classList.remove('show');
        deferredPrompt = null;
        // Marquer l'installation comme terminée
        localStorage.setItem('pwaInstalled', 'true');
    });
    
    navigator.serviceWorker.addEventListener('message', event => { 
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
            console.log('Message reçu du Service Worker: nouvelle version disponible');
            // Ne pas afficher la notification si la page vient d'être chargée (moins de 5 secondes)
            if (Date.now() - pageLoadTime > 5000) {
                updateNotification.classList.add('show');
            }
        }
    });
    
    // Écouter les événements personnalisés de mise à jour
    window.addEventListener('sw-update-available', () => {
        console.log('Événement de mise à jour détecté');
        updateNotification.classList.add('show');
    });
    
    updateBtn.addEventListener('click', () => {
        updateNotification.classList.remove('show');
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => caches.delete(key)));
        }).then(() => {
            console.log('All caches cleared.');
            // Marquer que le cache a été vidé pour la prochaine session
            sessionStorage.setItem('cacheCleared', 'true');
            // Réinitialiser la popup d'installation après vidage du cache
            localStorage.removeItem('installPopupDismissed');
            localStorage.removeItem('installPopupDismissedTime');
            localStorage.removeItem('lastSessionTime');
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
    updateTodayFab();
});