# Prompt Cursor pour reproduire le projet

Ce document est un prompt complet pour Cursor AI qui vous permet de reproduire exactement le prototype Pelico Supply en copiant-collant ce contenu.

## PROMPT CURSOR - Reproduction du Prototype Pelico Supply

## Contexte
Je veux reproduire exactement le prototype Pelico Supply. Voici toutes les informations nécessaires pour créer le projet complet.

## 📋 Prérequis
- Node.js 18+ et npm installés
- Git installé (optionnel, pour cloner le dépôt)

## 🚀 Méthode Rapide (Recommandée)

Si vous avez accès au dépôt Git, clonez-le :
```bash
git clone https://pelilab.pelico.tech/jeremie.chaine/filters-december2025.git pelico-supply-prototype
cd pelico-supply-prototype
npm install
npm run dev
```

## 🔨 Étape 2 : Création manuelle du projet (Alternative)

Si vous préférez créer le projet depuis zéro, suivez ces étapes :

### 2.1 Initialiser le projet

```bash
npm create vite@latest pelico-supply-prototype -- --template react-ts
cd pelico-supply-prototype
npm install
```

### 2.2 Installer toutes les dépendances

```bash
npm install @mui/base@^5.0.0-beta.70 @radix-ui/react-accordion@^1.2.12 @radix-ui/react-checkbox@^1.3.3 @radix-ui/react-collapsible@^1.1.12 @radix-ui/react-dialog@^1.1.15 @radix-ui/react-dropdown-menu@^2.1.16 @radix-ui/react-label@^2.1.8 @radix-ui/react-navigation-menu@^1.2.14 @radix-ui/react-popover@^1.1.15 @radix-ui/react-scroll-area@^1.2.10 @radix-ui/react-select@^2.2.6 @radix-ui/react-separator@^1.1.8 @radix-ui/react-slot@^1.2.4 @radix-ui/react-tabs@^1.1.13 @radix-ui/react-tooltip@^1.2.8 @tanstack/react-table@^8.21.3 class-variance-authority@^0.7.1 clsx@^2.1.1 cmdk@^1.1.1 date-fns@^4.1.0 lucide-react@^0.561.0 next-themes@^0.4.6 react@^19.2.0 react-day-picker@^9.12.0 react-dom@^19.2.0 tailwind-merge@^3.4.0 tailwindcss-animate@^1.0.7
```

```bash
npm install -D @eslint/js@^9.39.1 @types/node@^24.10.1 @types/react@^19.2.5 @types/react-dom@^19.2.3 @vitejs/plugin-react@^5.1.1 autoprefixer@^10.4.23 eslint@^9.39.1 eslint-plugin-react-hooks@^7.0.1 eslint-plugin-react-refresh@^0.4.24 globals@^16.5.0 postcss@^8.5.6 tailwindcss@^3.4.1 typescript@~5.9.3 typescript-eslint@^8.46.4 vite@^7.2.4
```

### 2.3 Initialiser shadcn/ui

```bash
npx shadcn@latest init
```

Répondez aux questions :
- Style: `new-york`
- Base color: `neutral`
- CSS variables: `yes`
- Use React Server Components: `no`

### 2.4 Installer les composants shadcn/ui

```bash
npx shadcn@latest add accordion badge button calendar checkbox collapsible command dialog dropdown-menu input label popover scroll-area select separator sheet tabs textarea tooltip
```

## 📁 Étape 3 : Structure des fichiers

Créez la structure de dossiers suivante :

```
pelico-supply-prototype/
├── public/
│   └── images/
│       ├── Pelico-long-logo.svg
│       └── Pelico-small-logo.svg
├── src/
│   ├── components/
│   │   ├── ui/          # Composants shadcn/ui (déjà installés)
│   │   ├── ColumnFilterModal.tsx
│   │   ├── ColumnHeader.tsx
│   │   ├── PurchaseOrderBookPage.tsx
│   │   ├── ScopeDropdown.tsx
│   │   ├── ScopeModal.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SortingAndFiltersPopover.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   ├── lib/
│   │   ├── columns.tsx
│   │   ├── filterDefinitions.ts
│   │   ├── mockData.ts
│   │   ├── scopes.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── tokens.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── components.json
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## 📝 Étape 4 : Fichiers de configuration

### 4.1 `package.json`

```json
{
  "name": "pelico-supply-prototype",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@mui/base": "^5.0.0-beta.70",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.561.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.0",
    "react-day-picker": "^9.12.0",
    "react-dom": "^19.2.0",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.1",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.4"
  }
}
```

### 4.2 `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 4.3 `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
```

### 4.4 `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4.5 `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}
```

### 4.6 `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4.7 `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 4.8 `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 4.9 `eslint.config.js`

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
```

### 4.10 `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>pelico-supply-prototype</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 📄 Étape 5 : Fichiers source

**IMPORTANT :** Les fichiers source complets sont trop volumineux pour être inclus ici. Vous devez :

1. **Option A (Recommandée) :** Cloner le dépôt Git :
   ```bash
   git clone https://pelilab.pelico.tech/jeremie.chaine/filters-december2025.git
   ```

2. **Option B :** Copier manuellement tous les fichiers depuis le dépôt GitLab

### Liste des fichiers source à copier :

**Composants principaux :**
- `src/components/PurchaseOrderBookPage.tsx`
- `src/components/Sidebar.tsx`
- `src/components/SortingAndFiltersPopover.tsx`
- `src/components/ColumnHeader.tsx`
- `src/components/ColumnFilterModal.tsx`
- `src/components/ScopeDropdown.tsx`
- `src/components/ScopeModal.tsx`
- `src/components/ThemeProvider.tsx`
- `src/components/ThemeToggle.tsx`

**Composants UI personnalisés :**
- `src/components/ui/filter-chip.tsx`
- `src/components/ui/sort-chip.tsx`
- `src/components/ui/input-with-icon.tsx`
- `src/components/ui/checkbox-with-indeterminate.tsx`

**Bibliothèques :**
- `src/lib/columns.tsx`
- `src/lib/mockData.ts`
- `src/lib/filterDefinitions.ts`
- `src/lib/scopes.ts`
- `src/lib/utils.ts`

**Styles :**
- `src/index.css` (avec les variables CSS shadcn/ui)
- `src/styles/tokens.ts`

**Point d'entrée :**
- `src/main.tsx`
- `src/App.tsx`
- `src/App.css`

## 🎨 Étape 6 : CSS Variables (src/index.css)

Le fichier `src/index.css` doit contenir les variables CSS shadcn/ui. Voici la structure minimale :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 221 87% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 221 87% 53%;
    --primary-foreground: 0 0% 100%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

## 🖼️ Étape 7 : Images

Placez les logos Pelico dans `public/images/` :
- `Pelico-long-logo.svg` (pour la sidebar)
- `Pelico-small-logo.svg` (pour le header)

## ✅ Étape 8 : Vérification

1. Vérifiez que tous les fichiers sont en place
2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
3. Ouvrez `http://localhost:5173` dans votre navigateur
4. Vérifiez que l'application se charge correctement

## 🐛 Dépannage

### Erreur "Cannot find module '@/...'"
- Vérifiez que `tsconfig.json` et `vite.config.ts` ont les bons alias
- Redémarrez le serveur de développement

### Erreur de styles Tailwind
- Vérifiez que `tailwind.config.js` est correct
- Vérifiez que `postcss.config.js` est présent
- Vérifiez que `src/index.css` contient les directives `@tailwind`

### Composants shadcn/ui manquants
- Réinstallez les composants manquants avec `npx shadcn@latest add [component-name]`

## 📚 Ressources

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Table Documentation](https://tanstack.com/table/latest)

## 📝 Notes importantes

- Le projet utilise **React 19** et **TypeScript**
- Les composants UI sont basés sur **shadcn/ui** (Radix UI)
- Le thème sombre est géré par **next-themes**
- Les données sont mockées dans `src/lib/mockData.ts`
- Les scopes sont sauvegardés dans le **localStorage**

---

## 📦 Comment utiliser ce prompt dans Cursor

1. **Copiez tout le contenu de ce document**
2. **Collez-le dans Cursor AI** comme prompt
3. **Cursor créera automatiquement** tous les fichiers nécessaires
4. **Ou suivez les instructions** étape par étape pour créer manuellement

## 🎯 Résultat attendu

Après avoir suivi ce prompt, vous devriez avoir :
- ✅ Un projet React + Vite + TypeScript fonctionnel
- ✅ Tous les composants UI (shadcn/ui)
- ✅ La table TanStack avec tri, filtres, pagination
- ✅ Le système de scopes avec localStorage
- ✅ Le thème sombre/clair
- ✅ Tous les styles et configurations

**Pour obtenir tous les fichiers source complets, clonez le dépôt Git :**
```bash
git clone https://pelilab.pelico.tech/jeremie.chaine/filters-december2025.git
```

