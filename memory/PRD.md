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
- Notation 1-5 étoiles avec geste tactile interactif
- Commentaire personnel sur la vidéo
- Détail vidéo en modal transparent (overlay sur la page d'accueil)

### Social
- Système d'amis avec demandes (envoyer/accepter/refuser)
- Fil d'actualité des vidéos notées par les amis
- Réactions/commentaires sur les notes des amis
- Recherche d'utilisateurs pour les ajouter en amis

### Feed
- Onglet "Amis" : vidéos notées par vos amis
- Onglet "Découvrir" : toutes les vidéos notées
- Recommandations IA (OpenAI GPT-4o via Emergent LLM)
- Recommandations dans le modal vidéo

### Profil
- Informations utilisateur (avatar, nom, bio)
- Statistiques (nombre de vidéos, amis)
- Liste des vidéos notées

### Thème
- Mode sombre (par défaut, cinématique)
- Mode clair
- Toggle dans les paramètres

## Stack Technique
- **Backend**: FastAPI + MongoDB
- **Frontend**: Expo React Native (SDK 54) + expo-router
- **IA**: OpenAI GPT-4o via Emergent LLM Key
- **Auth**: JWT + Google OAuth (Emergent Auth)

### Lecteur YouTube
- Lecteur intégré en iframe (web) avec bouton Play
- Ouverture externe vers YouTube (native)
- Badge "Lire la vidéo" sur la miniature

### Édition de Profil
- Modifier nom et bio via modal
- Section "Mes amis" horizontale
- Statistiques (vidéos, amis)

## Collections MongoDB
- `users` - Profils utilisateurs
- `user_sessions` - Sessions d'authentification
- `video_ratings` - Vidéos notées
- `comments` - Réactions aux notes
- `friend_requests` - Demandes d'amis
- `friendships` - Relations d'amitié
