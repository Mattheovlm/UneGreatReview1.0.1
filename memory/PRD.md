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
- Détail vidéo en modal transparent (overlay sur la page d'accueil)

### Social
- Système d'amis avec demandes (envoyer/accepter/refuser)
- Fil d'actualité des vidéos notées par les amis
- Réactions/commentaires sur les notes des amis
- Recherche d'utilisateurs pour les ajouter en amis

### Navigation
- Barre de navigation personnalisée (CustomTabBar) avec safe area
- 5 onglets: Accueil, Recherche, Ajouter (+), Activité, Profil
- Utilisation de Pressable pour meilleure réactivité tactile
- Padding dynamique pour éviter les interférences avec l'UI système

### Feed
- Onglet "Amis" : vidéos notées par vos amis
- Onglet "Découvrir" : toutes les vidéos notées
- Recommandations IA (OpenAI GPT-4o via Emergent LLM)
- Recommandations dans le modal vidéo

### Profil
- Informations utilisateur (avatar, nom, bio)
- Statistiques (nombre de vidéos, amis)
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
- `video_ratings` - Vidéos notées (rating en float pour demi-étoiles)
- `comments` - Réactions aux notes
- `friend_requests` - Demandes d'amis
- `friendships` - Relations d'amitié

## Changelog

### 2026-03-17
- **FIX**: Amélioration de la barre de navigation (CustomTabBar)
  - Remplacement de TouchableOpacity par Pressable pour meilleure réactivité
  - Ajout de padding dynamique basé sur SafeAreaInsets
  - Minimum 40px de padding en bas pour éviter les interférences avec l'UI système
- **FEATURE**: Support des demi-étoiles dans les notations
  - Notes possibles: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
  - Icônes d'étoiles: pleine, demi-remplie, vide
  - Validation backend mise à jour pour accepter les floats
  - Affichage des notes avec une décimale (ex: 4.5/5)
