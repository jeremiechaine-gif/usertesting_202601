# Guide d'utilisation des images dans le projet

## Structure des dossiers

```
pelico-supply-prototype/
├── public/
│   └── images/          # Images statiques (copiées telles quelles)
└── src/
    └── assets/
        └── images/      # Images importées (optimisées par Vite)
```

## Méthode 1 : Images dans `public/images/` (Recommandé pour les images statiques)

**Avantages :**
- Accessibles via URL absolue
- Pas besoin d'importer
- Idéal pour les logos, icônes, images de référence

**Utilisation :**
```tsx
// Dans un composant React
<img src="/images/logo.png" alt="Logo" />

// Ou avec Tailwind
<div className="bg-[url('/images/background.jpg')]">...</div>
```

**Exemple concret :**
```tsx
// Pour le logo Pelico dans le header
<div className="w-6 h-6">
  <img src="/images/pelico-logo.svg" alt="Pelico" />
</div>
```

## Méthode 2 : Images dans `src/assets/images/` (Recommandé pour les images optimisées)

**Avantages :**
- Optimisation automatique par Vite
- Hachage de nom pour le cache
- Vérification de l'existence à la compilation

**Utilisation :**
```tsx
// Importez l'image
import logoImage from '@/assets/images/logo.png';
import backgroundImage from '@/assets/images/background.jpg';

// Utilisez-la dans le composant
<img src={logoImage} alt="Logo" />
<div style={{ backgroundImage: `url(${backgroundImage})` }}>...</div>
```

**Exemple concret :**
```tsx
import pelicoLogo from '@/assets/images/pelico-logo.svg';

function Header() {
  return (
    <div className="flex items-center gap-2">
      <img src={pelicoLogo} alt="Pelico" className="w-6 h-6" />
      <h1>Supply</h1>
    </div>
  );
}
```

## Formats supportés

- **Images raster :** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- **Images vectorielles :** `.svg`
- **Icônes :** `.svg` (recommandé)

## Bonnes pratiques

1. **Pour les logos et icônes :** Utilisez `public/images/` avec des SVG
2. **Pour les images de contenu :** Utilisez `src/assets/images/` pour l'optimisation
3. **Nommage :** Utilisez des noms descriptifs en kebab-case : `pelico-logo.svg`, `supply-background.jpg`
4. **Taille :** Optimisez les images avant de les ajouter (utilisez des outils comme TinyPNG, ImageOptim)

## Exemple d'intégration dans le projet

### Ajouter le logo Pelico dans le header

1. Placez `pelico-logo.svg` dans `public/images/`
2. Modifiez `PurchaseOrderBookPage.tsx` :

```tsx
// Remplacer le placeholder actuel
<div className="w-6 h-6 rounded bg-[#31C7AD] flex items-center justify-center">
  <span className="text-white text-xs font-bold">P</span>
</div>

// Par
<img src="/images/pelico-logo.svg" alt="Pelico" className="w-6 h-6" />
```

## Commandes utiles

```bash
# Créer les dossiers (déjà fait)
mkdir -p public/images src/assets/images

# Ajouter une image dans public
cp /chemin/vers/image.png public/images/

# Ajouter une image dans assets
cp /chemin/vers/image.png src/assets/images/
```







