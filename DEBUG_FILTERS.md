# Debug Prompt: Filter Automatically Adding Sort Issue

## 🐛 Problem
When applying a filter, a sort is automatically added to the table. Filters and sorts should be independent.

## ✅ Expected Behavior
- Adding a filter → Only filter state changes
- Adding a filter → NO sort should be added
- Filters and sorts operate independently

## ❌ Observed Behavior
- Applying a filter (via column header menu or Sorting & Filters popover) automatically adds a sort
- Sort appears on the same column or a different column

## 🔍 Critical Investigation Points

### 1. ColumnHeader Click Handler (HIGH PRIORITY)
**File**: `src/components/ColumnHeader.tsx`
- **Issue**: `handleHeaderClick` is attached to the entire header div
- **Check**: When clicking "Filter" button, verify `e.stopPropagation()` prevents header click
- **Line ~135-150**: Verify filter button click doesn't bubble up to trigger `handleHeaderClick`
- **Action**: Add console.log to verify if `handleHeaderClick` is called when applying filter

### 2. ColumnFilterModal onApply Handler
**File**: `src/components/PurchaseOrderBookPage.tsx` (line ~480-495)
- **Check**: Verify `onApply` callback ONLY calls `setColumnFilters`
- **Issue**: Check if `onApply` accidentally calls `setSorting` or modifies sorting state
- **Action**: Add console.log before/after `setColumnFilters` to verify no sort changes

### 3. SortingAndFiltersPopover handleSave
**File**: `src/components/SortingAndFiltersPopover.tsx` (line ~190-207)
- **Check**: `handleSave` updates both sorting AND filters
- **Issue**: If user only changes filters, verify it doesn't reset/add sorts
- **Action**: Verify `draftSorting` state is not modified when only filters change

### 4. Event Propagation Issues
**File**: `src/components/ColumnHeader.tsx` (line ~189-192)
- **Check**: Filter button click handler has `e.stopPropagation()` and `e.preventDefault()`
- **Issue**: Event might still bubble up to header click handler
- **Action**: Verify event propagation is completely stopped

### 5. TanStack Table Side Effects
**File**: `src/components/PurchaseOrderBookPage.tsx` (line ~37-64)
- **Check**: `useReactTable` configuration
- **Issue**: Check if `onColumnFiltersChange` triggers any sort-related side effects
- **Action**: Review table state management for unintended dependencies

## 🧪 Debug Steps

### Step 1: Add Console Logs
Add these logs to identify where sort is being added:

```typescript
// In ColumnFilterModal.tsx onApply handler
console.log('🔵 Filter Apply - Before:', { 
  currentSorts: sorting, 
  currentFilters: columnFilters 
});
// ... apply filter ...
console.log('🔵 Filter Apply - After:', { 
  currentSorts: sorting, 
  currentFilters: newFilters 
});

// In ColumnHeader.tsx handleHeaderClick
console.log('🟢 Header Click:', { 
  columnId, 
  target: e.target, 
  currentTarget: e.currentTarget 
});

// In SortingAndFiltersPopover.tsx handleSave
console.log('🟡 Save - Draft State:', { 
  draftSorting, 
  draftFilters 
});
```

### Step 2: Check Event Propagation
Verify filter button clicks don't trigger header clicks:

```typescript
// In ColumnHeader.tsx filter button
onClick={(e) => {
  console.log('🔴 Filter Button Click');
  e.stopPropagation();
  e.preventDefault();
  // ... rest of handler
}}
```

### Step 3: Verify State Updates
Check if filter updates trigger sort updates:

```typescript
// In PurchaseOrderBookPage.tsx
useEffect(() => {
  console.log('📊 Column Filters Changed:', columnFilters);
}, [columnFilters]);

useEffect(() => {
  console.log('📈 Sorting Changed:', sorting);
}, [sorting]);
```

## 🎯 Specific Code Locations

1. **`src/components/ColumnHeader.tsx:189-192`** - Filter button click handler
2. **`src/components/ColumnHeader.tsx:135-150`** - Header click handler (potential conflict)
3. **`src/components/ColumnFilterModal.tsx:137-141`** - onApply handler
4. **`src/components/PurchaseOrderBookPage.tsx:480-495`** - Filter modal onApply callback
5. **`src/components/SortingAndFiltersPopover.tsx:190-207`** - handleSave function

## ✅ Verification Checklist

- [ ] Filter button click has `e.stopPropagation()` AND `e.preventDefault()`
- [ ] `handleHeaderClick` is NOT called when clicking filter button
- [ ] `ColumnFilterModal.onApply` ONLY calls `setColumnFilters`
- [ ] `handleSave` doesn't modify sorting when only filters change
- [ ] No `useEffect` hooks react to filter changes and modify sorting
- [ ] TanStack Table config doesn't have side effects

## 🚀 Quick Fix Candidates

1. **If header click is triggered**: Improve event propagation stopping in filter button
2. **If handleSave modifies sorting**: Separate filter and sort save logic
3. **If useEffect triggers sort**: Review dependencies and side effects

## 📝 Reproduction Steps (to fill in)
1. [Exact steps to reproduce]
2. [Which column/filter type]
3. [Expected vs actual result]

