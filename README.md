# 📅 Calendrier MAJIC

Une application web simple et moderne pour visualiser l'emploi du temps du Master MAJIC de l'Université Côte d'Azur. L'application est conçue comme une Progressive Web App (PWA) pour une installation facile sur mobile et ordinateur.

[App Web Vercel](https://better-calendar-sand.vercel.app)

## 📖 Sommaire

- [✨ Fonctionnalités](#-fonctionnalités)
- [🛠️ Stack Technique](#️-stack-technique)
- [🚀 Installation et Lancement](#-installation-et-lancement)
- [🔧 Améliorations Récentes](#-améliorations-récentes)
- [🎨 Personnalisation](#-personnalisation)
- [🤝 Contribuer](#-contribuer)

-----

## ✨ Fonctionnalités

  - **Vue Hebdomadaire & Liste** : Basculez facilement entre un affichage par semaine ou une liste chronologique des cours.
  - **Codes Couleurs** : Détection automatique des types de cours (CM, TD, TP, Projet) pour une meilleure lisibilité.
  - **Thème Clair & Sombre** : Adaptez l'interface à vos préférences.
  - **Progressive Web App (PWA)** : Installez l'application directement depuis votre navigateur pour un accès rapide.
  - **Navigation Intuitive** : Passez d'une semaine à l'autre en un clic, retournez à la semaine actuelle instantanément.
  - **Détails d'Événements** : Cliquez sur un cours pour voir les informations complètes (description, enseignant, horaires).
  - **Backend Serverless** : Un serveur Node.js/Express gère la récupération des données `.ics` pour plus de fiabilité.

-----

## 🛠️ Stack Technique

  - **Frontend** : HTML5, CSS3, JavaScript (ES6+)
  - **Backend** : Node.js, Vercel Serverless Functions
  - **Parsing ICS** : `node-ical` pour l'analyse des fichiers calendrier
  - **Requêtes HTTP** : `axios` pour les appels API
  - **Gestion des Dates** : JavaScript natif avec support des fuseaux horaires

-----

## 🚀 Installation et Lancement

Pour lancer le projet en local sur votre machine, suivez ces étapes :

1.  **Clonez le dépôt**

    ```bash
    git clone https://github.com/NoaSecond/BetterCalendar
    cd BetterCalendar
    ```

2.  **Installez les dépendances**
    (Assurez-vous d'avoir Node.js et npm installés)

    ```bash
    npm install
    ```

3.  **Installez la CLI de Vercel**
    Si vous ne l'avez pas déjà, installez l'outil en ligne de commande de Vercel.

    ```bash
    npm install -g vercel
    ```

4.  **Lancez le serveur de développement local**
    Cette commande va simuler l'environnement Vercel sur votre machine.

    ```bash
    vercel dev --listen 3001
    ```

5.  **Ouvrez votre navigateur** et rendez-vous sur [http://localhost:3001](http://localhost:3001).

-----

## 🔧 Améliorations Récentes

### ✨ Nouvelles Fonctionnalités
- **Swiper pour changer de semaine** : Ajout de la navigation par glissement (swipe) sur mobile pour passer d'une semaine à l'autre facilement
- **Bouton d'Installation PWA** : Bouton personnalisé pour installer l'application comme PWA sur desktop et mobile
- **Bouton Flottant Mobile** : Bouton "Aujourd'hui" accessible sur mobile via un FAB (Floating Action Button)

### 🐛 Corrections de Bugs
- **Notifications de Mise à Jour** : Correction de la popup qui s'affichait même sans changements réels

### 🎨 Améliorations de l'Interface
- **Re-proposition d'Installation** : La popup d'installation se re-montre après les mises à jour ou vidage de cache
- **Optimisation Mobile** : Masquage automatique du bouton de vue sur mobile quand l'installation est disponible

-----

## 🎨 Personnalisation

### Changer le lien du calendrier

Le lien vers le fichier `.ics` est défini dans `api/calendar.js`. Modifiez la constante `icsUrl` pour utiliser un autre calendrier.

### Structure du Projet

```
BetterCalendar/
├── api/
│   └── calendar.js         # API serverless pour récupérer les données .ics
├── public/
│   ├── index.html          # Page principale de l'application
│   ├── script.js           # Logique JavaScript
│   ├── style.css           # Styles CSS
│   ├── manifest.json       # Configuration PWA
│   ├── service-worker.js   # Service Worker pour la mise en cache
│   └── images/
│       └── icon.png        # Icône de l'application
├── package.json            # Dépendances et scripts npm
└── README.md               # Documentation du projet
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez améliorer ce projet, n'hésitez pas à proposer des modifications.

1.  **Forkez** le projet.
2.  Créez une nouvelle branche pour votre fonctionnalité (`git checkout -b feature/NouvelleFonctionnalite`).
3.  Faites vos modifications et **committez-les**.
      - **Important** : Ce projet utilise **Gitmoji** pour les messages de commit. Veuillez préfixer vos commits avec l'emoji approprié pour décrire le changement. La liste complète est disponible sur [gitmoji.dev](https://gitmoji.dev/).
      - Exemple : `git commit -m "✨ Ajout d'une nouvelle fonctionnalité incroyable"`
4.  **Poussez** vos changements vers votre fork (`git push origin feature/NouvelleFonctionnalite`).
5.  Ouvrez une **Pull Request**.