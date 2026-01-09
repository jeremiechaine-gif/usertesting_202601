# UX Design Heuristics Guide - Pelico Supply Prototype

**Based on Nielsen's 10 Usability Heuristics**

This document provides actionable UX design guidelines for implementing UI components in the Pelico Supply Prototype. Each heuristic includes principles, checklists, and component-specific guidance aligned with our design system.

---

## Table of Contents

1. [Visibility of System Status](#1-visibility-of-system-status)
2. [Match Between System and Real World](#2-match-between-system-and-real-world)
3. [User Control and Freedom](#3-user-control-and-freedom)
4. [Consistency and Standards](#4-consistency-and-standards)
5. [Error Prevention](#5-error-prevention)
6. [Recognition Rather Than Recall](#6-recognition-rather-than-recall)
7. [Flexibility and Efficiency of Use](#7-flexibility-and-efficiency-of-use)
8. [Aesthetic and Minimalist Design](#8-aesthetic-and-minimalist-design)
9. [Help Users Recognize, Diagnose, and Recover from Errors](#9-help-users-recognize-diagnose-and-recover-from-errors)
10. [Help and Documentation](#10-help-and-documentation)
11. [Component-Specific Guidelines](#component-specific-guidelines)

---

## 1. Visibility of System Status

**Principle:** The system should always keep users informed about what is happening through appropriate feedback within a reasonable time.

### ✅ Do's

- **Show loading states** for async operations (API calls, data fetching)
- **Display progress indicators** for multi-step processes (wizards, onboarding flows)
- **Provide immediate visual feedback** for user actions (button clicks, form submissions)
- **Show current step/page** in navigation and wizards
- **Indicate active states** clearly (selected items, active filters, current page)
- **Display system status** (saved, saving, error, success) with appropriate icons/colors
- **Show data counts** (e.g., "5 scopes", "12 routines")
- **Indicate disabled states** visually (grayed out, reduced opacity)

### ❌ Don'ts

- Don't leave users guessing if an action completed
- Don't hide important status information
- Don't use ambiguous loading indicators
- Don't forget to clear status messages after appropriate time

### 📋 Checklist

- [ ] All async operations show loading states
- [ ] Form submissions show "Saving..." or "Submitting..." feedback
- [ ] Multi-step wizards display current step (e.g., "Step 2 of 4")
- [ ] Navigation highlights active page/item
- [ ] Selected items are visually distinct
- [ ] Filters show active state and count
- [ ] Success/error messages appear and auto-dismiss appropriately
- [ ] Disabled buttons/inputs are clearly indicated

### 🎯 Component-Specific Examples

#### Modals
```tsx
// ✅ Good: Show loading state during save
<Button disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// ✅ Good: Show success feedback
{showToast && (
  <Toast>
    <CheckCircle className="h-4 w-4 text-green-500" />
    Scope created successfully
  </Toast>
)}
```

#### Wizards
```tsx
// ✅ Good: Show progress
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">
    Step {currentStep} of {totalSteps}
  </span>
  <Progress value={(currentStep / totalSteps) * 100} />
</div>
```

#### Tables
```tsx
// ✅ Good: Show loading and data count
{isLoading ? (
  <div>Loading...</div>
) : (
  <div className="text-sm text-muted-foreground">
    Showing {filteredData.length} of {totalData.length} routines
  </div>
)}
```

#### Forms
```tsx
// ✅ Good: Real-time validation feedback
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

---

## 2. Match Between System and Real World

**Principle:** The system should speak the users' language, with words, phrases, and concepts familiar to the user, rather than system-oriented terms.

### ✅ Do's

- **Use domain terminology** familiar to supply chain professionals (scopes, routines, work orders, purchase orders)
- **Organize information** logically (group related items, use familiar categories)
- **Use icons** that represent real-world concepts (Target for scopes, Zap for routines, Building for teams)
- **Follow real-world conventions** (calendars, time formats, number formats)
- **Use natural language** in labels and descriptions
- **Show examples** when introducing new concepts (guided mode in ScopeModal)

### ❌ Don'ts

- Don't use technical jargon unnecessarily
- Don't invent new terminology when standard terms exist
- Don't use abstract icons without labels
- Don't force users to learn system-specific concepts

### 📋 Checklist

- [ ] Labels use familiar business terms
- [ ] Icons are intuitive and match their function
- [ ] Descriptions explain concepts in user-friendly language
- [ ] Examples are provided for complex features
- [ ] Information hierarchy matches user mental models
- [ ] Date/time formats match user locale expectations
- [ ] Error messages use plain language

### 🎯 Component-Specific Examples

#### Scope Modal
```tsx
// ✅ Good: Use familiar terminology
<DialogTitle>Define Your Scope</DialogTitle>
<DialogDescription>
  A scope defines the data perimeter for your routines. 
  For example: "All work orders in Plant A"
</DialogDescription>

// ✅ Good: Show examples
<div className="space-y-2">
  <p className="text-sm font-semibold">Examples:</p>
  <ul className="text-sm text-muted-foreground list-disc list-inside">
    <li>All purchase orders from Supplier X</li>
    <li>Work orders in Production Line 1</li>
  </ul>
</div>
```

#### Navigation
```tsx
// ✅ Good: Use familiar icons and labels
<SidebarItem icon={ShoppingCart} label="Purchase Orders" />
<SidebarItem icon={Package} label="Work Orders" />
<SidebarItem icon={Wrench} label="Service Orders" />
```

#### Forms
```tsx
// ✅ Good: Natural language labels
<Label>Team Name</Label>
<Label>Email Address</Label>
<Label>Select Scope</Label>

// ❌ Bad: Technical terms
<Label>Entity Identifier</Label>
<Label>String Input Field</Label>
```

---

## 3. User Control and Freedom

**Principle:** Users often perform actions by mistake. They need a clearly marked "emergency exit" to leave the unwanted state without having to go through an extended dialogue.

### ✅ Do's

- **Provide Cancel buttons** in all modals and forms
- **Support Undo** for destructive actions (delete, remove)
- **Allow easy navigation back** (Back buttons, breadcrumbs)
- **Enable quick exit** from wizards/modals (ESC key, click outside)
- **Confirm destructive actions** before execution
- **Allow editing** after creation (edit modals, inline editing)
- **Provide clear exit paths** from multi-step processes

### ❌ Don'ts

- Don't trap users in workflows
- Don't make it hard to cancel or go back
- Don't auto-submit forms without user confirmation
- Don't hide cancel/close options

### 📋 Checklist

- [ ] All modals have Cancel/Close buttons
- [ ] ESC key closes modals
- [ ] Click outside modal closes it (when appropriate)
- [ ] Wizards have Back/Previous buttons
- [ ] Destructive actions show confirmation dialogs
- [ ] Users can edit items after creation
- [ ] Clear exit path from multi-step processes
- [ ] Undo available for recent actions (where feasible)

### 🎯 Component-Specific Examples

#### Modals
```tsx
// ✅ Good: Clear exit options
<DialogFooter>
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
  <Button onClick={onSave}>
    Save
  </Button>
</DialogFooter>

// ✅ Good: ESC key support (built into Dialog component)
<Dialog open={open} onOpenChange={onOpenChange}>
  {/* ESC automatically closes */}
</Dialog>
```

#### Wizards
```tsx
// ✅ Good: Navigation controls
<div className="flex justify-between">
  <Button 
    variant="outline" 
    onClick={handleBack}
    disabled={currentStep === 1}
  >
    <ArrowLeft className="h-4 w-4 mr-2" />
    Back
  </Button>
  <Button onClick={handleNext}>
    Next
    <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
</div>
```

#### Destructive Actions
```tsx
// ✅ Good: Confirmation before delete
const handleDelete = () => {
  if (confirm('Are you sure you want to delete this scope? This action cannot be undone.')) {
    deleteScope(scopeId);
  }
};

// ✅ Better: Use confirmation dialog component
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Scope?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "{scopeName}". This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Filters
```tsx
// ✅ Good: Easy to clear filters
<div className="flex items-center gap-2">
  <FilterChip label="Status: Active" onRemove={handleRemoveFilter} />
  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
    Clear All
  </Button>
</div>
```

---

## 4. Consistency and Standards

**Principle:** Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform conventions.

### ✅ Do's

- **Follow design system** consistently (MODAL_STYLE_GUIDE.md)
- **Use consistent terminology** across the app
- **Maintain visual consistency** (colors, spacing, typography)
- **Follow established patterns** (hero headers, button styles, form layouts)
- **Use consistent iconography** (same icon for same concept)
- **Maintain interaction patterns** (hover states, click behaviors)
- **Follow platform conventions** (primary action on right, cancel on left)

### ❌ Don'ts

- Don't invent new patterns when existing ones work
- Don't mix different styles for the same component type
- Don't use different terminology for the same concept
- Don't break established visual hierarchy

### 📋 Checklist

- [ ] All modals follow hero header pattern
- [ ] Buttons use consistent heights (h-9 for actions, h-10 for inputs)
- [ ] Colors follow design system (teal #31C7AD, blue #2063F0)
- [ ] Spacing is consistent (px-8 for modal sides, py-6 for content)
- [ ] Typography follows tokens (text-sm font-semibold for labels)
- [ ] Icons are consistent (Target for scopes, Zap for routines)
- [ ] Form layouts follow same structure
- [ ] Error states use same styling
- [ ] Loading states are consistent

### 🎯 Component-Specific Examples

#### Modal Structure
```tsx
// ✅ Good: Follow MODAL_STYLE_GUIDE.md pattern
<DialogContent className="max-w-2xl p-0 overflow-hidden">
  {/* Hero Header - ALWAYS */}
  <div className="relative shrink-0">
    <div className="absolute inset-0 bg-gradient-to-br from-[#31C7AD]/10 via-[#2063F0]/5 to-transparent" />
    <DialogHeader className="relative px-8 pt-8 pb-6 border-b border-border/50">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#2063F0] to-[#31C7AD] shadow-md">
          <Target className="h-5 w-5 text-white" />
        </div>
        <DialogTitle className="text-2xl font-bold">Modal Title</DialogTitle>
      </div>
      <DialogDescription className="text-sm text-muted-foreground">
        Description
      </DialogDescription>
    </DialogHeader>
  </div>
  
  {/* Content - ALWAYS px-8 py-6 */}
  <div className="px-8 py-6 space-y-5">
    {/* Form fields */}
  </div>
  
  {/* Footer - ALWAYS */}
  <DialogFooter className="px-8 py-5 border-t border-border/50 shrink-0 bg-muted/20 gap-2">
    <Button variant="outline">Cancel</Button>
    <Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD]">Save</Button>
  </DialogFooter>
</DialogContent>
```

#### Button Consistency
```tsx
// ✅ Good: Consistent heights and styles
<Button className="h-9">Primary Action</Button>
<Button variant="outline" className="h-9">Secondary</Button>
<Button size="sm" className="h-9">Small</Button>

// ❌ Bad: Inconsistent heights
<Button className="h-8">Action 1</Button>
<Button className="h-12">Action 2</Button>
```

#### Form Fields
```tsx
// ✅ Good: Consistent structure
<div className="space-y-2">
  <Label htmlFor="name" className="text-sm font-semibold">
    Name <span className="text-destructive">*</span>
  </Label>
  <Input
    id="name"
    className="h-10 border-border/60 focus:border-[#2063F0] focus:ring-[#2063F0]/20"
  />
</div>
```

#### Color Usage
```tsx
// ✅ Good: Consistent color meanings
// Teal (#31C7AD) for: scopes, data, checkboxes, selection
// Blue (#2063F0) for: routines, actions, focus states
// Gradient (blue→teal) for: primary actions, hero headers

<div className="bg-[#31C7AD]">Scope-related</div>
<div className="bg-[#2063F0]">Routine-related</div>
<Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD]">
  Primary Action
</Button>
```

---

## 5. Error Prevention

**Principle:** Even better than good error messages is a careful design which prevents a problem from occurring in the first place.

### ✅ Do's

- **Validate inputs** in real-time (as user types)
- **Disable submit** when form is invalid
- **Provide inline validation** with helpful messages
- **Use appropriate input types** (email, number, date)
- **Confirm destructive actions** before execution
- **Prevent invalid states** through UI constraints (dropdowns vs free text)
- **Show required fields** clearly
- **Auto-save** draft data when possible
- **Warn before navigation** if unsaved changes exist

### ❌ Don'ts

- Don't wait until submit to show validation errors
- Don't allow submission of invalid forms
- Don't use ambiguous error messages
- Don't make it easy to accidentally delete data

### 📋 Checklist

- [ ] Forms validate in real-time
- [ ] Submit button disabled when form is invalid
- [ ] Required fields are clearly marked
- [ ] Input types match data (email, number, etc.)
- [ ] Inline error messages appear immediately
- [ ] Destructive actions require confirmation
- [ ] Invalid selections are prevented (dropdowns, checkboxes)
- [ ] Unsaved changes warning before navigation
- [ ] Draft data is auto-saved (where applicable)

### 🎯 Component-Specific Examples

#### Form Validation
```tsx
// ✅ Good: Real-time validation
const [name, setName] = useState('');
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (!name.trim()) {
    setError(null);
    return;
  }
  
  if (name.trim().length < 2) {
    setError('Name must be at least 2 characters');
    return;
  }
  
  if (scopeNameExists(name)) {
    setError('A scope with this name already exists');
    return;
  }
  
  setError(null);
}, [name]);

// ✅ Good: Disable submit when invalid
<Button 
  disabled={!name.trim() || !!error || isSubmitting}
  onClick={handleSave}
>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// ✅ Good: Show inline error
{error && (
  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
    <AlertCircle className="h-3 w-3" />
    {error}
  </p>
)}
```

#### Input Types
```tsx
// ✅ Good: Use appropriate input types
<Input 
  type="email" 
  placeholder="user@example.com"
  // Browser provides email validation
/>

<Input 
  type="number" 
  min={0}
  max={100}
  // Browser prevents invalid numbers
/>

<Input 
  type="text"
  pattern="[A-Za-z0-9\s-]+"
  // Browser validates pattern
/>
```

#### Required Fields
```tsx
// ✅ Good: Clear required indicators
<Label htmlFor="name" className="text-sm font-semibold">
  Scope Name <span className="text-destructive">*</span>
</Label>

<Label htmlFor="description" className="text-sm font-semibold">
  Description 
  <span className="text-xs text-muted-foreground font-normal ml-1">
    (optional)
  </span>
</Label>
```

#### Confirmation Dialogs
```tsx
// ✅ Good: Prevent accidental deletion
const handleDelete = () => {
  setShowConfirmDialog(true);
};

<AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Scope?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "{scopeName}". 
        All routines using this scope will be affected. 
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={confirmDelete}
        className="bg-destructive text-destructive-foreground"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### Unsaved Changes Warning
```tsx
// ✅ Good: Warn before navigation
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

const handleNavigation = (path: string) => {
  if (hasUnsavedChanges) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      navigate(path);
    }
  } else {
    navigate(path);
  }
};
```

---

## 6. Recognition Rather Than Recall

**Principle:** Minimize the user's memory load by making objects, actions, and options visible. The user should not have to remember information from one part of the dialogue to another.

### ✅ Do's

- **Show options** instead of requiring users to remember them
- **Display context** (current selection, active filters, applied scopes)
- **Use visual cues** (icons, colors, badges) to aid recognition
- **Show recent items** or frequently used options
- **Display related information** together (scope with its routines)
- **Use autocomplete** for text inputs
- **Show tooltips** for icons and abbreviations
- **Display breadcrumbs** for navigation context

### ❌ Don'ts

- Don't hide important information
- Don't require users to remember IDs or codes
- Don't use abbreviations without tooltips
- Don't make users navigate away to see related info

### 📋 Checklist

- [ ] Dropdowns show current selection
- [ ] Filters display active state and values
- [ ] Selected items are visually highlighted
- [ ] Icons have tooltips or labels
- [ ] Recent/frequent items are shown first
- [ ] Related data is visible together
- [ ] Search shows suggestions/autocomplete
- [ ] Context is preserved across navigation
- [ ] Breadcrumbs show current location

### 🎯 Component-Specific Examples

#### Dropdowns
```tsx
// ✅ Good: Show current selection
<Select value={selectedScopeId} onValueChange={setSelectedScopeId}>
  <SelectTrigger>
    <SelectValue placeholder="Select a scope">
      {selectedScopeId ? getScopeName(selectedScopeId) : "Select a scope"}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {scopes.map(scope => (
      <SelectItem key={scope.id} value={scope.id}>
        {scope.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Filters
```tsx
// ✅ Good: Show active filters
<div className="flex flex-wrap gap-2">
  {activeFilters.map(filter => (
    <FilterChip
      key={filter.id}
      label={`${filter.label}: ${filter.value}`}
      onRemove={() => removeFilter(filter.id)}
    />
  ))}
  {activeFilters.length > 0 && (
    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
      Clear All
    </Button>
  )}
</div>
```

#### Tooltips
```tsx
// ✅ Good: Icons have tooltips
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Click to learn more about scopes</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

#### Recent Items
```tsx
// ✅ Good: Show recent/frequent items
<div className="space-y-2">
  <p className="text-sm font-semibold">Recent Scopes</p>
  {recentScopes.map(scope => (
    <div 
      key={scope.id}
      className="p-2 rounded hover:bg-muted cursor-pointer"
      onClick={() => selectScope(scope.id)}
    >
      {scope.name}
    </div>
  ))}
</div>
```

#### Related Information
```tsx
// ✅ Good: Show related data together
<div className="space-y-4">
  <div>
    <h3 className="font-semibold">{scope.name}</h3>
    <p className="text-sm text-muted-foreground">{scope.description}</p>
  </div>
  <div>
    <p className="text-sm font-semibold mb-2">
      Routines using this scope ({routines.length})
    </p>
    {routines.map(routine => (
      <div key={routine.id} className="text-sm">
        {routine.name}
      </div>
    ))}
  </div>
</div>
```

#### Autocomplete
```tsx
// ✅ Good: Show suggestions as user types
<Command>
  <CommandInput 
    placeholder="Search scopes..." 
    value={searchQuery}
    onValueChange={setSearchQuery}
  />
  <CommandList>
    {filteredScopes.map(scope => (
      <CommandItem
        key={scope.id}
        value={scope.name}
        onSelect={() => selectScope(scope.id)}
      >
        {scope.name}
      </CommandItem>
    ))}
  </CommandList>
</Command>
```

---

## 7. Flexibility and Efficiency of Use

**Principle:** Accelerators — unseen by the novice user — may often speed up the interaction for the expert user such that the system can cater to both inexperienced and experienced users.

### ✅ Do's

- **Provide keyboard shortcuts** for common actions (Cmd+S to save, ESC to close)
- **Support bulk actions** where applicable (select multiple, delete multiple)
- **Offer quick actions** (duplicate, quick edit)
- **Provide search** for finding items quickly
- **Support filters** for power users
- **Allow customization** where appropriate (column visibility, preferences)
- **Show keyboard shortcuts** in tooltips or help
- **Provide both simple and advanced modes** (guided vs expert)

### ❌ Don'ts

- Don't force all users through the same workflow
- Don't hide power features from advanced users
- Don't make common actions require many clicks
- Don't ignore keyboard navigation

### 📋 Checklist

- [ ] Keyboard shortcuts for common actions (Save, Cancel, Search)
- [ ] ESC key closes modals/dialogs
- [ ] Tab navigation works logically
- [ ] Bulk selection and actions available
- [ ] Search functionality for finding items
- [ ] Filters available for power users
- [ ] Quick actions accessible (duplicate, edit)
- [ ] Both simple and advanced modes (where applicable)
- [ ] Keyboard shortcuts documented in tooltips

### 🎯 Component-Specific Examples

#### Keyboard Shortcuts
```tsx
// ✅ Good: Keyboard shortcuts for forms
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (canSubmit) {
        handleSave();
      }
    }
    // ESC to cancel
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [canSubmit, handleSave, onCancel]);
```

#### Bulk Actions
```tsx
// ✅ Good: Select multiple and act on them
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

<div className="flex items-center gap-2">
  <Checkbox
    checked={selectedItems.size === items.length}
    onCheckedChange={(checked) => {
      if (checked) {
        setSelectedItems(new Set(items.map(i => i.id)));
      } else {
        setSelectedItems(new Set());
      }
    }}
  />
  <span className="text-sm text-muted-foreground">
    {selectedItems.size} selected
  </span>
  {selectedItems.size > 0 && (
    <Button 
      variant="destructive" 
      size="sm"
      onClick={() => deleteSelected(Array.from(selectedItems))}
    >
      Delete Selected
    </Button>
  )}
</div>
```

#### Quick Actions
```tsx
// ✅ Good: Quick actions menu
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="h-4 w-4 mr-2" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDuplicate}>
      <Copy className="h-4 w-4 mr-2" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
      <Trash className="h-4 w-4 mr-2" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### Search
```tsx
// ✅ Good: Quick search with keyboard shortcut
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Search routines... (Cmd+K)"
    className="pl-9"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  {searchQuery && (
    <Button
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1/2 transform -translate-y-1/2"
      onClick={() => setSearchQuery('')}
    >
      <X className="h-4 w-4" />
    </Button>
  )}
</div>
```

#### Guided vs Expert Mode
```tsx
// ✅ Good: Toggle between modes (ScopeModal example)
<div className="flex items-center gap-2 mb-4">
  <Button
    variant={mode === 'guided' ? 'default' : 'outline'}
    onClick={() => setMode('guided')}
  >
    Guided Mode
  </Button>
  <Button
    variant={mode === 'expert' ? 'default' : 'outline'}
    onClick={() => setMode('expert')}
  >
    Expert Mode
  </Button>
</div>

{mode === 'guided' ? (
  <GuidedFilterSetup />
) : (
  <ExpertFilterSetup />
)}
```

#### Column Customization
```tsx
// ✅ Good: Show/hide columns
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <Columns className="h-4 w-4 mr-2" />
      Columns
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      {columns.map(column => (
        <div key={column.id} className="flex items-center gap-2">
          <Checkbox
            checked={visibleColumns.has(column.id)}
            onCheckedChange={(checked) => {
              if (checked) {
                setVisibleColumns(new Set([...visibleColumns, column.id]));
              } else {
                const newSet = new Set(visibleColumns);
                newSet.delete(column.id);
                setVisibleColumns(newSet);
              }
            }}
          />
          <Label>{column.label}</Label>
        </div>
      ))}
    </div>
  </PopoverContent>
</Popover>
```

---

## 8. Aesthetic and Minimalist Design

**Principle:** Dialogues should not contain information which is irrelevant or rarely needed. Every extra unit of information in a dialogue competes with the relevant units of information and diminishes their relative visibility.

### ✅ Do's

- **Show only essential information** at first glance
- **Use progressive disclosure** (show details on demand)
- **Remove unnecessary UI elements** (decorative only if they add value)
- **Use whitespace** effectively for visual hierarchy
- **Group related information** logically
- **Hide advanced options** by default (show with "Advanced" toggle)
- **Use icons** to reduce text clutter
- **Prioritize content** over decoration

### ❌ Don'ts

- Don't overwhelm users with too much information at once
- Don't use decorative elements that distract
- Don't show all options when only a few are needed
- Don't sacrifice clarity for aesthetics

### 📋 Checklist

- [ ] Only essential information visible initially
- [ ] Advanced options are hidden by default
- [ ] Whitespace used effectively
- [ ] Related information grouped together
- [ ] Icons used appropriately (not decorative)
- [ ] Progressive disclosure for complex features
- [ ] No unnecessary visual elements
- [ ] Clear visual hierarchy

### 🎯 Component-Specific Examples

#### Progressive Disclosure
```tsx
// ✅ Good: Show advanced options on demand
const [showAdvanced, setShowAdvanced] = useState(false);

<div className="space-y-4">
  {/* Essential fields always visible */}
  <div className="space-y-2">
    <Label>Scope Name *</Label>
    <Input value={name} onChange={(e) => setName(e.target.value)} />
  </div>
  
  {/* Advanced options hidden by default */}
  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm">
        <ChevronDown className={cn("h-4 w-4 mr-2", showAdvanced && "rotate-180")} />
        Advanced Options
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Custom Metadata</Label>
        <Textarea />
      </div>
      {/* More advanced fields */}
    </CollapsibleContent>
  </Collapsible>
</div>
```

#### Clean Modal Design
```tsx
// ✅ Good: Minimal, focused design
<DialogContent className="max-w-2xl">
  {/* Hero Header - essential info only */}
  <DialogHeader>
    <DialogTitle>Create Scope</DialogTitle>
    <DialogDescription>
      Define the data perimeter for your routines
    </DialogDescription>
  </DialogHeader>
  
  {/* Content - only essential fields */}
  <div className="space-y-4">
    <div className="space-y-2">
      <Label>Name *</Label>
      <Input />
    </div>
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea rows={3} />
    </div>
  </div>
  
  {/* Footer - clear actions */}
  <DialogFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Create</Button>
  </DialogFooter>
</DialogContent>
```

#### Effective Grouping
```tsx
// ✅ Good: Logical grouping with spacing
<div className="space-y-6">
  {/* Basic Information */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold">Basic Information</h3>
    <div className="space-y-2">
      <Label>Name *</Label>
      <Input />
    </div>
    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea />
    </div>
  </div>
  
  {/* Filters */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold">Filters</h3>
    <div className="space-y-2">
      {/* Filter components */}
    </div>
  </div>
</div>
```

#### Icon Usage
```tsx
// ✅ Good: Icons add meaning, not decoration
<div className="flex items-center gap-2">
  <Target className="h-4 w-4 text-[#31C7AD]" />
  <span>Scope: Production Line A</span>
</div>

// ✅ Good: Icon buttons with tooltips (no text clutter)
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Learn more about scopes</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// ❌ Bad: Decorative icons without meaning
<div>
  <Sparkles className="h-4 w-4" /> {/* Why is this here? */}
  <span>Scope Name</span>
</div>
```

#### Empty States
```tsx
// ✅ Good: Minimal, helpful empty state
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="p-3 rounded-full bg-muted mb-3">
    <Package className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium mb-1">No routines yet</p>
  <p className="text-xs text-muted-foreground mb-4">
    Create your first routine to get started
  </p>
  <Button onClick={handleCreate}>
    Create Routine
  </Button>
</div>
```

---

## 9. Help Users Recognize, Diagnose, and Recover from Errors

**Principle:** Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

### ✅ Do's

- **Use plain language** in error messages
- **Explain what went wrong** clearly
- **Suggest how to fix** the error
- **Show errors inline** near the problematic field
- **Use appropriate visual styling** (red for errors, yellow for warnings)
- **Provide recovery actions** (retry, undo, contact support)
- **Group related errors** together
- **Show errors at the right time** (after user action, not before)

### ❌ Don'ts

- Don't use technical error codes
- Don't blame the user
- Don't show generic error messages
- Don't hide error details completely
- Don't make errors hard to find

### 📋 Checklist

- [ ] Error messages use plain language
- [ ] Errors explain what went wrong
- [ ] Errors suggest how to fix
- [ ] Errors appear inline near the field
- [ ] Error styling is consistent (red, destructive)
- [ ] Recovery actions are provided
- [ ] Related errors are grouped
- [ ] Errors don't disappear too quickly
- [ ] Network errors offer retry option

### 🎯 Component-Specific Examples

#### Inline Validation Errors
```tsx
// ✅ Good: Clear, helpful error messages
<div className="space-y-2">
  <Label htmlFor="email">Email Address *</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className={cn(
      "h-10",
      emailError && "border-destructive focus:border-destructive"
    )}
  />
  {emailError && (
    <div className="flex items-start gap-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">{emailError}</p>
        {emailError === "Invalid email format" && (
          <p className="text-xs mt-1 text-muted-foreground">
            Please enter a valid email address (e.g., user@example.com)
          </p>
        )}
      </div>
    </div>
  )}
</div>
```

#### Form-Level Errors
```tsx
// ✅ Good: Summary of errors at form level
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

#### Network Errors
```tsx
// ✅ Good: Network errors with retry
const [networkError, setNetworkError] = useState<string | null>(null);

const handleSave = async () => {
  try {
    setIsSubmitting(true);
    setNetworkError(null);
    await saveScope(scopeData);
    showToast('Scope saved successfully');
  } catch (error) {
    if (error instanceof NetworkError) {
      setNetworkError(
        'Unable to save. Please check your internet connection and try again.'
      );
    } else {
      setNetworkError('An unexpected error occurred. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

{networkError && (
  <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-2 flex-1">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">{networkError}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={isSubmitting}
      >
        Retry
      </Button>
    </div>
  </div>
)}
```

#### Validation Errors
```tsx
// ✅ Good: Specific validation errors
const validateScope = (scope: Partial<Scope>) => {
  const errors: string[] = [];
  
  if (!scope.name?.trim()) {
    errors.push('Scope name is required');
  } else if (scope.name.trim().length < 2) {
    errors.push('Scope name must be at least 2 characters');
  } else if (scope.name.trim().length > 50) {
    errors.push('Scope name cannot exceed 50 characters');
  }
  
  if (scope.filters && scope.filters.length === 0) {
    errors.push('At least one filter is required to define the scope');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Display errors
{!validation.isValid && (
  <div className="space-y-2">
    {validation.errors.map((error, index) => (
      <div key={index} className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    ))}
  </div>
)}
```

#### Error Recovery
```tsx
// ✅ Good: Provide recovery actions
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      {error}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
        >
          Try Again
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

---

## 10. Help and Documentation

**Principle:** Even though it is better if the system can be used without documentation, it may be necessary to provide help and documentation. Any such information should be easy to search, focused on the user's task, list concrete steps to be carried out, and not be too large.

### ✅ Do's

- **Provide contextual help** (tooltips, info icons)
- **Show examples** for complex features (guided mode)
- **Include helpful descriptions** in forms and modals
- **Offer tooltips** for icons and abbreviations
- **Provide inline hints** for form fields
- **Show tips** for power users
- **Keep help text concise** and actionable
- **Make help discoverable** (info icons, help buttons)

### ❌ Don'ts

- Don't rely on external documentation
- Don't make help text too long
- Don't hide help information
- Don't use jargon in help text

### 📋 Checklist

- [ ] Tooltips on icons and buttons
- [ ] Helpful descriptions in modals/forms
- [ ] Examples provided for complex features
- [ ] Inline hints for form fields
- [ ] Contextual help available
- [ ] Help text is concise and actionable
- [ ] Help is discoverable (info icons)
- [ ] Tips shown for advanced features

### 🎯 Component-Specific Examples

#### Tooltips
```tsx
// ✅ Good: Helpful tooltips
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <HelpCircle className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs">
      <p>
        A scope defines the data perimeter for your routines. 
        For example: "All work orders in Plant A"
      </p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

#### Inline Help
```tsx
// ✅ Good: Helpful descriptions in forms
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <Label htmlFor="scope-mode">Scope Mode *</Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>
            <strong>Scope-aware:</strong> Routine adapts to user's current scope
            <br />
            <strong>Scope-fixed:</strong> Routine always uses this specific scope
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
  <Select>
    {/* Options */}
  </Select>
  <p className="text-xs text-muted-foreground">
    Choose how this routine should handle scope selection
  </p>
</div>
```

#### Examples Section
```tsx
// ✅ Good: Show examples (ScopeModal pattern)
{showScopeInfo && (
  <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-[#2063F0]" />
        <p className="text-sm font-semibold">What is a scope?</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => setShowScopeInfo(false)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
    <p className="text-sm text-muted-foreground">
      A scope defines the data perimeter for your routines. 
      It filters data based on criteria you specify.
    </p>
    <div>
      <p className="text-sm font-semibold mb-2">Examples:</p>
      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
        <li>All purchase orders from Supplier X</li>
        <li>Work orders in Production Line 1</li>
        <li>Service orders assigned to Team A</li>
      </ul>
    </div>
  </div>
)}
```

#### Field Hints
```tsx
// ✅ Good: Helpful hints below fields
<div className="space-y-2">
  <Label htmlFor="name">Scope Name *</Label>
  <Input
    id="name"
    placeholder="e.g., Production Line A"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
  <p className="text-xs text-muted-foreground">
    Choose a descriptive name that clearly identifies this scope's purpose
  </p>
</div>
```

#### Tips Section
```tsx
// ✅ Good: Tips for power users
<div className="rounded-lg border border-[#2063F0]/20 bg-[#2063F0]/5 p-4">
  <div className="flex items-start gap-2">
    <Lightbulb className="h-4 w-4 text-[#2063F0] shrink-0 mt-0.5" />
    <div>
      <p className="text-sm font-semibold mb-1">Tip</p>
      <p className="text-xs text-muted-foreground">
        You can use keyboard shortcuts: Cmd+S to save, ESC to cancel
      </p>
    </div>
  </div>
</div>
```

---

## Component-Specific Guidelines

### Modals

#### Structure Checklist
- [ ] Hero header with gradient background
- [ ] Icon container with gradient (teal/blue)
- [ ] DialogTitle with gradient text effect
- [ ] DialogDescription for context
- [ ] Content area with px-8 py-6 spacing
- [ ] Footer with border-t and bg-muted/20
- [ ] Cancel button (left) and primary action (right)
- [ ] ESC key closes modal
- [ ] Loading states on submit

#### Error Handling
- [ ] Inline validation errors
- [ ] Form-level error summary
- [ ] Network error with retry option
- [ ] Clear error messages

#### Accessibility
- [ ] DialogDescription for screen readers
- [ ] Proper label associations
- [ ] Focus management (focus trap)
- [ ] Keyboard navigation support

### Forms

#### Field Structure
- [ ] Label with font-semibold
- [ ] Required indicator (*) in red
- [ ] Optional indicator in muted text
- [ ] Input with h-10 height
- [ ] Focus states with blue border
- [ ] Inline error messages
- [ ] Helpful hints below fields

#### Validation
- [ ] Real-time validation
- [ ] Clear error messages
- [ ] Disabled submit when invalid
- [ ] Success feedback on submit

### Wizards

#### Navigation
- [ ] Progress indicator (Step X of Y)
- [ ] Back button (disabled on first step)
- [ ] Next button (disabled on last step)
- [ ] Cancel button (always available)
- [ ] Step indicators/breadcrumbs

#### State Management
- [ ] Preserve data between steps
- [ ] Validate before proceeding
- [ ] Show unsaved changes warning
- [ ] Auto-save draft (where applicable)

### Tables

#### Interaction
- [ ] Sortable columns
- [ ] Filterable columns
- [ ] Row selection (single/multiple)
- [ ] Bulk actions for selected rows
- [ ] Loading states
- [ ] Empty states

#### Display
- [ ] Column visibility toggle
- [ ] Data count display
- [ ] Pagination (if needed)
- [ ] Responsive design

### Filters

#### Visibility
- [ ] Active filters displayed as chips
- [ ] Filter count badge
- [ ] Clear all option
- [ ] Individual remove buttons

#### Interaction
- [ ] Filter modal/popover
- [ ] Search within filters
- [ ] Filter presets (where applicable)
- [ ] Recent filters shown first

### Navigation

#### Sidebar
- [ ] Active item highlighted
- [ ] Icons for each item
- [ ] Collapsible sections
- [ ] User profile section
- [ ] Logout option

#### Breadcrumbs
- [ ] Show current location
- [ ] Clickable parent paths
- [ ] Consistent styling

---

## Quick Reference: Design System Colors

### Primary Colors
- **Teal (#31C7AD)**: Scopes, data, checkboxes, selection states
- **Blue (#2063F0)**: Routines, actions, focus states
- **Gradient (Blue→Teal)**: Primary actions, hero headers

### Usage
```tsx
// Scopes
<div className="bg-[#31C7AD]">Scope-related</div>
<div className="border-[#31C7AD]">Scope borders</div>
<div className="text-[#31C7AD]">Scope text</div>

// Routines
<div className="bg-[#2063F0]">Routine-related</div>
<div className="border-[#2063F0]">Routine borders</div>
<div className="text-[#2063F0]">Routine text</div>

// Primary Actions
<Button className="bg-gradient-to-r from-[#2063F0] to-[#31C7AD]">
  Primary Action
</Button>
```

---

## Quick Reference: Spacing

### Modal Spacing
- **Sides**: `px-8` (32px)
- **Content top/bottom**: `py-6` (24px)
- **Header**: `pt-8 pb-6` (32px top, 24px bottom)
- **Footer**: `py-5` (20px)

### Component Spacing
- **Form fields**: `space-y-5` (20px)
- **Sections**: `space-y-6` (24px)
- **Cards**: `p-4` (16px)
- **Icon containers**: `p-2` (8px), `p-2.5` (10px), `p-3` (12px)

### Heights
- **Inputs**: `h-10` (40px)
- **Buttons**: `h-9` (36px)
- **Selects**: `h-9` or `h-10`

---

## Implementation Checklist

When implementing a new UI component, verify:

### General
- [ ] Follows design system (MODAL_STYLE_GUIDE.md)
- [ ] Uses consistent colors and spacing
- [ ] Implements all relevant heuristics
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Responsive design

### Modals
- [ ] Hero header with gradient
- [ ] Icon container with gradient
- [ ] Proper spacing (px-8, py-6)
- [ ] Cancel and primary actions
- [ ] ESC key support
- [ ] Loading states

### Forms
- [ ] Real-time validation
- [ ] Inline error messages
- [ ] Required fields marked
- [ ] Helpful hints/descriptions
- [ ] Disabled submit when invalid

### Navigation
- [ ] Active state highlighted
- [ ] Clear labels and icons
- [ ] Keyboard accessible
- [ ] Consistent styling

### Errors
- [ ] Plain language messages
- [ ] Suggestions for fixing
- [ ] Inline display
- [ ] Recovery actions

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Maintained by:** Pelico Development Team

**Related Documents:**
- `MODAL_STYLE_GUIDE.md` - Detailed modal design patterns
- `REGLES_METIERS.md` - Business rules and domain logic
- `UI_AUDIT_REPORT.md` - Component audit and improvements
