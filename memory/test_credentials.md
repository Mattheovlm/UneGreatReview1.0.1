# Test Credentials — Social Cinema

## Compte de test vérifié (email déjà validé, connexion directe possible)
- Email: testcode@example.com
- Mot de passe: test123
- Statut: email_verified = true

## Notes pour les tests d'authentification
- La connexion Google a été SUPPRIMÉE. Seule la connexion email/mot de passe existe.
- L'inscription exige: nom, email, mot de passe (6+), case "13 ans+" cochée, case CGU cochée.
- Après inscription, un CODE à 6 chiffres est envoyé par email (Gmail SMTP réel).
  Pour les tests, le code peut être lu en base:
  mongosh --quiet test_database --eval 'db.users.findOne({email:"EMAIL"}).email_verification_code'
- POST /api/auth/verify-code {email, code} → crée la session.
- POST /api/auth/resend-code {email} → cooldown 30s.
- Connexion avec email non vérifié → 403 EMAIL_NOT_VERIFIED + nouveau code envoyé.

## SMTP (Gmail — fonctionnel)
- Compte: unegreatreview@gmail.com (mot de passe d'application configuré dans /app/backend/.env — SMTP_PASSWORD)
