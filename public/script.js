document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 === DÉMARRAGE DE L\'APPLICATION ===');
    console.log('📅 Initialisation de l\'application...');
    
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

    // --- Fonction de retry avec délai progressif ---
    const retryWithDelay = async (retryCount = 0, maxRetries = 3) => {
        const delays = [1000, 2000, 3000]; // 1s, 2s, 3s
        
        if (retryCount > 0) {
            const delay = delays[Math.min(retryCount - 1, delays.length - 1)];
            console.log(`⏱️ Attente de ${delay}ms avant nouvelle tentative (${retryCount}/${maxRetries})`);
            
            // Mettre à jour le status si l'élément existe
            const retryStatusElement = document.getElementById('retry-status');
            if (retryStatusElement) {
                retryStatusElement.textContent = `Nouvelle tentative dans ${delay/1000}s... (${retryCount}/${maxRetries})`;
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        try {
            // Mettre à jour le status si l'élément existe
            const retryStatusElement = document.getElementById('retry-status');
            if (retryStatusElement && retryCount > 0) {
                retryStatusElement.textContent = `Tentative ${retryCount + 1}/${maxRetries + 1} en cours...`;
            }
            
            await fetchAndRenderCalendar();
            console.log('✅ Retry réussi!');
        } catch (error) {
            if (retryCount < maxRetries) {
                console.log(`🔄 Tentative ${retryCount + 1} échouée, nouvelle tentative...`);
                return retryWithDelay(retryCount + 1, maxRetries);
            } else {
                console.log('❌ Tous les retries ont échoué');
                throw error;
            }
        }
    };

    // --- Logique Principale du Calendrier ---
    const fetchAndRenderCalendar = async () => {
        console.log('📅 === RÉCUPÉRATION DU CALENDRIER ===');
        skeletonLoader.style.display = 'grid';
        calendarContainer.style.display = 'none';
        try {
            console.log('🔄 Tentative de récupération du calendrier...');
            const response = await fetch('/api/calendar');
            console.log('📡 Réponse reçue:', response.status, response.statusText);
            
            if (!response.ok) {
                let errorText = '';
                try {
                    const errorData = await response.json();
                    errorText = errorData.error || errorData.details || response.statusText;
                    console.error('❌ Détails de l\'erreur serveur:', errorData);
                } catch {
                    errorText = await response.text() || response.statusText;
                }
                console.error('❌ Erreur serveur:', response.status, errorText);
                throw new Error(`Erreur serveur ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ Données reçues:', data.length, 'événements');
            console.log('📊 Traitement des événements...');
            allEvents = data.map(e => ({ ...e, start: new Date(e.start), end: new Date(e.end) })).sort((a, b) => a.start - b.start);
            console.log('🎯 Calendrier prêt à afficher');
            renderCalendar();
        } catch (error) {
            console.error('💥 Erreur complète:', error);
            
            let errorMessage = 'Impossible de charger le calendrier. ';
            
            // Diagnostics plus précis
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Problème de réseau ou serveur indisponible.';
            } else if (error.message.includes('JSON')) {
                errorMessage += 'Réponse serveur invalide.';
            } else if (error.message.includes('500')) {
                errorMessage += 'Erreur serveur interne.';
            } else if (error.message.includes('404')) {
                errorMessage += 'API introuvable.';
            } else {
                errorMessage += 'Vérifiez votre connexion ou le serveur.';
            }
            
            calendarContainer.innerHTML = `
                <div class="no-class-message">
                    <p>${errorMessage}</p>  
                    <p style="font-size: 0.8em; color: #666; margin-top: 0.5rem;">
                        Détails techniques : ${error.message}
                    </p>
                    <button class="retry-btn" id="retry-btn">Réessayer</button>
                    <p id="retry-status" style="font-size: 0.8em; color: #666; margin-top: 0.5rem; display: none;"></p>
                </div>
            `;
            
            // Ajouter l'événement click au bouton de retry avec retry intelligent
            const retryBtn = document.getElementById('retry-btn');
            const retryStatus = document.getElementById('retry-status');
            
            retryBtn.addEventListener('click', async () => {
                console.log('🔄 Nouvelle tentative demandée par l\'utilisateur');
                retryBtn.disabled = true;
                retryBtn.textContent = 'Retry en cours...';
                retryStatus.style.display = 'block';
                retryStatus.textContent = 'Tentative en cours...';
                
                try {
                    await retryWithDelay();
                } catch (error) {
                    retryBtn.disabled = false;
                    retryBtn.textContent = 'Réessayer';
                    retryStatus.textContent = 'Toutes les tentatives ont échoué. Réessayez plus tard.';
                    console.error('💥 Retry définitivement échoué:', error);
                }
            });
            
        } finally {
            console.log('🏁 Fin de récupération du calendrier');
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
        console.log('🔍 === VÉRIFICATION DE VERSION ===');
        const versionSpan = document.getElementById('commit-version');
        try {
            console.log('📱 Récupération de la version actuelle...');
            // Récupérer la version actuelle de l'application
            const currentVersionResponse = await fetch('/version.json?t=' + Date.now());
            const currentVersionData = await currentVersionResponse.json();
            const currentAppVersion = currentVersionData.version;
            
            console.log('🌐 Récupération de la dernière version GitHub...');
            // Récupérer la dernière version du repository
            const response = await fetch('https://api.github.com/repos/NoaSecond/BetterCalendar/commits/main');
            if (!response.ok) throw new Error('Réponse API GitHub non valide');
            const data = await response.json();
            const latestCommit = data.sha.substring(0, 7);
            versionSpan.textContent = latestCommit;
            
            console.log('� === COMPARAISON DES VERSIONS ===');
            console.log('   📱 Version actuelle:', currentAppVersion);
            console.log('   🌐 Dernière version:', latestCommit);
            
            // Vérifier si une nouvelle version est disponible
            if (currentAppVersion !== latestCommit) {
                console.log('🆕 Nouvelle version disponible!', currentAppVersion, '→', latestCommit);
                // Afficher la notification de mise à jour après un délai
                setTimeout(() => {
                    console.log('⏰ Temps depuis chargement:', Date.now() - pageLoadTime + 'ms');
                    if (Date.now() - pageLoadTime > 2000) { // Éviter les notifications au premier chargement
                        console.log('✅ Affichage de la notification de mise à jour');
                        updateNotification.classList.add('show');
                    } else {
                        console.log('⏭️ Notification ignorée (chargement trop récent)');
                    }
                }, 1500);
            } else {
                console.log('✅ Application à jour - aucune mise à jour nécessaire');
            }
            
            // Stocker la dernière version vérifiée pour référence
            localStorage.setItem('lastCheckedVersion', latestCommit);
            localStorage.setItem('currentAppVersion', currentAppVersion);
            
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la version:', error);
            versionSpan.textContent = 'indisponible';
        }
        console.log('🏁 Fin de vérification de version');
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
    const offlineNotification = document.getElementById('offline-notification');
    const offlineDismissBtn = document.getElementById('offline-dismiss-btn');
    
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
        console.log('📲 === PWA INSTALLATION DISPONIBLE ===');
        console.log('✅ Événement beforeinstallprompt détecté');
        // Empêcher l'affichage automatique du mini-infobar
        e.preventDefault();
        // Stocker l'événement pour l'utiliser plus tard
        deferredPrompt = e;
        
        // Afficher le bouton dans le header
        toggleInstallButton(true);
        console.log('🔘 Bouton d\'installation affiché');
        
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
        console.log('📲 === INSTALLATION PWA ===');
        if (!deferredPrompt) {
            console.log('⚠️ Pas de prompt d\'installation disponible');
            console.log('📖 Redirection vers instructions manuelles');
            // Si pas de prompt disponible, afficher des instructions
            alert('Pour installer cette application :\n\n• Chrome/Edge : Menu ⋮ > "Installer l\'application"\n• Firefox : Menu ≡ > "Installer cette application"\n• Safari : Partager 📤 > "Sur l\'écran d\'accueil"');
            return;
        }
        
        console.log('🚀 Affichage du prompt d\'installation...');
        // Afficher le prompt d'installation
        deferredPrompt.prompt();
        
        // Attendre la réponse de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice;
        console.log('👤 Réponse utilisateur:', outcome);
        
        // Cacher la popup et le bouton si l'installation a réussi
        if (outcome === 'accepted') {
            console.log('✅ Installation acceptée par l\'utilisateur');
            installNotification.classList.remove('show');
            toggleInstallButton(false);
        } else {
            console.log('❌ Installation refusée par l\'utilisateur');
        }
        
        // Reset du prompt après utilisation
        deferredPrompt = null;
        console.log('🏁 Fin de processus d\'installation');
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

    // Fonction pour afficher la notification hors-ligne
    const showOfflineNotification = () => {
        offlineNotification.classList.add('show');
        // Auto-masquer après 10 secondes
        setTimeout(() => {
            offlineNotification.classList.remove('show');
        }, 10000);
    };

    // Gestionnaire pour masquer la notification hors-ligne
    offlineDismissBtn.addEventListener('click', () => {
        offlineNotification.classList.remove('show');
    });

    // Détecter les changements de statut réseau
    window.addEventListener('online', () => {
        console.log('🌐 Connexion rétablie - retour en ligne');
        offlineNotification.classList.remove('show');
    });

    window.addEventListener('offline', () => {
        console.log('📴 Connexion perdue - passage en mode hors-ligne');
        showOfflineNotification();
    });

    // Masquer le bouton si l'app est déjà installée
    window.addEventListener('appinstalled', () => {
        console.log('🎉 PWA installée avec succès!');
        console.log('🔘 Masquage du bouton d\'installation');
        toggleInstallButton(false);
        installNotification.classList.remove('show');
        deferredPrompt = null;
        // Marquer l'installation comme terminée
        localStorage.setItem('pwaInstalled', 'true');
        console.log('💾 Installation marquée dans localStorage');
    });
    
    navigator.serviceWorker.addEventListener('message', event => { 
        if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
            console.log('📨 Message du Service Worker: nouvelle version disponible');
            // Ne pas afficher la notification si la page vient d'être chargée (moins de 5 secondes)
            if (Date.now() - pageLoadTime > 5000) {
                console.log('✅ Affichage de la notification de mise à jour');
                updateNotification.classList.add('show');
            } else {
                console.log('⏭️ Notification ignorée (chargement trop récent)');
            }
        } else if (event.data && event.data.type === 'OFFLINE_MODE') {
            console.log('📨 Message du Service Worker: mode hors-ligne activé');
            showOfflineNotification();
        }
    });
    
    // Écouter les événements personnalisés de mise à jour
    window.addEventListener('sw-update-available', () => {
        console.log('🔄 Événement de mise à jour détecté');
        updateNotification.classList.add('show');
    });
    
    updateBtn.addEventListener('click', () => {
        console.log('🗑️ === VIDAGE DU CACHE ===');
        updateNotification.classList.remove('show');
        caches.keys().then(keys => {
            console.log('📦 Caches trouvés:', keys.length);
            return Promise.all(keys.map(key => {
                console.log('🗑️ Suppression du cache:', key);
                return caches.delete(key);
            }));
        }).then(() => {
            console.log('✅ Tous les caches ont été vidés');
            // Marquer que le cache a été vidé pour la prochaine session
            sessionStorage.setItem('cacheCleared', 'true');
            // Réinitialiser la popup d'installation après vidage du cache
            localStorage.removeItem('installPopupDismissed');
            localStorage.removeItem('installPopupDismissedTime');
            localStorage.removeItem('lastSessionTime');
            console.log('🔄 Rechargement de la page...');
            window.location.reload();
        });
    });

    // --- Initialisation de l'Application ---
    console.log('⚙️ === CONFIGURATION INITIALE ===');
    viewToggleBtn.textContent = currentView === 'week' ? 'Vue Liste' : 'Vue Semaine';
    console.log('👁️ Vue par défaut:', currentView);
    
    const isInitiallyDark = localStorage.getItem('theme') === 'dark';
    if (isInitiallyDark) {
        document.body.classList.add('dark-mode');
        themeToggleBtn.textContent = '☀️';
        console.log('🌙 Mode sombre activé');
    } else {
        console.log('☀️ Mode clair activé');
    }
    updateThemeButtonAria(isInitiallyDark);
    
    console.log('🎯 === LANCEMENT DES SERVICES ===');
    
    // Vérifier si nous venons d'un vidage de cache pour utiliser le retry intelligent
    const justCacheCleared = sessionStorage.getItem('cacheCleared') === 'true';
    if (justCacheCleared) {
        console.log('🔄 Détection d\'un vidage de cache récent - utilisation du retry intelligent');
        // Nettoyer le flag
        sessionStorage.removeItem('cacheCleared');
        // Utiliser le retry avec délai pour éviter les erreurs de serveur
        retryWithDelay().catch(error => {
            console.error('💥 Retry intelligent initial échoué:', error);
        });
    } else {
        fetchAndRenderCalendar();
    }
    
    fetchVersion();
    updateTodayFab();
    
    console.log('✅ Application initialisée avec succès!');
});