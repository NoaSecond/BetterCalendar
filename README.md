# 📅 Calendrier MAJIC

Une application web simple et moderne pour visualiser l'emploi du temps du Master MAJIC de l'Université Côte d'Azur. L'application est conçue comme une Progressive Web App (PWA) pour une installation facile sur mobile et ordinateur.

<!-- ![Application Web]() TODO : Ajouter l'URL Vercel. -->

---

## ✨ Fonctionnalités

- **Vue Hebdomadaire & Liste** : Basculez facilement entre un affichage par semaine ou une liste chronologique des cours.
- **Codes Couleurs** : Détection automatique des types de cours (CM, TD, TP, Projet) pour une meilleure lisibilité.
- **Thème Clair & Sombre** : Adaptez l'interface à vos préférences.
- **Progressive Web App (PWA)** : Installez l'application directement depuis votre navigateur pour un accès rapide.
- **Navigation Intuitive** : Passez d'une semaine à l'autre en un clic.
- **Backend Proxy** : Un serveur Node.js/Express gère la récupération des données `.ics` pour plus de fiabilité.

---

## 🛠️ Stack Technique

- **Frontend** : HTML5, CSS3, JavaScript
- **Backend** : Node.js, Express.js
- **Parsing ICS** : `node-ical`
- **Requêtes HTTP** : `axios`

---

## 🚀 Installation et Lancement

Pour lancer le projet en local sur votre machine, suivez ces étapes :

1.  **Clonez le dépôt**
    ```bash
    git clone [https://github.com/NoaSecond/BetterCalendar](https://github.com/NoaSecond/BetterCalendar)
    cd BetterCalendar
    ```

2.  **Installez les dépendances**
    (Assurez-vous d'avoir Node.js et npm installés)
    ```bash
    npm install
    ```

3.  **Lancez le serveur**
    ```bash
    npm start
    ```

4.  **Ouvrez votre navigateur** et rendez-vous sur [http://localhost:3000](http://localhost:3000).

---

## 🎨 Personnalisation

### Changer le lien du calendrier

Le lien vers le fichier `.ics` est défini dans `server.js`. Modifiez la constante `icsUrl` pour utiliser un autre calendrier.

## 🤝 Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez améliorer ce projet, n'hésitez pas à proposer des modifications.

1.  **Forkez** le projet.
2.  Créez une nouvelle branche pour votre fonctionnalité (`git checkout -b feature/NouvelleFonctionnalite`).
3.  Faites vos modifications et **committez-les**.
    -   **Important** : Ce projet utilise **Gitmoji** pour les messages de commit. Veuillez préfixer vos commits avec l'emoji approprié pour décrire le changement. La liste complète est disponible sur [gitmoji.dev](https://gitmoji.dev/).
    -   Exemple : `git commit -m "✨ Ajout d'une nouvelle fonctionnalité incroyable"`
4.  **Poussez** vos changements vers votre fork (`git push origin feature/NouvelleFonctionnalite`).
5.  Ouvrez une **Pull Request**.