# UI Style Guide - Pelico Supply Prototype

**Comprehensive design system and component style reference**

This document consolidates all UI styles, component patterns, and design tokens used throughout the Pelico Supply Prototype application. Use this as the single source of truth for implementing consistent UI components.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Colors](#colors)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Components](#components)
   - [Buttons](#buttons)
   - [Form Fields](#form-fields)
   - [Modals](#modals)
   - [Tables](#tables)
   - [Cards](#cards)
   - [Badges & Chips](#badges--chips)
   - [Navigation](#navigation)
   - [Empty States](#empty-states)
   - [Loading States](#loading-states)
   - [Error States](#error-states)
6. [Layout Patterns](#layout-patterns)
7. [Animation & Transitions](#animation--transitions)
8. [Accessibility](#accessibility)

---

## Design Tokens

Design tokens are defined in `src/styles/tokens.ts` and should be referenced via Tailwind CSS classes or CSS variables.

### Color Tokens

```typescript
// Primary Brand Colors
--teal-primary: #31C7AD      // Scopes, data, selection
--teal-hover: #2ab89a        // Teal hover state
--blue-primary: #2063F0       // Routines, actions, focus
--blue-hover: #1a54d8        // Blue hover state

// Semantic Colors
--destructive: #f44336        // Errors, delete actions
--success: #4caf50            // Success states
--warning: #FFEB3B           // Warning states
--info: #2196f3              // Info states

// Neutral Colors
--muted: #f5f5f5             // Muted backgrounds
--border: #e0e0e0             // Borders
--foreground: #1a1a1a         // Primary text
--muted-foreground: #666666  // Secondary text
```

### Typography Tokens

```typescript
// Font Sizes
text-xs: 0.75rem    // 12px
text-sm: 0.875rem   // 14px
text-base: 1rem     // 16px
text-lg: 1.125rem   // 18px
text-xl: 1.25rem    // 20px
text-2xl: 1.5rem    // 24px
text-3xl: 1.875rem  // 30px

// Font Weights
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700

// Line Heights
leading-tight: 1.25
leading-normal: 1.5
leading-relaxed: 1.75
```

### Spacing Tokens

```typescript
// Padding/Margin Scale
p-1: 0.25rem   // 4px
p-2: 0.5rem    // 8px
p-3: 0.75rem   // 12px
p-4: 1rem      // 16px
p-5: 1.25rem   // 20px
p-6: 1.5rem    // 24px
p-8: 2rem      // 32px

// Gap Scale
gap-1: 0.25rem
gap-2: 0.5rem
gap-3: 0.75rem
gap-4: 1rem
gap-5: 1.25rem
gap-6: 1.5rem
```

### Border Radius

```typescript
rounded-sm: 0.125rem   // 2px
rounded-md: 0.25rem     // 4px
rounded-lg: 0.5rem      // 8px
rounded-xl: 0.75rem     // 12px
rounded-full: 9999px
```

---

## Colors

### Primary Color Usage

#### Teal (#31C7AD)
**Used for:** Scopes, data-related elements, checkboxes, selection states, secondary actions

```tsx
// Background
<div className="bg-[#31C7AD]">Scope-related</div>

// Border
<div className="border-[#31C7AD]">Scope border</div>

// Text
<span className="text-[#31C7AD]">Scope text</span>

// Hover states
<button className="hover:bg-[#2ab89a]">Hover</button>
```

#### Blue (#2063F0)
**Used for:** Routines, primary actions, focus states, links

```tsx
// Background
<div className="bg-[#2063F0]">Routine-related</div>

// Border (focus)
<input className="focus:border-[#2063F0]" />

// Text
<span className="text-[#2063F0]">Routine text</span>

// Hover states
<button className="hover:bg-[#1a54d8]">Hover</button>
```

#### Gradient (Blue → Teal)
**Used for:** Primary action buttons, hero headers, icon containers

```tsx
// Button gradient
<Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a]">
  Primary Action
</Button>

// Header gradient background
<div className="bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent">
  Header content
</div>

// Icon container gradient
<div className="bg-gradient-to-br from-[#2063F0] to-[#31C7AD]">
  <Icon />
</div>
```

### Opacity Levels

```tsx
// Backgrounds
/10  // Very subtle (10% opacity)
/20  // Light background
/30  // Medium background
/50  // Semi-transparent
/60  // More opaque

// Borders
border-border/60     // Standard border
border-[#31C7AD]/30  // Colored border with opacity

// Hover effects
hover:bg-[#31C7AD]/5   // Subtle hover
hover:bg-[#31C7AD]/10  // Light hover
```

---

## Typography

### Headings

```tsx
// Modal/Page Title
<h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
  Page Title
</h1>

// Section Title
<h2 className="text-xl font-bold">Section Title</h2>

// Subsection Title
<h3 className="text-lg font-semibold">Subsection</h3>
```

### Body Text

```tsx
// Primary text
<p className="text-sm">Body text</p>

// Secondary/muted text
<p className="text-sm text-muted-foreground">Secondary text</p>

// Small text
<p className="text-xs text-muted-foreground">Small text</p>

// Description text
<p className="text-sm text-muted-foreground">Description</p>
```

### Labels

```tsx
// Form label (required)
<Label className="text-sm font-semibold">
  Field Name <span className="text-destructive">*</span>
</Label>

// Form label (optional)
<Label className="text-sm font-semibold">
  Field Name 
  <span className="text-xs text-muted-foreground font-normal ml-1">
    (optional)
  </span>
</Label>
```

---

## Spacing

### Modal Spacing

```tsx
// Modal sides
px-8  // 32px horizontal padding

// Modal content
py-6  // 24px vertical padding

// Modal header
pt-8 pb-6  // 32px top, 24px bottom

// Modal footer
py-5  // 20px vertical padding
```

### Component Spacing

```tsx
// Form fields vertical spacing
space-y-5  // 20px between fields

// Sections vertical spacing
space-y-6  // 24px between sections

// Cards padding
p-4  // 16px all sides

// Icon containers
p-2    // 8px (small)
p-2.5  // 10px (medium)
p-3    // 12px (large)
```

### Heights

```tsx
// Inputs
h-10  // 40px (standard)
h-9   // 36px (compact)

// Buttons
h-9   // 36px (standard)
h-8   // 32px (small)
h-10  // 40px (large)

// Selects
h-9   // 36px (standard)
h-10  // 40px (tall)
```

---

## Components

### Buttons

#### Button Variants

```tsx
// Primary Action (Gradient)
<Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md h-9">
  Primary Action
</Button>

// Secondary (Teal)
<Button className="bg-[#31C7AD] hover:bg-[#2ab89a] text-white h-9">
  Secondary Action
</Button>

// Tertiary (Blue)
<Button className="bg-[#2063F0] hover:bg-[#1a54d8] text-white h-9">
  Tertiary Action
</Button>

// Outline
<Button variant="outline" className="border-border/60 hover:bg-muted h-9">
  Outline Button
</Button>

// Ghost
<Button variant="ghost" className="hover:bg-accent h-9">
  Ghost Button
</Button>

// Destructive
<Button variant="destructive" className="h-9">
  Delete
</Button>
```

#### Button Sizes

```tsx
// Default
<Button size="default" className="h-9 px-4 py-2">
  Default
</Button>

// Small
<Button size="sm" className="h-8 px-3 text-xs">
  Small
</Button>

// Large
<Button size="lg" className="h-10 px-8">
  Large
</Button>

// Icon only
<Button size="icon" className="h-9 w-9">
  <Icon className="h-4 w-4" />
</Button>
```

#### Button States

```tsx
// Loading state
<Button disabled={isSubmitting} className="h-9">
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// Disabled state
<Button disabled className="h-9">
  Disabled
</Button>

// With icon
<Button className="h-9">
  <Icon className="h-4 w-4 mr-2" />
  Action
</Button>
```

---

### Form Fields

#### Input

```tsx
// Standard input
<div className="space-y-2">
  <Label htmlFor="name" className="text-sm font-semibold">
    Name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="name"
    className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
    placeholder="Enter name..."
  />
</div>

// Input with error
<Input
  className={cn(
    "h-10",
    error && "border-destructive focus:border-destructive"
  )}
/>
{error && (
  <p className="text-sm text-destructive mt-1">{error}</p>
)}
```

#### Textarea

```tsx
// Standard textarea
<div className="space-y-2">
  <Label htmlFor="description" className="text-sm font-semibold">
    Description
    <span className="text-xs text-muted-foreground font-normal ml-1">
      (optional)
    </span>
  </Label>
  <Textarea
    id="description"
    rows={3}
    className="border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20 resize-none"
    placeholder="Enter description..."
  />
</div>
```

#### Select

```tsx
// Standard select
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="h-9 border-border/60 hover:border-[#31C7AD]/30 transition-colors">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Select with label
<div className="space-y-2">
  <Label className="text-sm font-semibold">Select Option</Label>
  <Select>
    <SelectTrigger className="h-10 w-full">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {/* Options */}
    </SelectContent>
  </Select>
</div>
```

#### Checkbox

```tsx
// Standard checkbox
<div className="flex items-center space-x-2">
  <Checkbox 
    id="terms" 
    checked={checked}
    onCheckedChange={setChecked}
    className="border-[#31C7AD] data-[state=checked]:bg-[#31C7AD]"
  />
  <Label htmlFor="terms" className="text-sm">
    Accept terms
  </Label>
</div>
```

---

### Modals

#### Modal Structure

All modals follow this structure:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-2xl p-0 overflow-hidden">
    {/* Hero Header - REQUIRED */}
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

    {/* Content Area - REQUIRED */}
    <div className="px-8 py-6 space-y-5">
      {/* Form fields or content */}
    </div>

    {/* Footer - REQUIRED */}
    <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD] hover:from-[#1a54d8] hover:to-[#2ab89a] text-white shadow-md"
        onClick={onSave}
      >
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Modal Sizes

```tsx
// Small
<DialogContent className="sm:max-w-md p-0 overflow-hidden">
  {/* 448px max width */}
</DialogContent>

// Medium (default)
<DialogContent className="max-w-2xl p-0 overflow-hidden">
  {/* 672px max width */}
</DialogContent>

// Large
<DialogContent className="max-w-4xl p-0 overflow-hidden">
  {/* 896px max width */}
</DialogContent>

// Extra Large
<DialogContent className="max-w-5xl p-0 overflow-hidden">
  {/* 1024px max width */}
</DialogContent>
```

#### Scrollable Content

```tsx
<DialogContent className="max-w-2xl h-[85vh] p-0 overflow-hidden flex flex-col">
  {/* Hero Header */}
  <div className="relative shrink-0">
    {/* Header content */}
  </div>

  {/* Scrollable Content */}
  <ScrollArea className="flex-1 min-h-0">
    <div className="px-8 py-6 space-y-6">
      {/* Long content */}
    </div>
  </ScrollArea>

  {/* Footer */}
  <DialogFooter className="shrink-0">
    {/* Footer content */}
  </DialogFooter>
</DialogContent>
```

#### Modal Icons by Context

```tsx
// Teams
<Users2 className="h-5 w-5 text-white" />
<Building2 className="h-5 w-5 text-white" />
<Sparkles className="h-5 w-5 text-white" />

// Scopes
<Target className="h-5 w-5 text-white" />
<Layers className="h-5 w-5 text-white" />

// Routines
<Zap className="h-5 w-5 text-white" />
<FolderKanban className="h-5 w-5 text-white" />

// Users
<User className="h-5 w-5 text-white" />
<UserPlus className="h-5 w-5 text-white" />

// General
<Sparkles className="h-5 w-5 text-white" />
<Settings className="h-5 w-5 text-white" />
```

---

### Tables

#### Table Structure

```tsx
<div className="flex-1 overflow-auto">
  <div className="inline-block min-w-full align-middle">
    <table className="min-w-full divide-y divide-border/60">
      <thead className="bg-muted/40 sticky top-0 z-10 shadow-sm border-b border-border/60">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
            Column Header
          </th>
        </tr>
      </thead>
      <tbody className="bg-background divide-y divide-border/60">
        <tr className="hover:bg-muted/50 transition-colors">
          <td className="px-4 py-3 text-sm">Cell content</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

#### Table Header Variants

```tsx
// Standard header
<thead className="bg-muted/40 sticky top-0 z-10 shadow-sm border-b border-border/60">

// Green tinted header (for grouping)
<th className="bg-green-50 dark:bg-green-950/20 px-4 py-3">
  Group Header
</th>

// Purple tinted header
<th className="bg-purple-50 dark:bg-purple-950/20 px-4 py-3">
  Group Header
</th>
```

#### Table Row States

```tsx
// Hover state
<tr className="hover:bg-muted/50 transition-colors">

// Selected state
<tr className="bg-[#2063F0]/10 hover:bg-[#2063F0]/20">

// Active state
<tr className="bg-[#31C7AD]/10 hover:bg-[#31C7AD]/20">
```

---

### Cards

#### Standard Card

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

#### Card Variants

```tsx
// Teal card (scopes)
<div className="hover:border-[#31C7AD]/30 hover:bg-[#31C7AD]/5">
  {/* Teal-themed card */}
</div>

// Blue card (routines)
<div className="hover:border-[#2063F0]/30 hover:bg-[#2063F0]/5">
  {/* Blue-themed card */}
</div>
```

---

### Badges & Chips

#### Badge

```tsx
// Default badge
<Badge variant="default">Default</Badge>

// Secondary badge
<Badge variant="secondary">Secondary</Badge>

// Destructive badge
<Badge variant="destructive">Error</Badge>

// Outline badge
<Badge variant="outline">Outline</Badge>
```

#### Filter Chip

```tsx
// Standard filter chip
<FilterChip
  label="Status"
  values={['active', 'pending']}
  displayValues={['Active', 'Pending']}
  onRemove={() => removeFilter('status')}
  onEdit={() => openFilterModal('status')}
/>

// Filter chip with custom styling
<FilterChip
  label="Scope"
  values={[scopeId]}
  displayValues={[scopeName]}
  className="bg-[#31C7AD]/10 border-[#31C7AD]/30"
/>
```

#### Routine Chip

```tsx
<RoutineChip
  routineId={routine.id}
  routineName={routine.name}
  onRemove={() => removeRoutine(routine.id)}
/>
```

---

### Navigation

#### Sidebar

```tsx
// Sidebar container
<div className="w-64 bg-muted/50 border-r flex flex-col h-screen transition-all duration-300 ease-in-out">

  {/* Logo area */}
  <div className="px-6 py-5 flex items-center">
    <img 
      src="/images/Pelico-long-logo.svg" 
      alt="Pelico" 
      className="h-8"
    />
  </div>

  {/* Search */}
  <div className="px-3 py-3 bg-background/80 backdrop-blur-sm">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search..."
        className="pl-9 pr-20 cursor-pointer"
      />
    </div>
  </div>

  {/* Navigation items */}
  <nav className="space-y-1 px-3 flex-1 overflow-y-auto py-4">
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'w-full justify-start gap-3',
        isActive && 'bg-[#31C7AD] text-white hover:bg-[#2ab89a]'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 text-left">Menu Item</span>
    </Button>
  </nav>
</div>
```

#### Sidebar Item States

```tsx
// Active item
<Button className="bg-[#31C7AD] text-white hover:bg-[#2ab89a]">
  Active Item
</Button>

// Inactive item
<Button variant="ghost">
  Inactive Item
</Button>
```

---

### Empty States

#### Standard Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-border/60 bg-muted/20">
  <div className="p-3 rounded-full bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10 mb-3">
    <Icon className="h-6 w-6 text-[#31C7AD]/60" />
  </div>
  <p className="text-sm font-medium text-muted-foreground mb-1">
    No items found
  </p>
  <p className="text-xs text-muted-foreground/70 mb-4">
    Add your first item to get started
  </p>
  <Button onClick={handleCreate}>
    Create Item
  </Button>
</div>
```

#### Empty State Variants

```tsx
// Teal empty state (scopes)
<div className="bg-gradient-to-br from-[#31C7AD]/20 to-[#31C7AD]/10">
  <Target className="h-6 w-6 text-[#31C7AD]/60" />
</div>

// Blue empty state (routines)
<div className="bg-gradient-to-br from-[#2063F0]/20 to-[#2063F0]/10">
  <Zap className="h-6 w-6 text-[#2063F0]/60" />
</div>
```

---

### Loading States

#### Button Loading

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

#### Skeleton Loading

```tsx
// Card skeleton
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
  <div className="h-3 bg-muted rounded w-1/2"></div>
</div>

// Table skeleton
<div className="space-y-2">
  {[1, 2, 3].map(i => (
    <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
  ))}
</div>
```

#### Spinner

```tsx
<div className="flex items-center justify-center py-12">
  <Loader2 className="h-8 w-8 animate-spin text-[#2063F0]" />
</div>
```

---

### Error States

#### Inline Error

```tsx
<div className="space-y-2">
  <Input
    className={cn(
      "h-10",
      error && "border-destructive focus:border-destructive"
    )}
  />
  {error && (
    <div className="flex items-start gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <p>{error}</p>
    </div>
  )}
</div>
```

#### Form-Level Error

```tsx
{formErrors.length > 0 && (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
    <div className="flex items-start gap-2">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-destructive mb-2">
          Please fix the following errors:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {formErrors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

#### Error Alert

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    {errorMessage}
    <div className="mt-4 flex gap-2">
      <Button variant="outline" size="sm" onClick={handleRetry}>
        Try Again
      </Button>
    </div>
  </AlertDescription>
</Alert>
```

---

## Layout Patterns

### Page Layout

```tsx
<div className="flex h-screen">
  {/* Sidebar */}
  <Sidebar />
  
  {/* Main content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header */}
    <header className="px-6 py-4 border-b">
      {/* Page header content */}
    </header>
    
    {/* Content area */}
    <main className="flex-1 overflow-auto p-6">
      {/* Page content */}
    </main>
  </div>
</div>
```

### Section Layout

```tsx
<div className="space-y-6">
  {/* Section */}
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-gradient-to-br from-[COLOR]/20 to-[COLOR]/10 border border-[COLOR]/20">
        <Icon className="h-4 w-4 text-[COLOR]" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Section Title</h3>
        <p className="text-xs text-muted-foreground">Section subtitle</p>
      </div>
    </div>
    {/* Section content */}
  </div>
</div>
```

### Grid Layouts

```tsx
// Two column grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Grid items */}
</div>

// Three column grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

---

## Animation & Transitions

### Transitions

```tsx
// Color transitions
transition-colors duration-200

// All transitions
transition-all duration-300 ease-in-out

// Hover effects
hover:shadow-md
hover:scale-105
group-hover:from-[COLOR]/30
```

### Animations

```tsx
// Spinner
animate-spin

// Pulse (skeleton)
animate-pulse

// Fade in
animate-in fade-in-0

// Slide in
animate-in slide-in-from-top-2
```

---

## Accessibility

### Focus States

```tsx
// Input focus
focus:outline-none focus:ring-1 focus:ring-[#2063F0] focus:ring-offset-2

// Button focus
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
```

### ARIA Labels

```tsx
// Icon buttons
<Button aria-label="Close modal">
  <X className="h-4 w-4" />
</Button>

// Form labels
<Label htmlFor="email">Email</Label>
<Input id="email" aria-describedby="email-error" />
```

### Keyboard Navigation

```tsx
// ESC to close modal (built into Dialog)
<Dialog open={open} onOpenChange={onOpenChange}>
  {/* ESC automatically closes */}
</Dialog>

// Keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Quick Reference Checklist

When implementing a new component, verify:

### General
- [ ] Uses design system colors (teal #31C7AD, blue #2063F0)
- [ ] Follows spacing conventions (px-8, py-6, h-9, h-10)
- [ ] Includes hover states
- [ ] Includes focus states for accessibility
- [ ] Uses consistent typography (text-sm font-semibold for labels)
- [ ] Includes transitions for smooth interactions

### Modals
- [ ] Hero header with gradient background
- [ ] Icon container with gradient
- [ ] Proper spacing (px-8, py-6)
- [ ] Footer with border-t and bg-muted/20
- [ ] ESC key support
- [ ] Loading states on submit

### Forms
- [ ] Labels with font-semibold
- [ ] Required fields marked with *
- [ ] Optional fields marked with (optional)
- [ ] Input height h-10
- [ ] Focus states with blue border
- [ ] Inline error messages
- [ ] Disabled submit when invalid

### Buttons
- [ ] Height h-9 (standard)
- [ ] Primary actions use gradient
- [ ] Loading states
- [ ] Disabled states
- [ ] Icon alignment

### Tables
- [ ] Sticky header
- [ ] Hover states on rows
- [ ] Proper spacing (px-4 py-3)
- [ ] Border styling (divide-border/60)

---

## Related Documentation

- `UX_DESIGN_HEURISTICS.md` - UX principles and guidelines
- `REGLES_METIERS.md` - Business rules and domain logic
- `src/styles/tokens.ts` - Design tokens source code

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Maintained by:** Pelico Development Team
