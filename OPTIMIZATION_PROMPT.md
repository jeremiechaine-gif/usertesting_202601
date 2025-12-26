# Prompt: Optimize and Harden Pelico Supply Prototype

## Context
You are working on the Pelico Supply prototype, a React 19.2.0 + TypeScript 5.9.3 application built with Vite 7.2.4. The project uses:
- **UI Framework**: Radix UI components + shadcn/ui (New York style)
- **Table Management**: TanStack React Table 8.21.3 (sorting, filtering, column resizing, pagination)
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React Context API (ScopeContext) + LocalStorage persistence
- **Testing**: Vitest + React Testing Library
- **Build**: Vite with code splitting (manual chunks for react-vendor, radix-ui, tanstack-table, lucide-icons)

## Current Architecture
- **Components**: Modular structure with `components/` (pages, modals, UI components)
- **Business Logic**: `lib/` (scopes, routines, users, teams, onboarding, filter definitions)
- **State Persistence**: LocalStorage for scopes, routines, users, teams, onboarding state
- **Features**: 
  - Supply page with advanced table (sorting, filtering, grouping, column resizing)
  - Scope & Routines management (CRUD, sharing with teams)
  - Users & Teams management
  - Onboarding wizard (3-step flow: Role → Intent → Review)
  - Routine library with scoring algorithm
  - Custom filter functions for complex conditions

## Objective
Optimize the codebase for **performance**, **robustness**, and **maintainability** without breaking existing functionality. Focus on:
1. **Performance**: Reduce bundle size, minimize re-renders, optimize table rendering
2. **Robustness**: Error handling, input validation, type safety, edge cases
3. **Maintenability**: Code organization, documentation, test coverage
4. **User Experience**: Loading states, error messages, accessibility

## Optimization Tasks

### Phase 1: Performance Optimization

#### 1.1 React Performance
- [ ] **Audit re-renders**: Use React DevTools Profiler to identify unnecessary re-renders
- [ ] **Memoization strategy**: 
  - Apply `React.memo` to pure presentational components (especially in table rows, filter chips, sort chips)
  - Use `useMemo` for expensive computations (filtering, sorting, grouping calculations)
  - Use `useCallback` for event handlers passed as props (especially in table components)
- [ ] **Context optimization**:
  - Split `ScopeContext` into smaller contexts if it causes unnecessary re-renders
  - Use context selectors or separate contexts for different concerns (scopes vs routines vs users)
  - Consider using `use-context-selector` or Zustand/Jotai for fine-grained subscriptions
- [ ] **Table virtualization**: 
  - Evaluate if `@tanstack/react-virtual` is needed for large datasets (>1000 rows)
  - Implement virtual scrolling only if performance metrics indicate it's necessary
  - Keep existing pagination as primary solution

#### 1.2 Bundle Size Optimization
- [ ] **Analyze bundle**: Run `npm run analyze` and review `dist/stats.html`
- [ ] **Tree-shaking audit**: 
  - Ensure all imports are tree-shakeable (use named imports from lucide-react, not default)
  - Check for unused dependencies
  - Remove any duplicate dependencies
- [ ] **Code splitting**:
  - Verify lazy loading is applied to heavy modals (`SortingAndFiltersPopover`, `ColumnFilterModal`, `RoutineModal`, `OnboardingRoutineBuilder`)
  - Consider lazy loading entire pages (HomePage, PurchaseOrderBookPage, ScopeAndRoutinesPage, UsersPage)
  - Split large utility files if they're not all needed at once
- [ ] **Asset optimization**:
  - Optimize SVG logos (use SVGO or inline critical SVGs)
  - Lazy load images if any are added
  - Consider using `?url` imports for assets

#### 1.3 Runtime Performance
- [ ] **Debounce/throttle**: 
  - Apply debouncing to search inputs (filter search, routine search)
  - Throttle scroll handlers if any
  - Debounce localStorage writes (batch multiple updates)
- [ ] **Computation optimization**:
  - Cache expensive filter/sort calculations
  - Optimize `scoreAndRankRoutines` if called frequently
  - Use Web Workers for heavy computations if needed (scoring, large data transformations)
- [ ] **Table performance**:
  - Ensure `getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel` are memoized
  - Review column definitions for unnecessary recalculations
  - Optimize custom filter functions (`customFilterFn`) for performance

### Phase 2: Robustness & Error Handling

#### 2.1 Error Boundaries
- [ ] **Add Error Boundaries**:
  - Create `ErrorBoundary` component wrapping major sections (pages, modals)
  - Provide user-friendly error messages with recovery options
  - Log errors to console (and future error tracking service)
- [ ] **Handle async errors**: Wrap all async operations (localStorage, data transformations) in try-catch

#### 2.2 Input Validation & Sanitization
- [ ] **Form validation**:
  - Add validation to all forms (ScopeModal, RoutineModal, UserModal, TeamModal)
  - Use Zod schemas for runtime validation (already have zod dependency)
  - Display clear error messages for invalid inputs
- [ ] **Data integrity**:
  - Validate data loaded from localStorage (handle corrupted/invalid JSON)
  - Validate routine/scopes/users/teams data structures
  - Provide fallback/default values for missing data
- [ ] **Type safety**:
  - Add stricter TypeScript types (avoid `any`, use `unknown` for external data)
  - Use type guards for runtime type checking
  - Add branded types for IDs (e.g., `type RoutineId = string & { __brand: 'RoutineId' }`)

#### 2.3 Edge Cases & Boundary Conditions
- [ ] **Empty states**: Ensure all empty states are handled gracefully (no scopes, no routines, no users, empty table)
- [ ] **Large datasets**: Test with large datasets (1000+ rows, 100+ routines/scopes)
- [ ] **Concurrent operations**: Handle rapid user interactions (multiple clicks, rapid filter changes)
- [ ] **Storage limits**: Handle localStorage quota exceeded errors gracefully
- [ ] **Network simulation**: Test behavior with slow/failed network if API calls are added later

#### 2.4 State Management Robustness
- [ ] **State synchronization**:
  - Ensure single source of truth for table state (sorting, filtering, pagination)
  - Prevent race conditions in state updates
  - Use functional updates (`setState(prev => ...)`) where appropriate
- [ ] **LocalStorage reliability**:
  - Handle localStorage unavailable (private browsing, disabled)
  - Implement fallback to in-memory storage
  - Add versioning for stored data (migration strategy for schema changes)
- [ ] **Routine/Scope consistency**:
  - Validate routine filters reference existing columns
  - Handle deleted columns gracefully (show warning, remove invalid filters)
  - Ensure scope filters are always valid

### Phase 3: Code Quality & Maintainability

#### 3.1 Code Organization
- [ ] **File structure**:
  - Review component file sizes (split files >500 LOC)
  - Extract custom hooks from large components (`useTableState`, `useRoutineManagement`, etc.)
  - Group related utilities in dedicated modules
- [ ] **Separation of concerns**:
  - Extract business logic from components to pure functions/hooks
  - Keep components focused on presentation
  - Move data transformations to utility functions
- [ ] **Naming consistency**:
  - Ensure consistent naming conventions (camelCase for functions, PascalCase for components)
  - Use descriptive names (avoid abbreviations unless widely understood)

#### 3.2 TypeScript Improvements
- [ ] **Strict mode**: Enable `strict: true` in `tsconfig.json` if not already
- [ ] **Type coverage**: Aim for 100% type coverage (use `typescript-coverage-report`)
- [ ] **Utility types**: Use TypeScript utility types (`Pick`, `Omit`, `Partial`, `Required`) where appropriate
- [ ] **Generic constraints**: Add proper generic constraints to reusable functions/components

#### 3.3 Documentation
- [ ] **JSDoc comments**: Add JSDoc to all exported functions, components, and complex logic
- [ ] **README updates**: Document architecture decisions, patterns, and conventions
- [ ] **Code comments**: Add comments for complex algorithms (scoring, filter logic)
- [ ] **Type documentation**: Use TypeScript comments for complex types

#### 3.4 Testing
- [ ] **Test coverage**: Aim for >80% coverage (currently have tests for scopes, routines, scoring, filters)
- [ ] **Integration tests**: Add tests for user flows (create routine, apply filters, share with team)
- [ ] **Component tests**: Test component interactions (modals, dropdowns, table interactions)
- [ ] **Edge case tests**: Test error scenarios, empty states, invalid inputs
- [ ] **E2E considerations**: Document critical paths for future E2E testing

### Phase 4: User Experience Enhancements

#### 4.1 Loading States
- [ ] **Skeleton loaders**: Add skeleton loaders for initial data load
- [ ] **Progress indicators**: Show progress for long operations (bulk routine creation, large filter operations)
- [ ] **Optimistic updates**: Implement optimistic updates for quick actions (toggle filter, apply routine)

#### 4.2 Error Messages
- [ ] **User-friendly errors**: Replace technical error messages with user-friendly ones
- [ ] **Error recovery**: Provide clear actions to recover from errors (retry, clear filters, reset)
- [ ] **Validation feedback**: Show inline validation errors as user types

#### 4.3 Accessibility (a11y)
- [ ] **ARIA labels**: Ensure all interactive elements have proper ARIA labels
- [ ] **Keyboard navigation**: Test and fix keyboard navigation (modals, dropdowns, table)
- [ ] **Focus management**: Ensure proper focus management (focus trap in modals, focus return on close)
- [ ] **Screen reader support**: Test with screen readers, add necessary ARIA attributes
- [ ] **Color contrast**: Verify color contrast meets WCAG AA standards (especially for badges, buttons)

#### 4.4 Performance Perceived
- [ ] **Smooth animations**: Ensure transitions are smooth (60fps)
- [ ] **Progressive enhancement**: Show content progressively (table rows, filter options)
- [ ] **Feedback on actions**: Provide immediate visual feedback for all user actions

### Phase 5: Security & Best Practices

#### 5.1 Security
- [ ] **XSS prevention**: Sanitize user inputs before rendering (especially in routine names, scope names)
- [ ] **CSRF considerations**: Document CSRF protection strategy for future API integration
- [ ] **Data validation**: Never trust localStorage data, always validate before use

#### 5.2 Best Practices
- [ ] **Environment variables**: Use `.env` files for configuration (API URLs, feature flags)
- [ ] **Feature flags**: Implement feature flag system for gradual rollouts
- [ ] **Logging**: Add structured logging (console in dev, future service in prod)
- [ ] **Analytics hooks**: Add analytics event tracking points (user actions, errors)

### Phase 6: Architecture Improvements

#### 6.1 State Management
- [ ] **Consider state management library**: Evaluate if Context API is sufficient or if Zustand/Jotai would help
- [ ] **Normalize data**: Consider normalizing nested data structures (routines with filters, scopes with filters)
- [ ] **State machines**: Consider XState for complex flows (onboarding wizard, modal states)

#### 6.2 Data Layer
- [ ] **Abstraction layer**: Create abstraction layer for storage (localStorage now, API later)
- [ ] **Data fetching**: Prepare for API integration (create service layer, use React Query when needed)
- [ ] **Caching strategy**: Implement caching strategy for routines, scopes, users

#### 6.3 Component Patterns
- [ ] **Compound components**: Use compound component pattern where appropriate (Dropdown, Modal)
- [ ] **Render props**: Consider render props for flexible components
- [ ] **Custom hooks**: Extract reusable logic to custom hooks (`useLocalStorage`, `useDebounce`, `useTableFilters`)

## Implementation Guidelines

### Do's ✅
- **Test before optimizing**: Run performance benchmarks before and after changes
- **Incremental changes**: Make small, focused changes and test after each
- **Preserve functionality**: Never break existing features
- **Document decisions**: Comment on why optimizations were made
- **Measure impact**: Use React DevTools Profiler, Lighthouse, Bundle Analyzer

### Don'ts ❌
- **Premature optimization**: Don't optimize without measuring first
- **Over-engineering**: Keep solutions simple and maintainable
- **Breaking changes**: Don't change APIs without migration path
- **Ignore tests**: Always update tests when changing behavior

## Success Criteria

### Performance Metrics
- [ ] Initial bundle size < 500KB (gzipped)
- [ ] Time to Interactive (TTI) < 3s
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] No unnecessary re-renders (verify with React DevTools)
- [ ] Table renders smoothly with 1000+ rows

### Robustness Metrics
- [ ] 100% error handling coverage (all async operations wrapped)
- [ ] 100% input validation (all forms validated)
- [ ] 0 TypeScript errors in strict mode
- [ ] All edge cases handled (empty states, invalid data, storage failures)

### Maintainability Metrics
- [ ] >80% test coverage
- [ ] All exported functions/components documented
- [ ] No files >500 LOC
- [ ] Consistent code style (use ESLint/Prettier)

## Execution Plan

1. **Phase 1 (Performance)**: Measure → Optimize → Measure again
2. **Phase 2 (Robustness)**: Add error boundaries → Add validation → Test edge cases
3. **Phase 3 (Maintainability)**: Refactor → Document → Test
4. **Phase 4 (UX)**: Add loading states → Improve errors → Enhance a11y
5. **Phase 5 (Security)**: Add validation → Sanitize inputs → Document
6. **Phase 6 (Architecture)**: Evaluate patterns → Refactor if needed → Document decisions

## Notes
- This is a **prototype**, balance optimization with development speed
- Focus on **high-impact, low-effort** optimizations first
- Some optimizations may be **overkill** for a prototype - use judgment
- **Document trade-offs** made (e.g., bundle size vs. code splitting complexity)
- Keep **backward compatibility** with existing localStorage data

## Tools & Resources
- **React DevTools Profiler**: Identify performance bottlenecks
- **Lighthouse**: Measure performance metrics
- **Bundle Analyzer**: Analyze bundle size (`npm run analyze`)
- **TypeScript Coverage**: `typescript-coverage-report`
- **Vitest Coverage**: `npm run test:coverage`
- **ESLint**: Code quality checks
- **Accessibility**: axe DevTools, WAVE

---

**Start with Phase 1.1 (React Performance Audit) and work through each phase systematically. Measure before and after each change to ensure improvements.**






