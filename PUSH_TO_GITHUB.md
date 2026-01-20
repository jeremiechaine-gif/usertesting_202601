# Instructions pour pousser vers GitHub

Le projet est prêt à être poussé vers GitHub. Voici comment procéder :

## Option 1 : Via la ligne de commande avec authentification

### Étape 1 : Créer un Personal Access Token (PAT)

1. Allez sur GitHub : https://github.com/settings/tokens
2. Cliquez sur "Generate new token" → "Generate new token (classic)"
3. Donnez un nom (ex: "usertesting_202601")
4. Cochez la scope `repo` (accès complet aux repositories)
5. Cliquez sur "Generate token"
6. **Copiez le token** (vous ne pourrez plus le voir après)

### Étape 2 : Pousser le code

```bash
# Utilisez votre token comme mot de passe
git push -u origin main
# Username: jeremiechaine-gif
# Password: [collez votre token ici]
```

Ou configurez le token dans l'URL :

```bash
git remote set-url origin https://[VOTRE_TOKEN]@github.com/jeremiechaine-gif/usertesting_202601.git
git push -u origin main
```

## Option 2 : Via GitHub Desktop

1. Installez GitHub Desktop
2. File → Clone Repository → URL
3. Entrez : `https://github.com/jeremiechaine-gif/usertesting_202601.git`
4. Cliquez sur "Push origin"

## Option 3 : Via l'interface web GitHub

1. Allez sur https://github.com/jeremiechaine-gif/usertesting_202601
2. Cliquez sur "uploading an existing file"
3. Glissez-déposez tous les fichiers du projet
4. Commitez

## État actuel

✅ Tous les fichiers sont commités localement
✅ Le remote est configuré vers : `https://github.com/jeremiechaine-gif/usertesting_202601.git`
✅ Prêt à être poussé

Il ne reste plus qu'à authentifier et pousser !
