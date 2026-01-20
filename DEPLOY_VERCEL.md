# Déploiement Vercel - Instructions rapides

## Pour obtenir votre lien Vercel :

### Option 1 : Via la ligne de commande (Recommandé)

1. **Connectez-vous à Vercel** :
   ```bash
   vercel login
   ```

2. **Déployez votre projet** :
   ```bash
   vercel --prod
   ```

3. **Vous obtiendrez un lien** comme : `https://votre-projet.vercel.app`

### Option 2 : Via l'interface web (Plus simple)

1. **Allez sur [vercel.com](https://vercel.com)**
2. **Connectez-vous** avec GitHub/GitLab/Bitbucket
3. **Cliquez sur "Add New Project"**
4. **Importez votre repository GitLab** :
   - `https://pelilab.pelico.tech/jeremie.chaine/usertest_onboarding_routine_202601.git`
5. **Vercel détectera automatiquement Vite** → Cliquez sur "Deploy"
6. **Attendez 30-60 secondes** → Votre lien sera disponible !

### Votre lien sera du type :
```
https://usertest-onboarding-routine-202601.vercel.app
```

ou

```
https://usertest-onboarding-routine-202601-[hash].vercel.app
```

---

## Configuration automatique

Le fichier `vercel.json` est déjà configuré, donc Vercel :
- ✅ Détectera automatiquement Vite
- ✅ Utilisera `npm run build`
- ✅ Servira depuis le dossier `dist`
- ✅ Configurera le routing SPA correctement

---

## Après le déploiement

Une fois déployé, vous pouvez :
- Partager le lien avec n'importe qui
- Le lien fonctionne sur mobile et desktop
- HTTPS est inclus automatiquement
- Les mises à jour sont automatiques (si vous poussez sur Git)

---

## Déploiements automatiques

Si vous connectez votre repo GitLab à Vercel :
- Chaque push sur `main` déclenchera un nouveau déploiement
- Vous obtiendrez un lien de preview pour chaque Pull Request
