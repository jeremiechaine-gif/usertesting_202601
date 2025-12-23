# Optimization Roadmap

## Completed ✅

### Step 0: Behavior Contract
- ✅ Created comprehensive behavior contract document
- ✅ Documented all state flows, edge cases, and expected behaviors

### Step 1: Safety Nets
- ✅ Installed Vitest + React Testing Library
- ✅ Added unit tests for `routines.ts` and `scopes.ts`
- ✅ Configured rollup-plugin-visualizer
- ✅ Added manual chunks for vendor libraries
- ✅ Created `npm run analyze` script
- ✅ Initial bundle size improvement: Main chunk reduced from 537 KB to 322 KB

## Next Steps

### Step 2: Refactoring (High Priority)
**Goal**: Split large files into maintainable modules without behavior changes

#### `SortingAndFiltersPopover.tsx` (1037 LOC → target: ~200 LOC per file)
1. Create `src/components/sorting-filters/stateAdapters.ts`
   - `tableStateToDraftState()` - Convert TanStack state to modal draft state
   - `draftStateToTableState()` - Convert modal draft state to TanStack state
   - `normalizeFilters()` - Normalize filter values for comparison

2. Create `src/components/sorting-filters/SortingSection.tsx`
   - Extract sorting UI and logic
   - Props: `draftSorting`, `sortableColumns`, handlers

3. Create `src/components/sorting-filters/FiltersSection.tsx`
   - Extract filters UI and logic
   - Props: `draftFilters`, `filterDefinitions`, handlers

4. Create `src/components/sorting-filters/AddFilterView.tsx` (already exists, move to folder)
   - Keep existing component, move to organized folder

5. Create `src/components/sorting-filters/hooks/useSortingFiltersState.ts`
   - Custom hook for managing draft state
   - Handles sync with table state

#### `PurchaseOrderBookPage.tsx` (674 LOC → target: ~200 LOC per file)
1. Create `src/hooks/usePurchaseOrderTable.ts`
   - Extract table setup logic
   - Returns table instance and handlers

2. Create `src/hooks/useRoutineState.ts`
   - Extract routine selection and application logic
   - Handles scope-aware vs scope-fixed merging

3. Create `src/hooks/useScopeFilters.ts`
   - Extract scope filter application logic
   - Handles scope change effects

4. Create `src/components/purchase-order/TableToolbar.tsx`
   - Extract toolbar UI (GroupBy, SortingAndFiltersPopover, Search)

5. Create `src/components/purchase-order/TablePagination.tsx`
   - Extract pagination UI

6. Create `src/components/purchase-order/TableHeader.tsx`
   - Extract table header rendering

7. Create `src/components/purchase-order/TableBody.tsx`
   - Extract table body rendering

### Step 3: Bug Fixes
- Run full test suite
- Test sorting/filtering/resizing manually
- Fix any identified bugs
- Add regression tests

### Step 4: Performance Optimizations
1. **Memoization**
   - `useMemo` for `columns` definition
   - `useMemo` for `sortableColumns` in SortingAndFiltersPopover
   - `useCallback` for all event handlers passed to children
   - `React.memo` for `FilterRow`, `SortRow`, `ColumnHeader`

2. **Context Optimization**
   - Analyze ScopeContext rerenders
   - Split into `ScopeListContext` and `CurrentScopeContext` if needed
   - Use context selectors pattern

3. **Table Rendering**
   - Measure performance with large datasets
   - Add virtualization only if needed (react-window or @tanstack/react-virtual)

### Step 5: Bundle Size & Loading
1. **Lazy Loading**
   - `React.lazy` for `SortingAndFiltersPopover`
   - `React.lazy` for `ColumnFilterModal`
   - `React.lazy` for `RoutineModal`
   - Ensure Suspense boundaries with proper fallbacks

2. **Icon Optimization**
   - Replace barrel imports: `import { Icon } from 'lucide-react'`
   - Use per-icon imports: `import Icon from 'lucide-react/dist/esm/icons/icon'`
   - Or use dynamic imports for icons

3. **Further Chunking**
   - Split modals into separate chunks
   - Split page components if routing added

## Testing Strategy

### Unit Tests (Current: 13 tests)
- ✅ Scopes CRUD
- ✅ Routines CRUD
- ✅ Filter merging logic
- TODO: State adapter functions
- TODO: Normalization utilities

### Integration Tests (TODO)
- Table sorting via header
- Table filtering via header
- Modal sorting/filtering sync
- Scope change flow
- Routine application flow
- Column resizing

### E2E Tests (Optional)
- Full user flow: Select scope → Apply filters → Save routine
- Multi-sort workflow
- Filter merge priority verification

## Success Metrics

### Bundle Size
- **Target**: Main chunk < 250 KB (gzip < 80 KB)
- **Current**: 322 KB (gzip: 93.74 KB)
- **Improvement needed**: ~22% reduction

### Performance
- **Target**: No visible lag on table interactions
- **Target**: Modal open/close < 100ms
- **Target**: State sync < 50ms

### Test Coverage
- **Target**: > 80% coverage for critical paths
- **Current**: Core utilities covered
- **Need**: Table components, state management

## Risk Mitigation

### Regression Prevention
1. Run tests before/after each change
2. Manual testing checklist for critical paths
3. Behavior contract as reference
4. Incremental changes with commits

### Performance Monitoring
1. Use React DevTools Profiler
2. Monitor bundle size with each change
3. Test with realistic data volumes
4. Measure before/after metrics




