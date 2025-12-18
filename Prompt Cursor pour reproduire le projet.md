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
npm install @mui/base@^5.0.0-beta.70 @radix-ui/react-accordion@^1.2.12 @radix-ui/react-checkbox@^1.3.3 @radix-ui/react-collapsible@^1.1.12 @radix-ui/react-dialog@^1.1.15 @radix-ui/react-dropdown-menu@^2.1.16 @radix-ui/react-label@^2.1.8 @radix-ui/react-navigation-menu@^1.2.14 @radix-ui/react-popover@^1.1.15 @radix-ui/react-scroll-area@^1.2.10 @radix-ui/react-select@^2.2.6 @radix-ui/react-separator@^1.1.8 @radix-ui/react-slot@^1.2.4 @radix-ui/react-tabs@^1.1.13 @radix-ui/react-tooltip@^1.2.8 @tanstack/react-table@^8.21.3 class-variance-authority@^0.7.1 clsx@^2.1.1 cmdk@^1.1.1 date-fns@^4.1.0 lucide-react@^0.561.0 next-themes@^0.4.6 react@^19.2.0 react-day-picker@^9.12.0 react-dom@^19.2.0 tailwind-merge@^3.4.0 tailwindcss-animate@^1.0.7 zod@^3.24.1
```

```bash
npm install -D @eslint/js@^9.39.1 @types/node@^24.10.1 @types/react@^19.2.5 @types/react-dom@^19.2.3 @vitejs/plugin-react@^5.1.1 autoprefixer@^10.4.23 eslint@^9.39.1 eslint-plugin-react-hooks@^7.0.1 eslint-plugin-react-refresh@^0.4.24 globals@^16.5.0 postcss@^8.5.6 tailwindcss@^3.4.1 typescript@~5.9.3 typescript-eslint@^8.46.4 vite@^7.2.4 vitest@^2.1.8 @vitest/coverage-v8@^2.1.8 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 jsdom@^25.0.1 rollup-plugin-visualizer@^5.12.0
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
    "preview": "vite preview",
    "test": "vitest",
    "analyze": "npm run build && npx vite-bundle-visualizer"
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
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'tanstack-table': ['@tanstack/react-table'],
          'lucide-icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
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

### 4.10 `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 4.11 `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
```

### 4.12 `index.html`

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
- `src/components/ScopeAndRoutinesPage.tsx` (page de gestion)
- `src/components/RoutineDropdown.tsx`
- `src/components/RoutineModal.tsx`
- `src/components/GroupByDropdown.tsx`
- `src/components/PlanDropdown.tsx`
- `src/components/ThemeProvider.tsx`
- `src/components/ThemeToggle.tsx`

**Composants de tri et filtres (modulaires) :**
- `src/components/sorting-filters/SortingSection.tsx`
- `src/components/sorting-filters/SortRow.tsx`
- `src/components/sorting-filters/FiltersSection.tsx`
- `src/components/sorting-filters/FilterRow.tsx`
- `src/components/sorting-filters/AddFilterView.tsx`
- `src/components/sorting-filters/hooks/useSortingFiltersState.ts`
- `src/components/sorting-filters/stateAdapters.ts`
- `src/components/sorting-filters/utils.ts`

**Composants UI personnalisés :**
- `src/components/ui/filter-chip.tsx`
- `src/components/ui/sort-chip.tsx`
- `src/components/ui/input-with-icon.tsx`
- `src/components/ui/checkbox-with-indeterminate.tsx`

**Bibliothèques :**
- `src/lib/columns.tsx` (avec fonction de filtrage personnalisée)
- `src/lib/mockData.ts`
- `src/lib/filterDefinitions.ts`
- `src/lib/scopes.ts` (CRUD, partage, duplication)
- `src/lib/routines.ts` (CRUD, partage, duplication)
- `src/lib/utils.ts`

**Contextes :**
- `src/contexts/ScopeContext.tsx` (gestion globale des scopes)

**Tests :**
- `src/lib/__tests__/scopes.test.ts`
- `src/lib/__tests__/routines.test.ts`
- `src/lib/__tests__/customFilterFn.test.ts`
- `src/lib/__tests__/multipleFilters.test.ts`
- `src/components/sorting-filters/__tests__/stateAdapters.test.ts`
- `src/components/sorting-filters/__tests__/utils.test.ts`
- `vitest.config.ts`
- `src/test/setup.ts`

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
- Les scopes et routines sont sauvegardés dans le **localStorage**

---

## 🎯 Règles Business et de Fonctionnement

### 📋 Concepts : Scopes et Routines

#### Scopes
- Un **Scope** est un ensemble de filtres qui pré-filtre la table
- Les filtres du scope sont **toujours appliqués** à la table mais **jamais visibles** dans l'UI
- Les scopes agissent comme un pré-filtre : ils définissent l'ensemble des données disponibles pour l'utilisateur
- Les scopes peuvent être créés, modifiés, supprimés et partagés
- Les scopes sont sauvegardés dans le localStorage

#### Routines
- Une **Routine** est un ensemble de tri, filtres, visibilité de colonnes, ordre de colonnes, groupement et taille de page
- Les routines peuvent être de deux types :
  - **Scope-aware** : La routine s'adapte au scope actif (les filtres de la routine sont combinés avec les filtres du scope)
  - **Scope-fixed** : La routine est liée à un scope spécifique et ne fonctionne qu'avec ce scope
- Les routines sont des **sous-ensembles** des scopes : elles ne peuvent pas filtrer au-delà de ce que le scope permet
- Les routines peuvent être créées, modifiées, supprimées et partagées
- Les routines sont sauvegardées dans le localStorage

### 🔍 Règles de Filtrage

#### Logique de Filtrage
1. **Filtres multiples sur différentes colonnes** : Logique **AND**
   - Exemple : `Type = "A"` ET `Status = "Active"` → Les deux conditions doivent être vraies

2. **Filtres avec plusieurs valeurs sur une même colonne** : Logique **OR**
   - Exemple : `Type = ["A", "B"]` → La valeur doit être "A" OU "B"

3. **Combinaison Scope + Routine** :
   - Les filtres du scope sont appliqués en premier (pré-filtre)
   - Les filtres de la routine sont appliqués ensuite sur le résultat du scope
   - Si une routine ajoute un filtre sur une colonne déjà filtrée par le scope, le filtre de la routine agit comme un sous-ensemble du filtre du scope

#### Visibilité des Filtres
- **Filtres du scope** : 
  - ✅ Appliqués à la table (invisibles mais actifs)
  - ❌ Pas d'indicateur visuel dans l'en-tête de colonne
  - ❌ Pas d'affichage dans le modal "Sorting & Filters"
  - ❌ Pas de comptage dans le badge "Sorting and filters"
  
- **Filtres utilisateur/routine** :
  - ✅ Appliqués à la table
  - ✅ Indicateur visuel dans l'en-tête de colonne (icône de filtre, badge rouge)
  - ✅ Affichage dans le modal "Sorting & Filters"
  - ✅ Comptage dans le badge "Sorting and filters"

### 🎨 Règles UI/UX

#### Highlight Orange pour les Chips Non Inclus dans la Routine
- Quand une routine est sélectionnée ET qu'il y a des changements non sauvegardés (`hasUnsavedChanges` = true) :
  - Les chips de tri et filtre qui **ne sont pas dans la routine** sont highlightés en orange (`#ff9800`)
  - Un chip est considéré comme "non inclus" s'il :
    - N'existe pas dans la routine, OU
    - Existe dans la routine mais avec des valeurs différentes
  - Le highlight orange s'applique :
    - Sur chaque chip individuel (bordure et fond orange léger)
    - Sur la ligne complète du chip dans le modal

#### Bouton Segmenté Orange
- Le bouton segmenté "Update routine" / "Create routine" utilise la couleur orange (`#ff9800`)
- Le bouton "Apply" reste bleu (`#2063F0`)
- Le bouton segmenté est toujours orange, même sans changements non sauvegardés

#### Routine Dropdown Highlight
- Quand une routine est sélectionnée ET qu'il y a des changements non sauvegardés :
  - Le bouton du dropdown est highlighté en orange (bordure et fond orange léger)
  - La routine sélectionnée dans la liste est highlightée en orange
  - Les actions "Update routine" et "Save as new routine" apparaissent directement sous la routine sélectionnée dans le dropdown, également en orange

#### Badge de Comptage
- Le badge "Sorting and filters" compte uniquement :
  - Les tris actifs
  - Les filtres utilisateur/routine (pas les filtres du scope)
- Le badge ne s'affiche pas si le total est 0

#### Modal "Sorting & Filters"
- Affiche "Active Routine: None" quand aucune routine n'est sélectionnée, même si un scope est actif
- Affiche le nom de la routine active (en lecture seule) quand une routine est sélectionnée
- Les filtres du scope ne sont jamais affichés dans la section "CURRENT FILTERS"
- Les boutons du footer sont (de gauche à droite) :
  1. "Cancel"
  2. "Clear All"
  3. Bouton segmenté (orange) : "Update routine" ou "Create routine" selon le contexte
  4. Bouton "Apply" (bleu)

### 🔄 Règles de Synchronisation

#### Synchronisation Table ↔ Modal
- Les changements de tri/filtre depuis les **en-têtes de colonnes** sont immédiatement synchronisés avec le modal "Sorting & Filters"
- Les changements depuis le **modal** sont immédiatement synchronisés avec la table
- Le modal et la table partagent une **source de vérité unique** : l'état TanStack Table

#### Synchronisation Scope ↔ Routine
- Quand un scope est sélectionné :
  - Les filtres du scope sont appliqués automatiquement à la table
  - Si une routine scope-aware est active, ses filtres sont combinés avec les filtres du scope
  - Si une routine scope-fixed est active et liée à un autre scope, elle est désactivée

### 💾 Règles de Persistance

#### Sauvegarde dans localStorage
- **Scopes** : Sauvegardés avec leurs filtres, nom, description, et métadonnées
- **Routines** : Sauvegardées avec :
  - Tri (sorting)
  - Filtres (filters)
  - Visibilité des colonnes (columnVisibility)
  - Ordre des colonnes (columnOrder)
  - Groupement (groupBy)
  - Taille de page (pageSize)
  - Mode scope (scopeMode: 'scope-aware' | 'scope-fixed')
  - Scope lié (linkedScopeId) si scope-fixed

#### Détection des Changements Non Sauvegardés
- `hasUnsavedChanges` est calculé en comparant :
  - Le tri actuel avec le tri de la routine
  - Les filtres utilisateur/routine actuels avec les filtres de la routine
  - Le groupement actuel avec le groupement de la routine
- Les filtres du scope ne sont pas pris en compte dans cette comparaison

### 🎯 Comportements Spécifiques

#### Scope Actif Sans Routine
- Les filtres du scope sont appliqués à la table
- Aucun indicateur visuel n'est affiché
- Le badge "Sorting and filters" ne s'affiche pas (0 filtres utilisateur)
- Le modal affiche "Active Routine: None"

#### Scope + Routine Actifs
- Les filtres du scope sont appliqués mais invisibles
- Les filtres de la routine sont appliqués et visibles
- Le badge compte uniquement les filtres de la routine
- Le modal affiche le nom de la routine active

#### Changement de Scope avec Routine Active
- Si la routine est **scope-aware** :
  - La routine reste active
  - Les filtres de la routine sont combinés avec les nouveaux filtres du scope
- Si la routine est **scope-fixed** :
  - Si le nouveau scope correspond au scope lié : la routine reste active
  - Si le nouveau scope est différent : la routine est désactivée

### 🧪 Tests et Qualité

#### Tests Unitaires
- Tests pour les fonctions de gestion des scopes (`src/lib/__tests__/scopes.test.ts`)
- Tests pour les fonctions de gestion des routines (`src/lib/__tests__/routines.test.ts`)
- Tests pour les adaptateurs d'état (`src/components/sorting-filters/__tests__/stateAdapters.test.ts`)
- Tests pour les utilitaires (`src/components/sorting-filters/__tests__/utils.test.ts`)
- Tests pour la fonction de filtrage personnalisée (`src/lib/__tests__/customFilterFn.test.ts`)
- Tests d'intégration pour les filtres multiples (`src/lib/__tests__/multipleFilters.test.ts`)

#### Performance
- Code splitting avec `React.lazy` et `Suspense` pour les modaux lourds
- Mémoïsation avec `React.memo`, `useMemo`, `useCallback` pour réduire les re-renders
- Lazy loading des composants : `SortingAndFiltersPopover`, `ColumnFilterModal`, `RoutineModal`

#### Bundle Size
- Analyse du bundle avec `rollup-plugin-visualizer`
- Chunks manuels pour les grandes dépendances (react-vendor, radix-ui, tanstack-table, lucide-icons)

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
- ✅ Le système de scopes avec localStorage (filtres invisibles mais actifs)
- ✅ Le système de routines avec localStorage (scope-aware et scope-fixed)
- ✅ Page de gestion des scopes et routines (CRUD, partage)
- ✅ Synchronisation bidirectionnelle table ↔ modal
- ✅ Highlight orange pour les chips non inclus dans la routine
- ✅ Bouton segmenté orange pour Update/Create routine
- ✅ Masquage des indicateurs visuels pour les filtres du scope
- ✅ Logique de filtrage AND/OR correcte
- ✅ Tests unitaires et d'intégration
- ✅ Code splitting et lazy loading pour la performance
- ✅ Le thème sombre/clair
- ✅ Tous les styles et configurations

**Pour obtenir tous les fichiers source complets, clonez le dépôt Git :**
```bash
git clone https://pelilab.pelico.tech/jeremie.chaine/filters-december2025.git
```

