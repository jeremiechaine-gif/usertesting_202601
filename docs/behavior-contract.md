# Behavior Contract - Purchase Order Book Table

This document captures the expected behavior and edge cases for the table sorting, filtering, resizing, and state synchronization features. **Any optimization must preserve this behavior exactly.**

## State Ownership & Flow

### Table State (TanStack React Table)
- **Sorting**: `SortingState` - managed by `useState` in `PurchaseOrderBookPage`
- **Filters**: `ColumnFiltersState` - managed by `useState` in `PurchaseOrderBookPage`
- **Column Resizing**: Managed by TanStack Table internally, `columnResizeMode: 'onChange'`
- **Pagination**: Managed by TanStack Table, default pageSize: 100
- **Global Filter**: `useState` for search (currently not fully implemented)

### Scope State (Context API)
- **Current Scope ID**: Stored in `ScopeContext`, persisted to localStorage (`pelico-current-scope`)
- **Scope Filters**: Derived from `currentScope.filters`, converted to `ColumnFiltersState` format
- **Scope List**: Loaded from localStorage (`pelico-scopes`), managed in `ScopeContext`

### Routine State
- **Selected Routine ID**: `useState` in `PurchaseOrderBookPage` (NOT persisted)
- **Routine Data**: Loaded from localStorage (`pelico-routines`) on-demand
- **Routine Filters/Sorting**: Applied when routine is selected, merged with scope filters based on `scopeMode`

### Modal/Popover State (Draft State)
- **Draft Sorting**: `SortConfig[]` - local state in `SortingAndFiltersPopover`, synced from table state on open
- **Draft Filters**: `FilterConfig[]` - local state in `SortingAndFiltersPopover`, synced from table state on open
- **Has Draft Changes**: Tracks if draft differs from table state
- **Behavior**: Changes in modal are NOT applied until "Apply" is clicked (standard UX pattern)

## Sorting Behavior

### Single Sort
- Click column header: Toggle `none → asc → desc → none`
- Visual indicator: Arrow icon in header shows direction
- State: Stored in `SortingState` array

### Multi-Sort
- **Shift + Click**: Add additional sort (if `enableMultiSort: true`)
- Order matters: First sort is primary, subsequent sorts break ties
- Visual: Position badges (1, 2, 3...) show sort priority
- State: Array order determines sort priority

### Sorting via Modal
- Modal shows current sorts as `SortConfig[]` (draft state)
- User can add/remove/reorder sorts in modal
- Changes only applied when "Apply" button clicked
- Modal syncs with table state when opened (reads current `sorting` prop)
- Modal syncs when table state changes (e.g., from header clicks) - updates draft state

### Edge Cases
- Empty sort array: No sorting applied, natural data order
- Invalid column ID: Should be filtered out or ignored
- Column removed: Sort for that column should be removed or ignored

## Filtering Behavior

### Filter Logic
- **Multiple filters on different columns**: AND logic (all filters must match)
  - Example: `Type = PO` AND `Delivery Status = Pending` → shows rows matching BOTH
  - TanStack Table automatically applies AND logic between filters
- **Multiple values in a single filter**: OR logic (value must be in array)
  - Example: `Type = [PO, PR]` → shows rows where Type is PO OR PR
  - Implemented via `customFilterFn` which checks if cell value is in the array
- **Combined example**: `Type = [PO, PR]` AND `Delivery Status = [Pending, Shipped]`
  - Shows rows where: (Type is PO OR PR) AND (Delivery Status is Pending OR Shipped)
- **Condition objects**: Supports `{ condition: 'is' | 'isNot', values: [...] }`
  - `is`: value must be in the values array (OR logic within filter)
  - `isNot`: value must NOT be in the values array (negation of OR logic)
  - Default condition is `is` when condition is not specified

### Column Header Filter
- Click filter icon in header → Opens `ColumnFilterModal`
- Modal shows current filter values for that column
- Apply button updates `columnFilters` state immediately
- Filter value format:
  - Simple array: `{ id: 'columnId', value: ['val1', 'val2'] }` → OR logic
  - With condition: `{ id: 'columnId', value: { condition: 'isNot', values: ['val1'] } }` → condition-based filtering

### Filter via Modal
- Modal shows all active filters as `FilterConfig[]` (draft state)
- User can add/remove filters, edit values
- Changes only applied when "Apply" button clicked
- Modal syncs with table state when opened
- Modal syncs when table state changes (e.g., from column header filters)

### Scope Filters
- Scope filters are automatically applied when scope changes
- Scope filters merged with routine filters (if routine is scope-aware)
- Scope filters have lower priority than routine filters (routine overrides scope for same column)
- Scope filters format: `ScopeFilter[]` → converted to `ColumnFiltersState` by `getScopeFilters()`

### Routine Filters
- **Scope-aware routine**: Routine filters merged with current scope filters
- **Scope-fixed routine**: Routine filters merged with linked scope filters (if `linkedScopeId` exists)
- Routine filters have priority over scope filters for same column
- When routine selected: Applies routine's `filters` + `sorting` + `groupBy`

### Filter Merging Logic (`mergeFilters`)
- Start with routine filters (priority)
- Add scope filters that don't conflict (different column ID)
- If same column ID exists in both, routine filter wins

### Edge Cases
- Empty filter values array: Filter should be removed
- Filter for non-existent column: Should be ignored or removed
- Scope deleted: Current scope falls back to default scope or null
- Routine deleted: Selected routine ID cleared, falls back to scope-only filters

## Column Resizing Behavior

### Resize Handle
- Located at right edge of column header (0.5px width)
- Hover: Shows primary color, cursor changes to `col-resize`
- Active resize: Handle shows primary color
- Min width: 50px (from `defaultColumn.minSize`)
- Max width: 500px (from `defaultColumn.maxSize`)

### Resize Mode
- `columnResizeMode: 'onChange'` - updates width immediately during drag
- Width stored in TanStack Table's internal state
- **NOT persisted** to localStorage currently

### Layout Stability
- Table width: `table.getCenterTotalSize()` or `100%`
- Cells use `style={{ width: cell.column.getSize() }}`
- Headers use `style={{ width: header.getSize() }}`
- No layout jumps during resize (smooth transition)

### Edge Cases
- Resize below min: Should clamp to minSize (50px)
- Resize above max: Should clamp to maxSize (500px)
- Window resize: Table should maintain column proportions (not reset)

## State Synchronization

### Table ↔ Modal Sync
1. **Modal Opens**: Draft state initialized from table state (`sorting`, `columnFilters`)
2. **User Changes in Modal**: Only draft state updated, `hasDraftChanges = true`
3. **User Clicks Apply**: Draft state applied to table via `onSortingChange` / `onColumnFiltersChange`
4. **User Changes in Table Header**: Table state updated, modal draft state synced (if modal open)
5. **Modal Closes Without Apply**: Draft changes discarded, table state unchanged

### Scope Change Flow
1. User selects new scope → `setCurrentScopeId()` called
2. `ScopeContext` updates `currentScopeId`
3. `getScopeFilters()` returns new scope's filters
4. `PurchaseOrderBookPage` useEffect (line 163-178) applies scope filters:
   - If no routine: Apply scope filters directly
   - If routine is scope-aware: Merge routine filters with new scope filters
   - If routine is scope-fixed: No change (uses linked scope)

### Routine Change Flow
1. User selects routine → `setSelectedRoutineId()` called
2. `PurchaseOrderBookPage` useEffect (line 113-160) applies routine:
   - Load routine from localStorage
   - Apply routine's `sorting` and `groupBy`
   - Apply filters based on `scopeMode`:
     - `scope-aware`: Merge routine filters + current scope filters
     - `scope-fixed`: Merge routine filters + linked scope filters
   - Set `scopeOverridden` flag if scope-fixed

### Unsaved Changes Detection
- Compares current table state with active routine state
- Checks: `sorting`, `columnFilters`, `groupBy`
- Normalizes filters for comparison (handles object vs array formats)
- Shows badge "Unsaved changes" when routine active and state differs

## Persistence

### What's Persisted
- **Scopes**: Full scope objects in localStorage (`pelico-scopes`)
- **Routines**: Full routine objects in localStorage (`pelico-routines`)
- **Current Scope ID**: String ID in localStorage (`pelico-current-scope`)

### What's NOT Persisted
- Table sorting state (only via routines)
- Table filter state (only via scopes/routines)
- Column widths (not persisted)
- Selected routine ID (not persisted, resets on page reload)
- Pagination state (not persisted)

### Persistence Edge Cases
- localStorage full: Should catch error and log, not crash
- Invalid JSON: Should return empty array/default, not crash
- Scope/routine deleted: Current selection should fall back gracefully

## Keyboard Interactions

### Modal/Popover
- **Escape**: Close modal (or go back if in "add filter" view)
- **Tab**: Navigate between form elements
- **Enter**: Submit/Apply (if focused on button)

### Table Headers
- **Click**: Toggle sort (if sortable)
- **Shift + Click**: Add multi-sort (if `enableMultiSort: true`)
- **Click filter icon**: Open filter modal

## Performance Expectations

### Current Behavior (Baseline)
- Table renders all rows (no virtualization)
- Modal state syncs on every table state change (if modal open)
- Context updates trigger re-renders in all consumers
- No memoization of expensive computations

### Acceptable Performance
- Table with 1000+ rows should scroll smoothly
- Modal open/close should be instant (< 100ms)
- State sync should not cause visible lag
- No unnecessary re-renders of table rows

## Edge Cases Summary

1. **Empty States**: No scopes, no routines, no filters, no sorts
2. **Invalid Data**: Corrupted localStorage, missing scope/routine, invalid filter values
3. **Concurrent Changes**: User changes scope while routine selected, user changes filters in header while modal open
4. **State Conflicts**: Routine deleted while selected, scope deleted while current
5. **Browser Limits**: localStorage quota exceeded, window resize during resize drag
6. **Race Conditions**: Multiple rapid scope/routine changes, rapid filter apply/clear

## Testing Priorities

### Critical Paths (Must Test)
1. Sort via header → verify table updates → verify modal reflects change
2. Filter via header → verify table updates → verify modal reflects change
3. Sort via modal → apply → verify table updates
4. Filter via modal → apply → verify table updates
5. Change scope → verify filters update → verify routine merge works
6. Select routine → verify all state applies correctly
7. Column resize → verify width updates → verify layout stable

### Regression Tests
- Multi-sort order preserved
- Filter merge priority (routine > scope)
- Modal draft state syncs correctly
- Unsaved changes detection accurate
- localStorage persistence works
- Edge cases handled gracefully
