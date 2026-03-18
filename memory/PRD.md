# Social Cinema - PRD (Product Requirements Document)

## Concept
Letterboxd pour YouTube - Plateforme sociale de curation de vidéos YouTube.

## Fonctionnalités Implémentées

### Authentification
- Inscription par email/mot de passe (JWT)
- Connexion Google OAuth (Emergent Auth)
- Gestion des sessions avec tokens Bearer
- Déconnexion

### Vidéos
- Ajout d'une vidéo YouTube via URL (extraction oEmbed automatique)
- **Notation 0.5-5 étoiles avec demi-étoiles** (0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)
- Geste tactile interactif pour la notation (glisser le doigt)
- Feedback haptique lors de la sélection
- Commentaire personnel sur la vidéo
- Détail vidéo en modal transparent (sans bouton X - fermeture par tap extérieur)
- Bouton "Ajouter à une playlist" dans le modal vidéo

### Playlists (NOUVEAU)
- Création de playlists (max 15 par utilisateur)
- 50 vidéos maximum par playlist
- Ajout de vidéos depuis: modal vidéo, recherche, recommandations
- Affichage sur le profil avec compteur
- Suppression de playlist et de vidéos
- Page détail de playlist

### Social
- Système d'amis avec demandes (envoyer/accepter/refuser)
- Fil d'actualité des vidéos notées par les amis
- Réactions/commentaires sur les notes des amis
- Recherche d'utilisateurs pour les ajouter en amis

### Navigation
- Barre de navigation personnalisée (CustomTabBar)
- Correspondance par nom de route (pas par index)
- 5 onglets: Accueil, Recherche, Ajouter (+), Activité, Profil
- Safe area padding dynamique

### Feed
- Onglet "Amis" : vidéos notées par vos amis
- Onglet "Découvrir" : toutes les vidéos notées
- Recommandations IA (OpenAI GPT-4o via Emergent LLM)

### Profil
- Informations utilisateur (avatar, nom, bio)
- Statistiques (nombre de vidéos, amis)
- Section "Mes playlists" avec bouton création
- Liste des vidéos notées avec demi-étoiles

### Thème
- Mode sombre (par défaut, cinématique)
- Mode clair
- Toggle dans les paramètres

## Stack Technique
- **Backend**: FastAPI + MongoDB
- **Frontend**: Expo React Native (SDK 54) + expo-router
- **IA**: OpenAI GPT-4o via Emergent LLM Key
- **Auth**: JWT + Google OAuth (Emergent Auth)

## Collections MongoDB
- `users` - Profils utilisateurs
- `user_sessions` - Sessions d'authentification
- `video_ratings` - Vidéos notées (rating en float)
- `comments` - Réactions aux notes
- `friend_requests` - Demandes d'amis
- `friendships` - Relations d'amitié
- `playlists` - Playlists utilisateur (NOUVEAU)

## API Endpoints

### Playlists (NOUVEAU)
- `POST /api/playlists` - Créer une playlist
- `GET /api/playlists` - Liste des playlists de l'utilisateur
- `GET /api/playlists/:id` - Détail d'une playlist
- `PUT /api/playlists/:id` - Modifier une playlist
- `DELETE /api/playlists/:id` - Supprimer une playlist
- `POST /api/playlists/:id/videos` - Ajouter une vidéo
- `DELETE /api/playlists/:id/videos/:youtubeId` - Retirer une vidéo

## Changelog

### 2026-03-18
- **FEATURE**: Système de playlists complet
  - Max 15 playlists par utilisateur, 50 vidéos par playlist
  - Création depuis le profil (bouton "+ Playlist")
  - Ajout de vidéos depuis le modal vidéo
  - Page détail de playlist avec suppression
- **FIX**: Correction de la barre de navigation
  - Correspondance par `route.name` au lieu de l'index
  - Résolution du problème du bouton "Profil" non cliquable

### 2026-03-17
- **FIX**: Amélioration de la barre de navigation (CustomTabBar)
- **FEATURE**: Support des demi-étoiles dans les notations
