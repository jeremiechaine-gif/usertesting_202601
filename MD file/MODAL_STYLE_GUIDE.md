# Modal Design System - Style Guide

Ce document définit le système de design pour les modales dans l'application Pelico Supply Prototype.

## 🎨 Vue d'ensemble

Les modales suivent un design premium et cohérent avec des gradients teal/blue, des ombres subtiles, et une hiérarchie typographique claire.

## 📐 Structure de base

### DialogContent
```tsx
<DialogContent className="[size-class] p-0 overflow-hidden">
  {/* Hero Header */}
  {/* Content */}
  {/* Footer */}
</DialogContent>
```

**Tailles recommandées:**
- Petite: `sm:max-w-md` (448px)
- Moyenne: `max-w-2xl` (672px)
- Grande: `max-w-4xl` (896px)
- Très grande: `max-w-5xl` (1024px)

**Hauteur:**
- Fixe pour scroll: `h-[85vh]` ou `h-[90vh]`
- Variable: utiliser `max-h-[80vh]` avec `flex flex-col`

## 🎭 Hero Header (Obligatoire)

### Structure HTML
```tsx
{/* Hero Header with Gradient */}
<div className="relative shrink-0">
  <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
  <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
        <IconComponent className="h-5 w-5 text-white" />
      </div>
      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
        Modal Title
      </DialogTitle>
    </div>
    <DialogDescription className="text-sm text-muted-foreground">
      Modal description or subtitle
    </DialogDescription>
  </DialogHeader>
</div>
```

### Classes CSS
- **Container:** `relative shrink-0`
- **Gradient background:** `absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent`
- **Header:** `relative px-8 pt-8 pb-6 border-b border-border/50`
- **Icon container:** `p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md`
- **Icon:** `h-5 w-5 text-white`
- **Title:** `text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text`
- **Description:** `text-sm text-muted-foreground`

### Icônes recommandées par contexte
- **Équipes:** `Users2`, `Building2`, `Sparkles`
- **Scopes:** `Target`, `Layers`
- **Routines:** `Zap`, `FolderKanban`
- **Utilisateurs:** `User`, `UserPlus`
- **Général:** `Sparkles`, `Settings`

## 📝 Content Area

### Structure de base
```tsx
<div className="px-8 py-6 space-y-5">
  {/* Form fields or content */}
</div>
```

### Pour contenu scrollable
```tsx
<ScrollArea className="flex-1 min-h-0">
  <div className="p-8 space-y-6">
    {/* Scrollable content */}
  </div>
</ScrollArea>
```

### Classes CSS
- **Container:** `px-8 py-6 space-y-5` (fixe) ou `p-8 space-y-6` (dans ScrollArea)
- **Spacing vertical:** `space-y-5` (form) ou `space-y-6` (sections)

## 📋 Form Fields

### Input Standard
```tsx
<div className="space-y-2">
  <Label htmlFor="field-id" className="text-sm font-semibold">
    Field Label <span className="text-destructive">*</span>
  </Label>
  <Input
    id="field-id"
    placeholder="Enter value..."
    className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
  />
</div>
```

### Textarea
```tsx
<div className="space-y-2">
  <Label htmlFor="field-id" className="text-sm font-semibold">
    Field Label <span className="text-xs text-muted-foreground font-normal">(optional)</span>
  </Label>
  <Textarea
    id="field-id"
    placeholder="Enter description..."
    rows={3}
    className="border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20 resize-none"
  />
</div>
```

### Select
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[200px] h-9 border-border/60 hover:border-[#31C7AD]/30 transition-colors">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Classes CSS
- **Label:** `text-sm font-semibold`
- **Required indicator:** `text-destructive` (*)
- **Optional indicator:** `text-xs text-muted-foreground font-normal`
- **Input:** `h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20`
- **Textarea:** `border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20 resize-none`
- **Select:** `h-9 border-border/60 hover:border-[#31C7AD]/30 transition-colors`

## 🎯 Section Headers (dans content)

### Structure
```tsx
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-gradient-to-br from-[COLOR]/20 to-[COLOR]/10 border border-[COLOR]/20">
    <Icon className="h-4 w-4 text-[COLOR]" />
  </div>
  <div>
    <h3 className="text-lg font-semibold">Section Title</h3>
    <p className="text-xs text-muted-foreground">Section subtitle</p>
  </div>
</div>
```

### Couleurs par thème
- **Teal (Scopes):** `from-[#31C7AD]/20 to-[#31C7AD]/10 border-[#31C7AD]/20 text-[#31C7AD]`
- **Blue (Routines):** `from-[#2063F0]/20 to-[#2063F0]/10 border-[#2063F0]/20 text-[#2063F0]`

## 📦 Cards & List Items

### Card avec hover
```tsx
<div className={cn(
  'group relative flex items-center justify-between p-4 rounded-xl border transition-all',
  'hover:shadow-md hover:border-[#31C7AD]/30',
  'bg-background border-border/60 hover:bg-[#31C7AD]/5'
)}>
  <div className="flex items-center gap-3 flex-1 min-w-0">
    <div className="p-2 rounded-lg shrink-0 bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 group-hover:from-[#31C7AD]/30 group-hover:to-[#31C7AD]/20 transition-colors">
      <Icon className="h-4 w-4 text-[#31C7AD]" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="font-semibold text-sm">Card Title</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">
        Card description
      </p>
    </div>
  </div>
  <div className="flex items-center gap-1 shrink-0 ml-3">
    {/* Action buttons */}
  </div>
</div>
```

### Classes CSS
- **Container:** `p-4 rounded-xl border transition-all hover:shadow-md`
- **Hover colors teal:** `hover:border-[#31C7AD]/30 hover:bg-[#31C7AD]/5`
- **Hover colors blue:** `hover:border-[#2063F0]/30 hover:bg-[#2063F0]/5`
- **Icon container:** `p-2 rounded-lg shrink-0 bg-gradient-to-br group-hover:from-[COLOR]/30`
- **Title:** `font-semibold text-sm`
- **Description:** `text-xs text-muted-foreground truncate`

## 🚫 Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
  <div className="p-3 rounded-full bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 mb-3">
    <Icon className="h-6 w-6 text-[#31C7AD]/60" />
  </div>
  <p className="text-sm font-medium text-muted-foreground mb-1">No items found</p>
  <p className="text-xs text-muted-foreground/70">Add your first item to get started</p>
</div>
```

### Classes CSS
- **Container:** `py-12 rounded-xl border-2 border-dashed border-border/60 bg-muted/20`
- **Icon container:** `p-3 rounded-full bg-gradient-to-br from-[COLOR]/20 to-[COLOR]/10`
- **Icon:** `h-6 w-6 text-[COLOR]/60`
- **Title:** `text-sm font-medium text-muted-foreground mb-1`
- **Description:** `text-xs text-muted-foreground/70`

## 🎬 Footer / Dialog Actions

### Structure de base
```tsx
<DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
  <Button onClick={onSave}>
    Save
  </Button>
</DialogFooter>
```

### Bouton principal avec gradient
```tsx
<Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md">
  Action
</Button>
```

### Classes CSS
- **Footer:** `px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2`
- **Cancel button:** `variant="outline" border-border/60 hover:bg-muted`
- **Primary button:** `bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md`
- **Disabled state:** `disabled:opacity-50 disabled:cursor-not-allowed`

## 🎨 Couleurs du Design System

### Couleurs principales
```css
--teal-primary: #31C7AD
--teal-hover: #2ab89a
--blue-primary: #2063F0
--blue-hover: #1a54d8
```

### Opacités recommandées
- **Backgrounds:** `/10`, `/20`, `/30`, `/50`
- **Borders:** `/20`, `/30`, `/40`, `/50`, `/60`
- **Hover effects:** `/5`, `/10`

### Gradients
- **Header background:** `from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent`
- **Icon container:** `from-[#2063F0] to-[#31C7AD]`
- **Button:** `from-[#2063F0] to-[#31C7AD]`
- **Separator:** `from-transparent via-border to-transparent`

## 🔘 Buttons

### Styles par contexte

#### Primary Action (Gradient)
```tsx
<Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md">
  Primary Action
</Button>
```

#### Secondary Action (Teal)
```tsx
<Button className="bg-[#31C7AD] hover:bg-[#2ab89a] text-white">
  Teal Action
</Button>
```

#### Tertiary Action (Blue)
```tsx
<Button className="bg-[#2063F0] hover:bg-[#1a54d8] text-white">
  Blue Action
</Button>
```

#### Outline avec hover coloré
```tsx
<Button variant="outline" className="border-border/60 hover:border-[#31C7AD] hover:bg-[#31C7AD]/5 hover:text-[#31C7AD] transition-all">
  Outline Action
</Button>
```

#### Small button (height: 36px)
```tsx
<Button size="sm" className="h-9">
  Small Action
</Button>
```

## ✨ Transitions & Animations

### Classes de transition
```css
transition-all          /* Pour tout changement */
transition-colors       /* Pour couleurs uniquement */
duration-200           /* 200ms (défaut) */
duration-300           /* 300ms (smooth) */
ease-in-out            /* Easing naturel */
```

### Hover states
```tsx
hover:shadow-md
hover:shadow-lg
hover:scale-105
group-hover:from-[COLOR]/30
```

## 📏 Spacing

### Padding
- **Modal sides:** `px-8`
- **Modal top/bottom:** `pt-8 pb-6` (header), `py-6` (content), `py-5` (footer)
- **Cards:** `p-4`
- **Icon containers:** `p-2` (small), `p-2.5` (medium), `p-3` (large)

### Gap
- **Between elements:** `gap-2`, `gap-3`
- **Between sections:** `space-y-5` (forms), `space-y-6` (sections), `space-y-8` (large)

### Border Radius
- **Modales:** `rounded-xl`
- **Cards:** `rounded-xl`
- **Buttons:** `rounded-lg`
- **Icons containers:** `rounded-lg`
- **Empty states:** `rounded-xl`

## 📱 Responsive

### Breakpoints
```tsx
sm:max-w-md    /* ≥640px: 448px */
md:max-w-2xl   /* ≥768px: 672px */
lg:max-w-4xl   /* ≥1024px: 896px */
```

### Grid layouts
```tsx
grid grid-cols-1 md:grid-cols-2 gap-4
```

## ✅ Checklist d'implémentation

Pour créer une nouvelle modale en suivant ce style:

- [ ] DialogContent avec `p-0 overflow-hidden`
- [ ] Hero Header avec gradient background
- [ ] Icon container avec gradient teal/blue
- [ ] DialogTitle avec gradient text
- [ ] DialogDescription avec bon spacing
- [ ] Content area avec `px-8 py-6 space-y-5`
- [ ] Form fields avec labels font-semibold
- [ ] Inputs avec focus:border-[#2063F0]
- [ ] Buttons avec gradients appropriés
- [ ] Footer avec bg-muted/20 et border-t
- [ ] Transitions sur tous les éléments interactifs
- [ ] Empty states si applicable
- [ ] Disabled states si applicable
- [ ] ScrollArea si contenu long (avec min-h-0)

## 📝 Exemple complet

Voir les fichiers de référence:
- `/src/components/UserScopesRoutinesModal.tsx` - Modal complexe avec sections
- `/src/components/UsersPage.tsx` (TeamModal) - Modal simple de formulaire

## 🎯 Cohérence visuelle

### Règles d'or
1. **Toujours** utiliser le Hero Header avec gradient
2. **Toujours** inclure un icon container avec gradient
3. **Toujours** utiliser px-8 pour les côtés
4. **Toujours** ajouter des transitions
5. **Toujours** utiliser les couleurs du design system
6. **Jamais** utiliser de couleurs hardcodées hors du système
7. **Jamais** oublier les states disabled/hover
8. **Jamais** mélanger différents styles de spacing

### Couleurs par fonctionnalité
- **Scopes:** Teal (#31C7AD) - cible, data perimeter
- **Routines:** Blue (#2063F0) - standardisation, workflows
- **Teams:** Gradient Teal→Blue - collaboration
- **Users:** Blue (#2063F0) - individuel
- **Actions principales:** Gradient Blue→Teal

---

**Version:** 1.0.0  
**Date:** Décembre 2025  
**Maintenu par:** Pelico Design Team






